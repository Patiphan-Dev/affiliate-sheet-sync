/**
 * content.js — ISOLATED world content script
 *
 * interceptor.js (MAIN world) ดักจับ fetch/XHR แล้ว postMessage มา
 * content.js รับ message แล้วส่งต่อไป background service worker
 */
(function () {
  'use strict';

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    // After an extension reload, this script is orphaned in the still-open tab;
    // chrome.runtime.id becomes undefined and sending throws. Bail quietly.
    if (!chrome.runtime?.id) return;

    const data = event.data;
    if (data?.__assShopee && Array.isArray(data.products)) {
      chrome.runtime.sendMessage({
        type: 'SHOPEE_PRODUCTS_CAPTURED',
        products: data.products,
        url: data.url,
      });
    } else if (data?.__assShopeeLinks && Array.isArray(data.links)) {
      chrome.runtime.sendMessage({
        type: 'SHOPEE_SHORT_LINKS_CAPTURED',
        links: data.links,
      });
    }
  });
})();
