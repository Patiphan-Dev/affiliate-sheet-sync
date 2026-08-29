/**
 * SheetLib.gs — generic Sheet helpers. Rows in/out as objects keyed by the
 * header row; the extension writes English headers, this layer only reads them.
 */

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบ tab: ' + name + ' — เปิด side panel แล้วกด "เชื่อมต่อ Google" ก่อน');
  return sh;
}

/** Create the sheet + header row if missing. Never overwrites an existing header. */
function ensureSheet_(name, headers) {
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  const width = Math.max(headers.length, sh.getLastColumn() || 1);
  const first = sh.getRange(1, 1, 1, width).getValues()[0];
  if (!first.join('')) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

/** All data rows as objects keyed by header. Each carries _row (1-based sheet row). */
function readObjects_(name) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const head = values[0];
  return values.slice(1).map(function (r, i) {
    const o = { _row: i + 2 };
    head.forEach(function (h, c) { if (h) o[h] = r[c]; });
    return o;
  });
}

function colIndex_(name, header) {
  const sh = sheet_(name);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const i = head.indexOf(header);
  if (i < 0) throw new Error('ไม่พบคอลัมน์ ' + header + ' ใน ' + name);
  return i + 1;
}

function setCell_(name, row, header, value) {
  sheet_(name).getRange(row, colIndex_(name, header)).setValue(value);
}

/** { 'shopee:<id>': productObj, 'lazada:<id>': productObj } for cross-tab lookup. */
function productIndex_() {
  const idx = {};
  readObjects_(T.shopee).forEach(function (p) { idx['shopee:' + p.item_id] = p; });
  readObjects_(T.lazada).forEach(function (p) { idx['lazada:' + p.item_id] = p; });
  return idx;
}
