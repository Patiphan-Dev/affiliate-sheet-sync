/**
 * Admin.gs — server functions behind Admin.html. A web app with "Access: Anyone"
 * has no built-in auth, so every call re-checks ADMIN_KEY.
 */

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
