/**
 * sheet-store.js — the extension's data layer, backed entirely by one Google
 * Sheet the user owns. Replaces the old backend-api.js + REST endpoints.
 *
 * All writes are id-keyed upserts against the tabs declared in sheet-schema.js.
 * Reads return plain objects mapped from the header row.
 */

import * as api from './sheets-api.js';
import { TABS, TAB_NAMES, colLetter, serializeCell, parseSpreadsheetId } from './sheet-schema.js';

// ─── Config ──────────────────────────────────────────────────────────────────
export async function getSpreadsheetId() {
  const { spreadsheetUrl } = await chrome.storage.sync.get('spreadsheetUrl');
  return parseSpreadsheetId(spreadsheetUrl);
}

async function requireSpreadsheetId() {
  const id = await getSpreadsheetId();
  if (!id) throw new Error('ยังไม่ได้ตั้งลิงก์ Google Sheet ใน ⚙️');
  return id;
}

// Every mutation on a tab is read-modify-write (read column A, then append/patch),
// so two concurrent writers to the same tab would each miss the other's new rows
// and insert duplicates. Serialise all writes per tab.
const tabGates = new Map();
function withTabLock(tab, task) {
  const prev = tabGates.get(tab) ?? Promise.resolve();
  const run = prev.then(task, task);
  tabGates.set(tab, run.catch(() => {}));
  return run;
}

// Lazily create tabs on the first write of a session, so a user who pasted the
// Sheet URL but never pressed "เชื่อมต่อ Google" still gets working tabs.
let tabsReady = null;
function ensureReady() {
  if (!tabsReady) {
    tabsReady = ensureTabs().catch((e) => {
      tabsReady = null; // let the next call retry
      throw e;
    });
  }
  return tabsReady;
}

// ─── Setup ───────────────────────────────────────────────────────────────────
/** Create any missing tab and fill its header row. Safe to call repeatedly. */
export async function ensureTabs(id = null) {
  const sid = id ?? await requireSpreadsheetId();
  const meta = await api.getSpreadsheet(sid, 'sheets.properties.title');
  const present = new Set((meta.sheets ?? []).map((s) => s.properties.title));

  const addSheets = TAB_NAMES.filter((t) => !present.has(t)).map((title) => ({ addSheet: { properties: { title } } }));
  if (addSheets.length) await api.batchUpdate(sid, addSheets);

  const header = await api.batchGetValues(sid, TAB_NAMES.map((t) => `${t}!1:1`));
  const writes = [];
  (header.valueRanges ?? []).forEach((vr, i) => {
    const tab = TAB_NAMES[i];
    if (!vr.values?.[0]?.length) writes.push({ range: `${tab}!A1`, values: [TABS[tab]] });
  });
  if (writes.length) await api.batchUpdateValues(sid, writes);
  return { ok: true };
}

/** Lightweight reachability check for the panel's status dot. */
export async function ping() {
  const sid = await getSpreadsheetId();
  if (!sid) return { ok: false, reason: 'no-sheet' };
  try {
    await api.getSpreadsheet(sid, 'spreadsheetId');
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e.message ?? e) };
  }
}

// ─── Reads ───────────────────────────────────────────────────────────────────
/** Every data row of a tab as objects keyed by the header. */
export async function readObjects(tab) {
  const sid = await requireSpreadsheetId();
  await ensureReady();
  const cols = TABS[tab];
  const res = await api.getValues(sid, `${tab}!A2:${colLetter(cols.length)}`);
  return (res.values ?? []).map((row) => Object.fromEntries(cols.map((c, i) => [c, row[i] ?? ''])));
}

/** Read several tabs in one round trip → { [tab]: object[] }. */
export async function readObjectsMany(tabs) {
  const sid = await requireSpreadsheetId();
  await ensureReady();
  const ranges = tabs.map((t) => `${t}!A2:${colLetter(TABS[t].length)}`);
  const res = await api.batchGetValues(sid, ranges);
  const out = {};
  (res.valueRanges ?? []).forEach((vr, i) => {
    const cols = TABS[tabs[i]];
    out[tabs[i]] = (vr.values ?? []).map((row) => Object.fromEntries(cols.map((c, j) => [c, row[j] ?? ''])));
  });
  return out;
}

async function rowIndex(sid, tab) {
  const res = await api.getValues(sid, `${tab}!A2:A`);
  const map = new Map();
  (res.values ?? []).forEach((r, i) => {
    if (r[0] !== undefined && r[0] !== '') map.set(String(r[0]), i + 2); // 1-based, header is row 1
  });
  return map;
}

// ─── Writes ──────────────────────────────────────────────────────────────────
/**
 * Upsert objects into a tab by its primary-key column. Fills `updated_at` when
 * the tab has that column and the caller left it blank.
 * @returns {{updated:number, inserted:number}}
 */
export async function upsertById(tab, objects) {
  const list = (objects ?? []).filter(Boolean);
  if (!list.length) return { updated: 0, inserted: 0 };

  return withTabLock(tab, async () => {
    const sid = await requireSpreadsheetId();
    await ensureReady();
    const cols = TABS[tab];
    const idCol = cols[0];
    const stamped = cols.includes('updated_at');
    const now = new Date().toISOString();
    const existing = await rowIndex(sid, tab);

    const updates = [];
    const appends = [];
    let updated = 0;
    let inserted = 0;

    for (const obj of list) {
      const id = String(obj[idCol] ?? '').trim();
      if (!id) continue;
      const source = stamped && !obj.updated_at ? { ...obj, updated_at: now } : obj;
      const row = cols.map((c) => serializeCell(source[c]));
      const rn = existing.get(id);
      if (rn) {
        updates.push({ range: `${tab}!A${rn}`, values: [row] });
        updated++;
      } else {
        appends.push(row);
        existing.set(id, -1); // guard against a duplicate id inside the same batch
        inserted++;
      }
    }

    if (updates.length) await api.batchUpdateValues(sid, updates);
    if (appends.length) await api.appendValues(sid, `${tab}!A1`, appends);
    return { updated, inserted };
  });
}

/**
 * Patch a single column for rows that already exist, matched by primary key.
 * Used for affiliate-link backfill. Rows with no match are skipped (returned).
 * @param {{id:string, value:any}[]} entries
 * @returns {{updated:number, missing:string[]}}
 */
export async function patchColumnById(tab, column, entries) {
  const list = (entries ?? []).filter((e) => e && e.id != null && e.value != null && e.value !== '');
  if (!list.length) return { updated: 0, missing: [] };

  return withTabLock(tab, async () => {
    const sid = await requireSpreadsheetId();
    await ensureReady();
    const cols = TABS[tab];
    const ci = cols.indexOf(column);
    if (ci < 0) throw new Error(`ไม่มีคอลัมน์ ${column} ใน ${tab}`);
    const letter = colLetter(ci + 1);
    const stampLetter = cols.includes('updated_at') ? colLetter(cols.indexOf('updated_at') + 1) : null;
    const now = new Date().toISOString();
    const rows = await rowIndex(sid, tab);

    const data = [];
    const missing = [];
    for (const { id, value } of list) {
      const rn = rows.get(String(id));
      if (!rn) { missing.push(String(id)); continue; }
      data.push({ range: `${tab}!${letter}${rn}`, values: [[serializeCell(value)]] });
      if (stampLetter) data.push({ range: `${tab}!${stampLetter}${rn}`, values: [[now]] });
    }
    if (data.length) await api.batchUpdateValues(sid, data);
    return { updated: list.length - missing.length, missing };
  });
}

/** Append rows without any dedupe — for the post_log audit trail. */
export async function appendRows(tab, objects) {
  const list = (objects ?? []).filter(Boolean);
  if (!list.length) return 0;
  return withTabLock(tab, async () => {
    const sid = await requireSpreadsheetId();
    await ensureReady();
    const cols = TABS[tab];
    await api.appendValues(sid, `${tab}!A1`, list.map((o) => cols.map((c) => serializeCell(o[c]))));
    return list.length;
  });
}
