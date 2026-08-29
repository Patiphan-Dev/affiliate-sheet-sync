/**
 * AllInOne.gs — every .gs file for Affiliate Sheet Sync concatenated into one,
 * so it can be pasted into a blank Apps Script project in a single step.
 * (Apps Script puts all .gs files in one shared scope anyway.)
 * Still add Admin.html separately (➕ → HTML → name it "Admin").
 */

// ═══════════════════════════════════════════════════════════════════════
// Config.gs
// ═══════════════════════════════════════════════════════════════════════
const PROP = PropertiesService.getScriptProperties();

const CFG = {
  geminiKey:   () => PROP.getProperty('GEMINI_API_KEY') || '',
  geminiModel: () => PROP.getProperty('GEMINI_MODEL') || 'gemini-2.0-flash',
  fbPageId:    () => PROP.getProperty('FB_PAGE_ID') || '',
  fbPageToken: () => PROP.getProperty('FB_PAGE_TOKEN') || '',
  postsPerRun: () => Number(PROP.getProperty('POSTS_PER_RUN') || 3),
  adminKey:    () => PROP.getProperty('ADMIN_KEY') || '', // gate for ?page=admin
};

// Tabs the extension owns (read-only from here) + the one this layer owns.
const T = {
  shopee:  'shopee_products',
  lazada:  'lazada_products',
  content: 'content', // owned by the automation layer; created on first run
};

// content.status:  '' (new) → 'generated' → 'posted'    content.hidden: '' | 'TRUE'
const CONTENT_COLS = ['item_id', 'platform', 'caption', 'status', 'caption_at', 'posted_at', 'fb_post_id', 'hidden'];

const CAPTION_PROMPT = [
  'เขียนแคปชั่นขายของภาษาไทยสำหรับโพสต์ Facebook 1 โพสต์',
  'โทน: เป็นกันเอง กระตุ้นให้กดซื้อ ไม่โอเวอร์ ไม่ใช้ศัพท์การตลาดเยอะ',
  'โครงสร้าง: hook 1 บรรทัด • จุดเด่น 2-3 bullet • ราคา (ถ้ามี) • CTA • hashtag 3-5 อัน',
  'ห้ามแต่งข้อมูลที่ไม่ได้ให้มา • ห้ามใส่ราคาถ้าไม่มีข้อมูลราคา • ตอบเฉพาะแคปชั่น',
].join('\n');


// ═══════════════════════════════════════════════════════════════════════
// SheetLib.gs
// ═══════════════════════════════════════════════════════════════════════
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


// ═══════════════════════════════════════════════════════════════════════
// WebApp.gs
// ═══════════════════════════════════════════════════════════════════════
function doGet(e) {
  const p = (e && e.parameter) || {};

  if (p.page === 'articles') {
    return ContentService
      .createTextOutput(JSON.stringify(buildArticles_()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (p.page === 'admin') {
    if (!CFG.adminKey() || p.key !== CFG.adminKey()) {
      return HtmlService.createHtmlOutput('<h2>unauthorized</h2><p>ต่อท้าย URL ด้วย <code>?page=admin&key=&lt;ADMIN_KEY&gt;</code></p>');
    }
    const t = HtmlService.createTemplateFromFile('Admin');
    t.adminKey = p.key;
    return t.evaluate()
      .setTitle('Affiliate Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // default + ?page=feed → JSON feed
  return ContentService
    .createTextOutput(JSON.stringify(buildFeed_(Number(p.limit) || 200)))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Visible products that have a link, joined with caption, newest first. */
function buildFeed_(limit) {
  // The `content` tab is created later by the automation layer — the feed must
  // work before then, so tolerate it being absent.
  const content = {};
  if (ss_().getSheetByName(T.content)) {
    readObjects_(T.content).forEach(function (r) { content[r.platform + ':' + r.item_id] = r; });
  }

  const items = [];
  [['shopee', T.shopee], ['lazada', T.lazada]].forEach(function (pair) {
    if (!ss_().getSheetByName(pair[1])) return; // tab not synced yet
    readObjects_(pair[1]).forEach(function (p) {
      const link = p.short_link || p.affiliate_url;
      if (!link) return;
      const c = content[pair[0] + ':' + p.item_id] || {};
      if (isTrue_(c.hidden)) return;
      items.push({
        platform: pair[0],
        id: String(p.item_id),
        name: p.name || '',
        price: Number(p.price) || null,
        original_price: Number(p.original_price) || null,
        discount: Number(p.discount) || null,
        commission: Number(p.commission_rate) || null,
        rating: Number(p.rating) || null,
        sold: Number(p.sold) || null,
        shop: p.shop || '',
        image: p.image_url || '',
        product_url: p.product_url || '',
        link: link,
        caption: c.caption || '',
        updated_at: p.updated_at || '',
      });
    });
  });

  items.sort(function (a, b) { return String(b.updated_at).localeCompare(String(a.updated_at)); });
  return { count: items.length, items: items.slice(0, limit) };
}

function isTrue_(v) {
  return v === true || String(v).trim().toLowerCase() === 'true';
}

/**
 * Articles for the website (reviews + buying guides). Reads an optional
 * `articles` tab; returns { items: [] } when the tab does not exist yet, so the
 * site falls back to its bundled seed guides.
 * Columns: kind | slug | title | ref_id | summary | body_html | faq_json | updated_at
 */
function buildArticles_() {
  const sh = ss_().getSheetByName('articles');
  if (!sh) return { items: [] };

  const rows = readObjects_('articles');
  const items = rows
    .filter(function (r) { return r.slug && r.title && r.body_html; })
    .map(function (r) {
      let faq = [];
      try { faq = r.faq_json ? JSON.parse(r.faq_json) : []; } catch (err) { faq = []; }
      return {
        kind: r.kind === 'guide' ? 'guide' : 'review',
        slug: String(r.slug),
        title: String(r.title),
        refId: String(r.ref_id || ''),
        summary: String(r.summary || ''),
        bodyHtml: String(r.body_html),
        faq: Array.isArray(faq) ? faq : [],
        updatedAt: String(r.updated_at || ''),
      };
    });
  return { items: items };
}


// ═══════════════════════════════════════════════════════════════════════
// Admin.gs
// ═══════════════════════════════════════════════════════════════════════
function guard_(key) {
  if (!CFG.adminKey() || key !== CFG.adminKey()) throw new Error('unauthorized');
}

function contentRow_(row) {
  const rec = readObjects_(T.content).filter(function (r) { return r._row === row; })[0];
  if (!rec) throw new Error('ไม่พบแถว ' + row);
  return rec;
}

/** Every content row joined with its product, plus headline counts. */
function adminData(key) {
  guard_(key);
  const products = productIndex_();
  const rows = readObjects_(T.content).map(function (r) {
    const p = products[r.platform + ':' + r.item_id] || {};
    return {
      row: r._row,
      id: String(r.item_id),
      platform: r.platform,
      name: p.name || '',
      price: Number(p.price) || null,
      commission: Number(p.commission_rate) || null,
      image: p.image_url || '',
      link: p.short_link || p.affiliate_url || '',
      caption: r.caption || '',
      status: r.status || '',
      hidden: isTrue_(r.hidden),
      posted_at: r.posted_at || '',
    };
  });

  const counts = { total: rows.length, needCaption: 0, ready: 0, posted: 0, hidden: 0 };
  rows.forEach(function (r) {
    if (r.hidden) counts.hidden++;
    if (!r.caption) counts.needCaption++;
    else if (r.status === 'posted') counts.posted++;
    else counts.ready++;
  });
  return { rows: rows, counts: counts };
}

function adminSaveCaption(key, row, caption) {
  guard_(key);
  setCell_(T.content, row, 'caption', caption);
  setCell_(T.content, row, 'status', caption ? 'generated' : '');
  setCell_(T.content, row, 'caption_at', new Date().toISOString());
  return true;
}

function adminToggleHidden(key, row, hidden) {
  guard_(key);
  setCell_(T.content, row, 'hidden', hidden ? 'TRUE' : '');
  return true;
}

/** Regenerate one caption right now. Returns the new text. */
function adminRegenerate(key, row) {
  guard_(key);
  const gk = CFG.geminiKey();
  if (!gk) throw new Error('ยังไม่ได้ตั้ง GEMINI_API_KEY');
  const rec = contentRow_(row);
  const p = productIndex_()[rec.platform + ':' + rec.item_id];
  if (!p) throw new Error('ไม่พบสินค้า id ' + rec.item_id);
  const caption = geminiCaption_(gk, p);
  if (!caption) throw new Error('gen ไม่สำเร็จ — ดู Executions log');
  setCell_(T.content, row, 'caption', caption);
  setCell_(T.content, row, 'status', 'generated');
  setCell_(T.content, row, 'caption_at', new Date().toISOString());
  return caption;
}

/** Post one item to the Page immediately, ignoring the schedule. */
function adminPostNow(key, row) {
  guard_(key);
  const pageId = CFG.fbPageId();
  const token = CFG.fbPageToken();
  if (!pageId || !token) throw new Error('ยังไม่ได้ตั้ง FB_PAGE_ID / FB_PAGE_TOKEN');

  const rec = contentRow_(row);
  if (!rec.caption) throw new Error('แถวนี้ยังไม่มีแคปชั่น');
  const p = productIndex_()[rec.platform + ':' + rec.item_id];
  if (!p) throw new Error('ไม่พบสินค้า id ' + rec.item_id);

  const link = p.short_link || p.affiliate_url || '';
  const message = rec.caption + (link ? '\n\n' + link : '');
  const id = p.image_url
    ? fbGraph_('/' + pageId + '/photos', token, { url: p.image_url, caption: message })
    : fbGraph_('/' + pageId + '/feed', token, { message: message });
  if (!id) throw new Error('FB ปฏิเสธ — ดู Executions log');

  setCell_(T.content, row, 'status', 'posted');
  setCell_(T.content, row, 'posted_at', new Date().toISOString());
  setCell_(T.content, row, 'fb_post_id', id);
  return id;
}

/** Run a scheduled job on demand from the admin console. */
function adminRunJob(key, job) {
  guard_(key);
  if (job === 'syncContent') return { ok: true, n: syncContent() };
  if (job === 'generateCaptions') return { ok: true, n: generateCaptions() };
  if (job === 'postNextToPage') return { ok: true, n: postNextToPage() };
  throw new Error('unknown job: ' + job);
}


// ═══════════════════════════════════════════════════════════════════════
// Captions.gs
// ═══════════════════════════════════════════════════════════════════════
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

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    CFG.geminiModel() + ':generateContent?key=' + key;

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: CAPTION_PROMPT + '\n\n---\n' + facts }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 500 },
    }),
  });

  if (res.getResponseCode() !== 200) {
    Logger.log('Gemini %s: %s', res.getResponseCode(), res.getContentText().slice(0, 300));
    return '';
  }
  const j = JSON.parse(res.getContentText());
  const parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
  return (parts && parts[0] && parts[0].text || '').trim();
}


// ═══════════════════════════════════════════════════════════════════════
// FbPage.gs
// ═══════════════════════════════════════════════════════════════════════
function postNextToPage() {
  const pageId = CFG.fbPageId();
  const token = CFG.fbPageToken();
  if (!pageId || !token) throw new Error('ยังไม่ได้ตั้ง FB_PAGE_ID / FB_PAGE_TOKEN');

  const products = productIndex_();
  const queue = readObjects_(T.content)
    .filter(function (r) { return r.status === 'generated' && r.caption && !isTrue_(r.hidden); })
    .slice(0, CFG.postsPerRun());

  let posted = 0;
  for (var i = 0; i < queue.length; i++) {
    const row = queue[i];
    const p = products[row.platform + ':' + row.item_id];
    if (!p) continue;

    const link = p.short_link || p.affiliate_url || '';
    const message = row.caption + (link ? '\n\n' + link : '');

    const postId = p.image_url
      ? fbGraph_('/' + pageId + '/photos', token, { url: p.image_url, caption: message })
      : fbGraph_('/' + pageId + '/feed', token, { message: message });
    if (!postId) continue;

    setCell_(T.content, row._row, 'status', 'posted');
    setCell_(T.content, row._row, 'posted_at', new Date().toISOString());
    setCell_(T.content, row._row, 'fb_post_id', postId);
    posted++;
    Utilities.sleep(2000);
  }
  return posted;
}

function fbGraph_(path, token, params) {
  const payload = { access_token: token };
  Object.keys(params).forEach(function (k) { payload[k] = params[k]; });

  const res = UrlFetchApp.fetch('https://graph.facebook.com/v21.0' + path, {
    method: 'post',
    muteHttpExceptions: true,
    payload: payload,
  });
  const body = res.getContentText();
  if (res.getResponseCode() !== 200) {
    Logger.log('FB %s: %s', res.getResponseCode(), body.slice(0, 400));
    return '';
  }
  const j = JSON.parse(body);
  return j.post_id || j.id || '';
}


// ═══════════════════════════════════════════════════════════════════════
// Triggers.gs
// ═══════════════════════════════════════════════════════════════════════
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncContent').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('generateCaptions').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('postNextToPage').timeBased().everyHours(3).create();
  return 'ok — 3 triggers installed';
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  return 'ok — all triggers removed';
}

/** Manual end-to-end run for testing (check View → Logs afterwards). */
function runOnceNow() {
  Logger.log('syncContent → %s', syncContent());
  Logger.log('generateCaptions → %s', generateCaptions());
  Logger.log('postNextToPage → %s', postNextToPage());
}


