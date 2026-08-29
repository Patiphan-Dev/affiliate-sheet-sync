/**
 * interceptor.js — MAIN world content script
 *
 * 3 strategies (runs all in parallel):
 *  1. window.__NEXT_DATA__  — SSR data embedded in HTML
 *  2. fetch / XHR intercept — catch any client-side API call
 *  3. DOM scraper           — read rendered product cards directly
 */
(function () {
  'use strict';

  // Guard against a second injection into the same page (extension reload, or a
  // sibling extension bundling the same file). Without this the fetch/XHR/blob
  // hooks get wrapped twice and captures race each other.
  if (window.__assInterceptorShopee) return;
  window.__assInterceptorShopee = true;

  console.log('%c[ShopeeSync] interceptor.js loaded ✓ (v5 — namespaced)', 'color:#EE4D2D;font-weight:bold');

  // ─── 1. __NEXT_DATA__ (Next.js SSR payload) ──────────────────────────────
  function checkNextData() {
    const nd = window.__NEXT_DATA__;
    if (!nd) { console.log('[ShopeeSync] no __NEXT_DATA__'); return; }

    console.log('[ShopeeSync] __NEXT_DATA__ found, page:', nd.page);
    const props = nd?.props?.pageProps ?? nd?.props ?? {};
    console.log('[ShopeeSync] pageProps keys:', Object.keys(props));
    dispatchCapture('__NEXT_DATA__', props);
  }

  // ─── 2. fetch interceptor ─────────────────────────────────────────────────
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await _fetch(...args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url ?? '');

    // Log EVERY non-static fetch so we can find the product API
    if (!url.match(/\.(png|jpg|webp|svg|css|woff|woff2|js)(\?|$)/)) {
      console.log('[ShopeeSync] fetch →', url);
      try {
        const clone = response.clone();
        const json  = await clone.json();
        dispatchCapture(url, json);
      } catch (_) { /* non-JSON */ }
    }

    return response;
  };

  // ─── 3. XHR interceptor ───────────────────────────────────────────────────
  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__url = String(url);
    return _open.call(this, method, url, ...rest);
  };

  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const url = this.__url ?? '';
    if (!url.match(/\.(png|jpg|webp|svg|css|woff|woff2|js)(\?|$)/)) {
      this.addEventListener('load', () => {
        console.log('[ShopeeSync] XHR →', url);
        // "รับลิงก์ทั้งหมด" returns the link export as CSV (not JSON) straight in
        // the XHR body — handle it separately before the JSON path.
        if (/batch_product_links/i.test(url)) {
          captureXhrCsv(this);
          return;
        }
        try {
          const json = JSON.parse(this.responseText);
          dispatchCapture(url, json);
        } catch (_) {}
      });
    }
    return _send.apply(this, args);
  };

  // ─── Bulk "รับลิงก์ทั้งหมด" capture (CSV blob) ─────────────────────────────
  // Select-All → รับลิงก์แบบทีเดียวทั้งหมด builds a .csv client-side and downloads
  // it via URL.createObjectURL. Intercept that blob, parse it in-page, and feed
  // the s.shopee.co.th short links into the backfill path — no manual upload.
  const _createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    try {
      if (obj instanceof Blob) handleLinkBlob(obj);
    } catch (_) {}
    return _createObjectURL(obj);
  };

  async function handleLinkBlob(blob) {
    // Skip obvious media blobs to avoid reading large image/video buffers.
    if (/^(image|video|audio)\//.test(blob.type)) return;

    let text;
    try {
      text = await blob.text();
    } catch (_) {
      return;
    }
    if (!/s\.shopee\.co\.th\//.test(text)) return; // not a link export

    const links = parseShopeeLinkCsv(text);
    if (links.length === 0) {
      console.log('[ShopeeSync] 📦 blob มี s.shopee แต่ parse ไม่ได้ (อาจคนละรูปแบบ)');
      return;
    }
    console.log('[ShopeeSync] 🔗 captured', links.length, 'short links (CSV)');
    window.postMessage({ __assShopeeLinks: true, links }, '*');
  }

  // CSV row → { item_id, short_link }. Robust to commas inside product names:
  // never split the row to find the link — regex the s.shopee link out of the
  // whole line, and read the item id from the leading numeric field (falling
  // back to the item id embedded in the product URL). Header/link-less rows skip.
  function parseShopeeLinkCsv(text) {
    const SHORT = /https?:\/\/s\.shopee\.co\.th\/[A-Za-z0-9]+/;
    const PID = /\/product\/\d+\/(\d+)/;
    const out = [];
    const seen = new Set();

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/^﻿/, '').trim();
      if (!line) continue;

      const short = line.match(SHORT);
      if (!short) continue;

      const lead = line.split(',', 1)[0].trim();
      const id = /^\d+$/.test(lead) ? lead : line.match(PID)?.[1];
      if (!id) continue;

      const key = id + '|' + short[0];
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ item_id: id, short_link: short[0] });
    }
    return out;
  }

  // Read the batch_product_links XHR body as CSV regardless of responseType,
  // extract the short links, and relay them. Logs a peek when it can't, so an
  // unexpected body shape is diagnosable instead of silently dropped.
  async function captureXhrCsv(xhr) {
    let text = null;
    try {
      const t = xhr.responseType;
      if (t === '' || t === 'text') text = xhr.responseText;
      else if (t === 'blob' && xhr.response) text = await xhr.response.text();
      else if (t === 'arraybuffer' && xhr.response) text = new TextDecoder().decode(xhr.response);
      else if (t === 'json') text = JSON.stringify(xhr.response);
    } catch (e) {
      console.log('[ShopeeSync] link CSV: read failed —', e && e.message, '(responseType:', xhr.responseType, ')');
      return;
    }
    if (!text) {
      console.log('[ShopeeSync] link CSV: empty body (responseType:', xhr.responseType, ')');
      return;
    }

    // Shopee returns a JSON pointer to the CSV file, not the CSV itself:
    //   {"code":0,"data":{"result":"https://affiliate.shopee.co.th/.../xxx.csv"}}
    // Fetch that file (same origin → cookies included) and parse its body.
    try {
      const j = JSON.parse(text);
      const fileUrl = j?.data?.result;
      if (typeof fileUrl === 'string' && /\.csv(\?|$)/i.test(fileUrl)) {
        const res = await _fetch(fileUrl, { credentials: 'include' });
        text = await res.text();
      }
    } catch (e) {
      // Not JSON, or the file fetch failed — fall through and try `text` as CSV.
      if (e && e.message) console.log('[ShopeeSync] link CSV: file fetch issue —', e.message);
    }

    if (!/s\.shopee\.co\.th\//.test(text)) {
      console.log('[ShopeeSync] link CSV: no s.shopee links — peek:', text.slice(0, 300));
      return;
    }
    const links = parseShopeeLinkCsv(text);
    if (links.length === 0) {
      console.log('[ShopeeSync] link CSV: parsed 0 links — peek:', text.slice(0, 300));
      return;
    }
    console.log('[ShopeeSync] 🔗 captured', links.length, 'short links (CSV via XHR)');
    window.postMessage({ __assShopeeLinks: true, links }, '*');
  }

  // ─── 4. DOM scraper ───────────────────────────────────────────────────────
  function scrapeDOM() {
    // Anchor on Shopee CDN images — always present on product cards
    const imgs = Array.from(document.querySelectorAll('img[src*="cf.shopee.co.th/file/"]'));
    if (imgs.length === 0) {
      console.log('[ShopeeSync] DOM: no Shopee CDN images found');
      return [];
    }

    const products = [];
    const seen = new Set();

    imgs.forEach(img => {
      const imageUrl = img.src;
      if (seen.has(imageUrl)) return;
      seen.add(imageUrl);

      // Walk up to find the product card container
      let card = img.parentElement;
      for (let i = 0; i < 8; i++) {
        if (!card) break;
        const text = card.innerText || '';
        // Card should contain price + commission text
        if (text.includes('฿') && text.includes('%')) break;
        card = card.parentElement;
      }
      if (!card) return;

      const text = card.innerText || '';

      // Extract price ฿XX.XX or ฿XX,XXX
      const priceMatch = text.match(/฿\s*([\d,]+\.?\d*)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

      // Extract commission rate
      const commMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
      const commRate = commMatch ? parseFloat(commMatch[1]) : null;

      // Longest text fragment = product name (heuristic)
      const lines = text.split('\n').map(s => s.trim()).filter(s => s.length > 5 && !s.match(/^[฿%\d,. ]+$/) && !s.includes('ลิงก์') && !s.includes('เลือก'));
      const name = lines.reduce((a, b) => a.length >= b.length ? a : b, '');

      // Extract item_id / shop_id from any link href on the card
      let itemId = null, shopId = null;
      const links = card.querySelectorAll('a[href]');
      links.forEach(a => {
        const m = a.href.match(/\/product\/(\d+)\/(\d+)/);
        if (m) { shopId = m[1]; itemId = m[2]; }
      });

      // Also try data attributes
      const withData = card.querySelector('[data-item-id],[data-itemid],[data-product-id]');
      if (withData) {
        itemId = itemId || withData.dataset.itemId || withData.dataset.itemid || withData.dataset.productId;
      }

      products.push({
        image_url:       imageUrl,
        name:            name || null,
        price:           price,
        commission_rate: commRate,
        source_item_id:  itemId,
        source_shop_id:  shopId,
      });
    });

    console.log('[ShopeeSync] DOM scraped:', products.length, 'products');
    products.slice(0, 3).forEach(p => console.log('[ShopeeSync] sample:', JSON.stringify(p)));
    return products;
  }

  // ─── Expose for content.js to call via postMessage ────────────────────────
  window.__assShopeeScan = function () {
    const products = scrapeDOM();
    if (products.length > 0) {
      window.postMessage({ __assShopee: true, url: 'dom-scrape', products }, '*');
    }
    return products.length;
  };

  // ─── dispatch helper ──────────────────────────────────────────────────────
  function dispatchCapture(url, data) {
    // Check for products in any known Shopee response shape
    const candidates = [
      data?.data?.product_offer_list,
      data?.data?.offer_list,
      data?.data?.items,
      data?.data?.list,
      data?.data?.products,
      data?.data?.product_list,
      data?.data?.offers,
      data?.result?.product_offer_list,
      data?.result?.items,
      data?.result?.list,
      data?.items,
      data?.list,
      data?.products,
      data?.offers,
      // Next.js pageProps direct arrays
      ...Object.values(data || {}).filter(Array.isArray),
    ];

    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0 && looksLikeProduct(c[0])) {
        console.log('[ShopeeSync] products found in', url, '—', c.length, 'items, keys:', Object.keys(c[0]));
        console.log('[ShopeeSync] FIRST PRODUCT RAW:', JSON.stringify(c[0]));
        window.postMessage({ __assShopee: true, url, products: c }, '*');
        return;
      }
    }
  }

  function looksLikeProduct(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const keys = Object.keys(obj).join(' ').toLowerCase();
    return keys.includes('item_id') || keys.includes('itemid') ||
           keys.includes('product_id') || keys.includes('offer_id');
  }

  // ─── Auto-run after page settles ─────────────────────────────────────────
  function autoRun() {
    checkNextData();
    setTimeout(() => {
      const n = window.__assShopeeScan();
      if (n === 0) {
        console.log('[ShopeeSync] DOM scan found nothing — will retry after 3s');
        setTimeout(() => window.__assShopeeScan(), 3000);
      }
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRun);
  } else {
    autoRun();
  }
})();
