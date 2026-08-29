/**
 * content.js — ISOLATED world content script (Lazada)
 *
 * interceptor.js (MAIN world) intercepts fetch/XHR and postMessages two kinds of
 * payload; this relays each to the background service worker:
 *   • __assLazada       — captured product offers (browse) → PRODUCTS_CAPTURED
 *   • __assLazadaLinks  — real affiliate links (getLink)   → LINKS_CAPTURED
 */
(function () {
  "use strict";

  function onMessage(event) {
    if (event.source !== window) return;

    // After an extension reload, this content script is orphaned in the still-open
    // tab. chrome.runtime.id becomes undefined; sending would throw "Extension
    // context invalidated". Bail quietly and stop listening (reload the tab to
    // re-inject a fresh script).
    if (!chrome.runtime?.id) {
      window.removeEventListener("message", onMessage);
      return;
    }

    const data = event.data;
    try {
      if (data?.__assLazada && Array.isArray(data.products)) {
        chrome.runtime.sendMessage({
          type: "LAZADA_PRODUCTS_CAPTURED",
          platform: "lazada",
          products: data.products,
          url: data.url,
        });
      } else if (data?.__assLazadaLinks && Array.isArray(data.links)) {
        chrome.runtime.sendMessage({
          type: "LAZADA_LINKS_CAPTURED",
          platform: "lazada",
          links: data.links,
        });
      }
    } catch (_) {
      window.removeEventListener("message", onMessage); // context gone mid-send
    }
  }

  window.addEventListener("message", onMessage);
})();
