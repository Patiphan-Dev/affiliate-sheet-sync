/**
 * WebApp.gs — web-app entry point. This is the DATA API + admin console only;
 * the public landing page is the standalone `landing/index.html` hosted anywhere,
 * which fetches `?page=feed` from here.
 *
 *   (no params) / ?page=feed[&limit=N]  → JSON feed (public, CORS-open GET)
 *   ?page=admin&key=KEY                 → admin console (gated by ADMIN_KEY)
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: me · Who has access: Anyone.
 */

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
