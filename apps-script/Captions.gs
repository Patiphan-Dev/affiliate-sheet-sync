/**
 * Captions.gs — one `content` row per product, blank captions filled by Gemini.
 * Scheduled by installTriggers() in Triggers.gs.
 */

/** Add a content row for every product id not tracked yet. Returns count added. */
function syncContent() {
  ensureSheet_(T.content, CONTENT_COLS);

  const seen = {};
  readObjects_(T.content).forEach(function (r) { seen[String(r.item_id)] = true; });

  const add = [];
  [['shopee', T.shopee], ['lazada', T.lazada]].forEach(function (pair) {
    readObjects_(pair[1]).forEach(function (p) {
      const id = String(p.item_id || '').trim();
      if (id && !seen[id]) {
        seen[id] = true;
        const blank = CONTENT_COLS.map(function () { return ''; });
        blank[0] = id;
        blank[1] = pair[0];
        add.push(blank);
      }
    });
  });

  if (add.length) {
    const sh = sheet_(T.content);
    sh.getRange(sh.getLastRow() + 1, 1, add.length, CONTENT_COLS.length).setValues(add);
  }
  return add.length;
}

/** Fill caption for every content row that has none. Returns count generated. */
function generateCaptions() {
  const key = CFG.geminiKey();
  if (!key) throw new Error('ยังไม่ได้ตั้ง GEMINI_API_KEY');

  const products = productIndex_();
  let done = 0;

  readObjects_(T.content).forEach(function (row) {
    if (row.caption || row.status) return;
    const p = products[row.platform + ':' + row.item_id];
    if (!p) return;

    const caption = geminiCaption_(key, p);
    if (!caption) return;

    setCell_(T.content, row._row, 'caption', caption);
    setCell_(T.content, row._row, 'status', 'generated');
    setCell_(T.content, row._row, 'caption_at', new Date().toISOString());
    done++;
    Utilities.sleep(1200); // stay under the Gemini free-tier request rate
  });
  return done;
}

function geminiCaption_(key, p) {
  const facts = [
    'ชื่อสินค้า: ' + (p.name || '-'),
    p.price ? 'ราคา: ' + p.price + ' บาท' : '',
    p.commission_rate ? 'คอมมิชชั่น: ' + p.commission_rate + '%' : '',
  ].filter(String).join('\n');

  return geminiGenerate_(key, CAPTION_PROMPT + '\n\n---\n' + facts, { temperature: 0.9, maxOutputTokens: 500 });
}
