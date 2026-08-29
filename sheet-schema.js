/**
 * sheet-schema.js — column layout of every tab the extension owns.
 *
 * The first column of each tab is its primary key: upserts read column A to
 * decide update-vs-append, so key order matters. `updated_at` is filled by the
 * store on write when the column exists.
 */

export const TABS = {
  shopee_products: ['item_id', 'name', 'price', 'original_price', 'discount', 'commission_rate', 'rating', 'sold', 'shop', 'image_url', 'product_url', 'short_link', 'updated_at'],
  lazada_products: ['item_id', 'name', 'price', 'original_price', 'discount', 'commission_rate', 'rating', 'sold', 'shop', 'image_url', 'product_url', 'affiliate_url', 'updated_at'],
  fb_groups:       ['group_id', 'name', 'url', 'updated_at', 'last_posted_at', 'post_count'],
  post_log:        ['posted_at', 'group_id', 'product_id', 'mode', 'caption_hash'],
};

export const TAB_NAMES = Object.keys(TABS);

/** 1-based column index → A1 letter (1→A, 27→AA). */
export function colLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Google Sheets rejects any cell over 50000 characters; a single fat raw offer
// would otherwise fail its whole 50-row batch and buffer it for endless retry.
const MAX_CELL_CHARS = 45000;

/** Cell value for the Sheets API: objects/arrays as JSON, nullish as '', capped. */
export function serializeCell(v) {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : v;
  if (typeof s === 'string' && s.length > MAX_CELL_CHARS) return s.slice(0, MAX_CELL_CHARS - 1) + '…';
  return s;
}

/** Extract the spreadsheet id from a full Sheets URL, or accept a bare id. */
export function parseSpreadsheetId(input) {
  if (!input) return null;
  const url = String(input).trim();
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(url) ? url : null;
}
