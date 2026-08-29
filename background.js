/**
 * background.js — service worker for Affiliate Sheet Sync.
 *
 * Storage is a single Google Sheet the user owns (see sheet-store.js). This
 * worker only routes messages: Shopee/Lazada product syncing lives in
 * selection-sync.js, Facebook-group capture and the stats/queue reads live here.
 */

import {
  handleCapture, handleSelection, flushSelection,
  getPlatformStats, resetPlatform, refreshBadge,
} from './selection-sync.js';
import {
  ping as sheetPing, ensureTabs, upsertById, readObjectsMany, appendRows,
} from './sheet-store.js';
import { signIn, signOut } from './sheets-auth.js';
import { pushLog, broadcast } from './panel-log.js';

const fb = { seenUrls: new Set() };

// ─── Open side panel on action click ─────────────────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onStartup.addListener(refreshBadge);
chrome.runtime.onInstalled.addListener(refreshBadge);

// ─── Message router ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SHOPEE_PRODUCTS_CAPTURED':    handleCapture('shopee', msg.products); break;
    case 'SHOPEE_SHORT_LINKS_CAPTURED': handleSelection('shopee', msg.links);  break;
    case 'LAZADA_PRODUCTS_CAPTURED':    handleCapture('lazada', msg.products); break;
    case 'LAZADA_LINKS_CAPTURED':       handleSelection('lazada', msg.links);  break;
    case 'FB_GROUP_URLS_CAPTURED':      handleFbGroups(msg.groups ?? []);      break;

    case 'FLUSH_SHOPEE':  flushSelection('shopee').then(sendResponse); return true;
    case 'FLUSH_LAZADA':  flushSelection('lazada').then(sendResponse); return true;
    case 'RESET_SHOPEE':  resetPlatform('shopee').then(sendResponse);  return true;
    case 'RESET_LAZADA':  resetPlatform('lazada').then(sendResponse);  return true;
    case 'RESET_FB':
      fb.seenUrls.clear();
      chrome.storage.local.remove(['fb_backfilled', 'fb_last']);
      sendResponse({ ok: true }); break;

    case 'CONNECT_SHEET':   connectSheet().then(sendResponse);   return true;
    case 'DISCONNECT_SHEET': signOut().then(() => sendResponse({ ok: true })); return true;

    case 'GET_ALL_STATS':   getAllStats().then(sendResponse);    return true;
    case 'FETCH_DB_STATS':  getDbStats().then(sendResponse);     return true;
    case 'FB_SCAN_TAB':     scanFbTab(msg.tabId).then(sendResponse); return true;
    case 'PING':            checkPing().then(sendResponse);       return true;

    case 'FETCH_GROUP_QUEUE': fetchGroupQueue(msg.limit).then(sendResponse); return true;
    case 'MARK_GROUP_POSTED': markGroupPosted(msg.card).then(sendResponse);  return true;
  }
});

// ─── Connection ──────────────────────────────────────────────────────────────
async function connectSheet() {
  try {
    await signIn();       // pops Google consent the first time
    await ensureTabs();   // create tabs + headers on a fresh sheet
    pushLog('🟢 เชื่อมต่อ Google Sheet แล้ว — tab ถูกสร้างครบ');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message ?? e) };
  }
}

async function checkPing() {
  const res = await sheetPing();
  return { ok: res.ok, status: res.ok ? 200 : 0, reason: res.reason };
}

// ─── FB Groups ────────────────────────────────────────────────────────────────
function fbGroupId(url) {
  const m = String(url).match(/\/groups\/([^/?#]+)/);
  return m ? m[1] : null;
}

async function handleFbGroups(groups) {
  const fresh = groups.filter((g) => g.name && g.url && !fb.seenUrls.has(g.url));
  if (!fresh.length) return { updated: 0, total: 0 };
  fresh.forEach((g) => fb.seenUrls.add(g.url));

  let updated = 0;
  let inserted = 0;
  try {
    const rows = fresh
      .map((g) => ({ group_id: fbGroupId(g.url), name: g.name, url: g.url }))
      .filter((r) => r.group_id);
    ({ updated, inserted } = await upsertById('fb_groups', rows));
  } catch (e) {
    pushLog(`📘 FB: เขียน Sheet ล้มเหลว — ${String(e.message ?? e).slice(0, 120)}`);
    return { updated: 0, total: fresh.length };
  }

  const prev = (await chrome.storage.local.get('fb_backfilled')).fb_backfilled ?? 0;
  await chrome.storage.local.set({ fb_backfilled: prev + updated + inserted, fb_last: Date.now() });

  const parts = [];
  if (updated) parts.push(`อัพเดต ${updated}`);
  if (inserted) parts.push(`เพิ่มใหม่ ${inserted}`);
  pushLog(`📘 FB: พบ ${fresh.length} กลุ่ม → ${parts.length ? parts.join(', ') : 'ไม่มีการเปลี่ยนแปลง'}`);

  broadcast({ type: 'STAT_UPDATE', platform: 'fb', updated, inserted, total: fresh.length });
  return { updated, inserted, total: fresh.length };
}

async function scanFbTab(tabId) {
  try {
    const result = await chrome.tabs.sendMessage(tabId, { type: 'SCAN_NOW' });
    const groups = result?.groups ?? [];
    if (groups.length) await handleFbGroups(groups);
    return { groups: groups.length, ok: true };
  } catch {
    return { ok: false, error: 'ไม่สามารถเชื่อมต่อหน้า Facebook ได้ — refresh หน้าก่อน' };
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
async function getAllStats() {
  const d = await chrome.storage.local.get(['fb_backfilled', 'fb_sent', 'fb_last', 'log']);
  return {
    shopee: await getPlatformStats('shopee'),
    lazada: await getPlatformStats('lazada'),
    fb:     { backfilled: d.fb_backfilled ?? 0, sent: d.fb_sent ?? 0, lastAt: d.fb_last ?? null },
    log:    d.log ?? [],
  };
}

/** Panel's "DB" figures, now read straight off the Sheet (one round trip). */
async function getDbStats() {
  try {
    const t = await readObjectsMany(['shopee_products', 'lazada_products', 'fb_groups']);
    const shopee = t.shopee_products ?? [];
    const lazada = t.lazada_products ?? [];
    const groups = t.fb_groups ?? [];
    return {
      shopee: { total: shopee.length, withShortLink: shopee.filter((r) => r.short_link).length },
      lazada: { total: lazada.length, withLink: lazada.filter((r) => r.affiliate_url).length },
      fb:     { total: groups.length, withUrl: groups.filter((r) => r.url).length },
    };
  } catch (e) {
    return { error: String(e.message ?? e) };
  }
}

// ─── Group posting session ────────────────────────────────────────────────────
// TODO: cooldown + caption building still need the business rules that used to
// live server-side; until then the queue is empty and posting is disabled.
async function fetchGroupQueue() {
  return { ok: false, status: 0, cards: [], reason: 'คิวโพสต์ยังไม่ได้ย้ายมา Google Sheet' };
}

async function markGroupPosted(card) {
  try {
    await appendRows('post_log', [{
      posted_at:    new Date().toISOString(),
      group_id:     card.groupId ?? '',
      product_id:   card.productId ?? '',
      mode:         card.mode ?? '',
      caption_hash: card.captionHash ?? '',
    }]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message ?? e) };
  }
}
