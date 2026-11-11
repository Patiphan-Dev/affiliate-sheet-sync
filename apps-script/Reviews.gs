/**
 * Reviews.gs — turns captured Shopee buyer reviews into the website's review
 * articles (kind = 'review' rows in the `articles` tab, keyed by ref_id = item id).
 * Scheduled by installTriggers() in Triggers.gs.
 */

const REVIEW_MIN_COMMENTS = 8;     // fewer than this is anecdote, not a summary
const REVIEW_MAX_COMMENTS = 60;    // prompt budget; newest first
const REVIEW_REFRESH_GROWTH = 1.5; // rewrite once the review pool grows by 50%
const REVIEW_ARTICLES_PER_RUN = 5; // stay well under the 6-minute Apps Script limit

/** Write or refresh review articles for products with enough reviews. Returns count written. */
function buildReviewArticles() {
  const key = CFG.geminiKey();
  if (!key) throw new Error('ยังไม่ได้ตั้ง GEMINI_API_KEY');
  if (!ss_().getSheetByName(T.reviews)) return 0; // extension has not captured any yet

  ensureSheet_(T.articles, ARTICLE_COLS);
  const byItem = reviewsByItem_(readObjects_(T.reviews));
  const existing = reviewArticlesByRef_();
  const products = productIndex_();
  let done = 0;

  Object.keys(byItem).forEach(function (itemId) {
    if (done >= REVIEW_ARTICLES_PER_RUN) return;
    const reviews = byItem[itemId];
    const prev = existing[itemId];
    if (!needsReviewArticle_(reviews.length, prev)) return;
    const product = products['shopee:' + itemId];
    if (!product) return;

    const article = writeReviewArticle_(key, product, reviews);
    if (!article) return;
    saveReviewArticle_(prev, itemId, article, reviews.length);
    done++;
    Utilities.sleep(1200); // stay under the Gemini free-tier request rate
  });
  return done;
}

function needsReviewArticle_(count, prev) {
  if (count < REVIEW_MIN_COMMENTS) return false;
  if (!prev) return true;
  return count >= (Number(prev.review_count) || 0) * REVIEW_REFRESH_GROWTH;
}

/** { itemId: review[] } newest first, empty comments dropped. */
function reviewsByItem_(rows) {
  const out = {};
  rows.forEach(function (r) {
    const id = String(r.item_id || '').trim();
    if (!id || !String(r.comment || '').trim()) return;
    (out[id] = out[id] || []).push(r);
  });
  Object.keys(out).forEach(function (id) {
    out[id].sort(function (a, b) { return String(b.reviewed_at).localeCompare(String(a.reviewed_at)); });
  });
  return out;
}

function reviewArticlesByRef_() {
  const out = {};
  readObjects_(T.articles).forEach(function (a) {
    if (a.kind === 'review' && a.ref_id) out[String(a.ref_id)] = a;
  });
  return out;
}

/** Ask Gemini for the article; returns sanitized fields, or null to skip this run. */
function writeReviewArticle_(key, p, reviews) {
  const stars = [0, 0, 0, 0, 0, 0];
  reviews.forEach(function (r) { stars[Number(r.rating_star) || 0]++; });
  const facts = [
    'ชื่อสินค้า: ' + p.name,
    p.price ? 'ราคา: ' + p.price + ' บาท' : '',
    p.rating ? 'คะแนนเฉลี่ยบน Shopee: ' + p.rating : '',
    'จำนวนรีวิวที่ใช้: ' + reviews.length + ' (5★ ' + stars[5] + ', 4★ ' + stars[4] + ', 3★ ' + stars[3] +
      ', 2★ ' + stars[2] + ', 1★ ' + stars[1] + ')',
  ].filter(String).join('\n');
  const lines = reviews.slice(0, REVIEW_MAX_COMMENTS).map(function (r) {
    return '- [' + (r.rating_star || '?') + '★' + (r.variation ? ' ' + r.variation : '') + '] ' +
      String(r.comment).replace(/\s+/g, ' ').slice(0, 500);
  });

  const raw = geminiGenerate_(key, REVIEW_PROMPT + '\n\n---\n' + facts + '\n\nรีวิว:\n' + lines.join('\n'),
    { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: 'application/json' });
  if (!raw) return null;

  let j;
  try {
    j = JSON.parse(raw);
  } catch (err) {
    Logger.log('review article JSON parse failed for %s: %s', p.item_id, String(err));
    return null;
  }
  const body = sanitizeArticleHtml_(j.body_html);
  if (!body || !j.title) return null;
  const faq = (Array.isArray(j.faq) ? j.faq : [])
    .map(function (f) { return { q: plainText_(f && f.q), a: plainText_(f && f.a) }; })
    .filter(function (f) { return f.q && f.a; });
  return { title: plainText_(j.title), summary: plainText_(j.summary).slice(0, 200), body: body, faq: faq };
}

function saveReviewArticle_(prev, itemId, a, reviewCount) {
  const row = {
    kind: 'review', slug: 'review-' + itemId, title: a.title, ref_id: itemId, summary: a.summary,
    body_html: a.body, faq_json: JSON.stringify(a.faq), updated_at: new Date().toISOString(),
    review_count: reviewCount,
  };
  const values = [ARTICLE_COLS.map(function (c) { return row[c]; })];
  const sh = sheet_(T.articles);
  const rowNum = prev ? prev._row : sh.getLastRow() + 1;
  sh.getRange(rowNum, 1, 1, ARTICLE_COLS.length).setValues(values);
}
