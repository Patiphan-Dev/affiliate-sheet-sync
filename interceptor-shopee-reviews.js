/**
 * interceptor-shopee-reviews.js — MAIN world content script on shopee.co.th.
 *
 * Passive only: it reads the `get_ratings` responses the product page already
 * loads while the user browses it, and never issues a request of its own.
 * Shopee runs anti-crawler checks on item pages; extra requests from here would
 * put the user's (affiliate) account at risk.
 *
 * Reviewer identity (username, user id, avatar) is dropped on purpose: the site
 * only needs what buyers said, not who said it.
 */
(function () {
  'use strict';

  if (window.__assInterceptorShopeeReviews) return;
  window.__assInterceptorShopeeReviews = true;

  const RATINGS_URL = /\/api\/v\d+\/item\/get_ratings\b/;

  function toReview(r) {
    const comment = String(r?.comment ?? '').trim();
    const cmtId = String(r?.cmtid ?? '').trim();
    const itemId = String(r?.itemid ?? '').trim();
    if (!comment || !cmtId || !itemId) return null;
    const ctime = Number(r.ctime);
    return {
      cmt_id: cmtId,
      item_id: itemId,
      shop_id: String(r.shopid ?? ''),
      rating_star: Number(r.rating_star) || '',
      comment,
      variation: String(r.product_items?.[0]?.model_name ?? ''),
      reviewed_at: Number.isFinite(ctime) && ctime > 0 ? new Date(ctime * 1000).toISOString() : '',
    };
  }

  function dispatchRatings(json) {
    const ratings = json?.data?.ratings;
    if (!Array.isArray(ratings)) return;
    const reviews = ratings.map(toReview).filter(Boolean);
    if (!reviews.length) return;
    console.log('[ShopeeSync] reviews captured:', reviews.length);
    window.postMessage({ __assShopeeReviews: true, reviews }, '*');
  }

  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url ?? '');
    if (RATINGS_URL.test(url)) {
      response.clone().json().then(dispatchRatings).catch((e) => console.warn('[ShopeeSync] ratings parse (fetch):', e));
    }
    return response;
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__assReviewsUrl = String(url);
    return _open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...body) {
    if (RATINGS_URL.test(this.__assReviewsUrl ?? '')) {
      this.addEventListener('load', () => {
        try {
          dispatchRatings(JSON.parse(this.responseText));
        } catch (e) {
          console.warn('[ShopeeSync] ratings parse (xhr):', e);
        }
      });
    }
    return _send.apply(this, body);
  };
})();
