/**
 * FbPage.gs — publish the next few 'generated' items to your own Facebook Page.
 *
 * Only your own Page, which you administer — there is no safe way to auto-post
 * into other people's groups (that stays assisted in the side panel).
 * Needs a long-lived Page token with pages_manage_posts (see README).
 */

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
