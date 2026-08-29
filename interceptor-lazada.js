/**
 * interceptor.js — MAIN world content script (Lazada Affiliate / AdSense)
 *
 * Lazada's AdSense dashboard talks to an internal MTOP gateway whose response
 * shape is undocumented, so this interceptor is DISCOVERY-FIRST:
 *   1. fetch / XHR intercept — catch every client-side API call
 *   2. log each JSON response + auto-detect any array that looks like products
 *   3. DOM scraper fallback  — read rendered product cards directly
 *
 * Every captured response is logged with `[LazadaSync]` so the exact product
 * API and field names can be confirmed against real traffic, then the backend
 * mapper (db/mappers/lazada-product.ts) locked to those names.
 */
(function () {
  "use strict";

  // Guard against a second injection into the same page (extension reload, or a
  // sibling extension bundling the same file) — double-wrapped fetch/XHR hooks
  // race each other.
  if (window.__assInterceptorLazada) return;
  window.__assInterceptorLazada = true;

  console.log("[LazadaSync] interceptor.js loaded ✓ (namespaced)");

  // ─── 1. fetch interceptor ──────────────────────────────────────────────────
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await _fetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? "";

    if (shouldInspect(url)) {
      const ctype = response.headers.get("content-type") || "";
      if (ctype.includes("json")) {
        try {
          console.log("[LazadaSync] fetch →", url);
          dispatchCapture(url, await response.clone().json());
        } catch (_) {
          /* non-JSON */
        }
      }
    }
    return response;
  };

  // ─── 2. XHR interceptor ────────────────────────────────────────────────────
  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__url = String(url);
    return _open.call(this, method, url, ...rest);
  };

  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const url = this.__url ?? "";
    if (shouldInspect(url)) {
      this.addEventListener("load", () => {
        const ctype = this.getResponseHeader("content-type") || "";
        if (ctype.includes("json")) {
          try {
            console.log("[LazadaSync] XHR →", url);
            dispatchCapture(url, JSON.parse(this.responseText));
          } catch (_) {}
        }
      });
    }
    return _send.apply(this, args);
  };

  // Inspect every non-static request — Lazada routes API through several hosts
  // (adsense.lazada.co.th, acs*.lazada.co.th MTOP gateway, /h5/mtop...).
  function shouldInspect(url) {
    if (!url) return false;
    return !/\.(png|jpe?g|webp|gif|svg|css|woff2?|ttf|ico|mp4)(\?|$)/i.test(url);
  }

  // ─── Bulk "Get Link" capture (xlsx blob) ───────────────────────────────────
  // Select-All → Get Link builds an .xlsx client-side and downloads it via
  // URL.createObjectURL — it never hits getLink.json. Intercept that blob, parse
  // it in-page, and feed the links into the same backfill path as single links.
  const _createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    try {
      if (obj instanceof Blob) handlePromoBlob(obj);
    } catch (_) {}
    return _createObjectURL(obj);
  };

  async function handlePromoBlob(blob) {
    // Skip obvious media blobs to avoid reading large image/video buffers.
    if (/^(image|video|audio)\//.test(blob.type)) return;
    const buf = new Uint8Array(await blob.arrayBuffer());
    // .xlsx is a ZIP — magic bytes "PK\x03\x04". Skip anything else.
    if (!(buf[0] === 0x50 && buf[1] === 0x4b)) return;
    console.log(`[LazadaSync] 📦 blob ดักได้ (${buf.length} bytes) — กำลัง parse xlsx`);

    let rows;
    try {
      rows = await readXlsxRows(buf);
    } catch (e) {
      console.warn("[LazadaSync] 📦 parse xlsx ล้มเหลว:", e);
      return;
    }
    const links = rows
      .map((r) => ({
        itemId: String(r["item_id"] ?? "").trim(),
        affiliateUrl: String(r["promo_short_link"] ?? "").trim(),
        productUrl: String(r["product_url"] ?? "").trim() || null,
      }))
      .filter((l) => l.itemId && l.affiliateUrl);

    const withoutLink = rows.length - links.length;
    if (links.length === 0) {
      console.log(
        `[LazadaSync] 📦 xlsx มี ${rows.length} แถว แต่ไม่มี promo_short_link เลย (อาจไม่ใช่ไฟล์ลิงก์)`,
      );
      return;
    }
    console.log(
      `[LazadaSync] 🔗 captured ${links.length}/${rows.length} affiliate links (bulk xlsx)` +
        (withoutLink > 0 ? ` — ${withoutLink} แถวไม่มีลิงก์ (สร้างลิงก์ไม่ได้)` : ""),
    );
    window.postMessage({ __assLazadaLinks: true, links }, "*");
  }

  // ── minimal in-page .xlsx reader (ZIP + DecompressionStream + regex XML) ──
  async function readXlsxRows(buf) {
    const parts = await unzipEntries(buf, [
      "xl/sharedStrings.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    const shared = parseSharedStrings(parts["xl/sharedStrings.xml"]);
    const sheet = parts["xl/worksheets/sheet1.xml"];
    if (!sheet) throw new Error("no sheet1");

    const rawRows = [];
    for (const r of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const c of r[1].matchAll(/<c\s+r="([A-Z]+)\d+"[\s\S]*?(?:\/>|<\/c>)/g)) {
        cells[colIndex(c[1])] = cellValue(c[0], shared);
      }
      rawRows.push(cells);
    }
    const headers = (rawRows[0] ?? []).map((h) => (h ?? "").trim());
    return rawRows.slice(1).map((cells) => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = cells[i] ?? ""; });
      return obj;
    });
  }

  async function unzipEntries(buf, wanted) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const out = {};
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("no EOCD");
    let ptr = view.getUint32(eocd + 16, true);
    const count = view.getUint16(eocd + 10, true);
    const dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      if (view.getUint32(ptr, true) !== 0x02014b50) break;
      const method = view.getUint16(ptr + 10, true);
      const compSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localOff = view.getUint32(ptr + 42, true);
      const name = dec.decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));
      if (wanted.includes(name)) {
        const lNameLen = view.getUint16(localOff + 26, true);
        const lExtraLen = view.getUint16(localOff + 28, true);
        const start = localOff + 30 + lNameLen + lExtraLen;
        const raw = buf.subarray(start, start + compSize);
        out[name] = dec.decode(method === 0 ? raw : await inflateRaw(raw));
      }
      ptr += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  async function inflateRaw(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(
      new DecompressionStream("deflate-raw"),
    );
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function decodeEntities(s) {
    return s
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&amp;/g, "&");
  }
  function parseSharedStrings(xml) {
    if (!xml) return [];
    const out = [];
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const t = Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((x) => x[1]).join("");
      out.push(decodeEntities(t));
    }
    return out;
  }
  function colIndex(letters) {
    let idx = 0;
    for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
    return idx - 1;
  }
  function cellValue(cell, shared) {
    const type = /\st="([^"]+)"/.exec(cell)?.[1];
    if (type === "inlineStr") {
      const m = /<t[^>]*>([\s\S]*?)<\/t>/.exec(cell);
      return m ? decodeEntities(m[1]) : "";
    }
    const v = /<v>([\s\S]*?)<\/v>/.exec(cell);
    if (!v) return "";
    if (type === "s") return shared[Number(v[1])] ?? "";
    return decodeEntities(v[1]);
  }

  // ─── 3. DOM scraper (fallback only) ────────────────────────────────────────
  // The search API is the primary, reliable source. This fallback is scoped to
  // genuine product images (the "/p/" path) and only emits cards with a real
  // itemId, so it never relays nav/footer logos as bogus products.
  function scrapeDOM() {
    const imgs = Array.from(
      document.querySelectorAll('img[src*="slatic.net/p/"]'),
    );
    if (imgs.length === 0) {
      console.log("[LazadaSync] DOM: no product images found");
      return [];
    }

    const products = [];
    const seen = new Set();

    imgs.forEach((img) => {
      const imageUrl = img.src;
      if (seen.has(imageUrl)) return;
      seen.add(imageUrl);

      // Walk up to the product-card container (has price ฿ + commission %)
      let card = img.parentElement;
      for (let i = 0; i < 8 && card; i++) {
        const text = card.innerText || "";
        if (text.includes("฿") && text.includes("%")) break;
        card = card.parentElement;
      }
      if (!card) return;

      const text = card.innerText || "";
      const priceMatch = text.match(/฿\s*([\d,]+\.?\d*)/);
      const commMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);

      const lines = text
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 5 && !/^[฿%\d,. ]+$/.test(s));
      const name = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");

      // Lazada product links: /products/...-i{itemId}-s{skuId}.html
      let itemId = null;
      card.querySelectorAll("a[href]").forEach((a) => {
        const m = a.href.match(/-i(\d+)(?:-s\d+)?\.html/);
        if (m) itemId = m[1];
      });

      // Skip anything we can't tie to a real product id.
      if (!itemId) return;

      products.push({
        itemId,
        title: name || null,
        imageUrl,
        discountPrice: priceMatch
          ? priceMatch[1].replace(/,/g, "")
          : null,
        formatTotalCommissionRate: commMatch ? `${commMatch[1]}%` : null,
        __source: "dom",
      });
    });

    console.log("[LazadaSync] DOM scraped:", products.length, "products");
    products
      .slice(0, 3)
      .forEach((p) => console.log("[LazadaSync] sample:", JSON.stringify(p)));
    return products;
  }

  window.__assLazadaScan = function () {
    const products = scrapeDOM();
    if (products.length > 0) {
      window.postMessage(
        { __assLazada: true, url: "dom-scrape", products },
        "*",
      );
    }
    return products.length;
  };

  // ─── dispatch helper ───────────────────────────────────────────────────────
  function dispatchCapture(url, data) {
    // Discovery: surface any response that carries the category tree (id→name),
    // matched by URL OR content — Lazada may ship it via an unrelated endpoint
    // (or embed it in page props) rather than a "/category" call.
    maybeLogCategory(url, data);

    // The page's own getLink call (single "โปรโมต" or bulk "Get Link") returns
    // the real s.lazada.co.th tracking links — bx-signed, so it succeeds where
    // our forged calls failed. Harvest those links straight from the response.
    if (url.includes("/getLink.json")) {
      relayGetLink(data);
      return;
    }

    const found = findProductArray(data);
    if (!found) return;

    console.log(
      "[LazadaSync] ✅ products found in",
      url,
      "—",
      found.length,
      "items, keys:",
      Object.keys(found[0]),
    );
    window.postMessage({ __assLazada: true, url, products: found }, "*");
  }

  // Pull (itemId → real shortLink) out of a getLink response and relay them for
  // backfill onto the already-synced products.
  function relayGetLink(data) {
    const items = Array.isArray(data?.data) ? data.data : [];
    const links = items
      .filter((d) => d?.itemId && d?.shortLink)
      .map((d) => ({
        itemId: String(d.itemId),
        affiliateUrl: d.shortLink,
        productUrl: d.itemUrl || d.httpPdpLink || null,
      }));
    if (links.length === 0) return;

    console.log(`[LazadaSync] 🔗 captured ${links.length} affiliate links`);
    window.postMessage({ __assLazadaLinks: true, links }, "*");
  }

  // ─── Category discovery ────────────────────────────────────────────────────
  // Log any response that carries a category tree so its id→name mapping can be
  // wired in. Matched by URL or by content (category-name-ish keys).
  let __catLogged = false;
  function maybeLogCategory(url, data) {
    let json;
    try {
      json = JSON.stringify(data);
    } catch (_) {
      return;
    }
    const hit =
      /categor/i.test(url) ||
      /"(categoryName|catName|categoryTree|categoryList|leafCategor)/i.test(json);
    if (!hit) return;

    console.log(
      "%c[LazadaSync] 📂 CATEGORY-ish RESPONSE → " + url,
      "color:#F57224;font-weight:bold",
    );
    console.log(json.slice(0, 3000));
    __catLogged = true;
  }

  // Fallback: Lazada often embeds the category tree in page data rather than a
  // network call. Scan window globals + inline JSON for a category structure.
  function scanEmbeddedCategories() {
    if (__catLogged) return;
    try {
      const blobs = [];
      for (const k of Object.keys(window)) {
        if (/state|data|config|context|prop/i.test(k)) {
          try {
            const v = window[k];
            if (v && typeof v === "object") blobs.push(JSON.stringify(v));
          } catch (_) {}
        }
      }
      for (const s of document.querySelectorAll("script")) {
        const t = s.textContent || "";
        if (t.length < 500000 && /categoryName|catName|categoryTree/i.test(t)) blobs.push(t);
      }
      const hit = blobs.find((b) => /categoryName|catName|categoryTree/i.test(b));
      if (hit) {
        const m = hit.match(/[\[{][^]*?(categoryName|catName|categoryTree)[^]*/i);
        console.log(
          "%c[LazadaSync] 📂 CATEGORY (embedded in page) — snippet:",
          "color:#F57224;font-weight:bold",
        );
        console.log((m ? m[0] : hit).slice(0, 3000));
        __catLogged = true;
      } else {
        console.log("[LazadaSync] 📂 ยังไม่เจอ category tree — ลองเปิด dropdown หมวดหมู่ดู");
      }
    } catch (_) {}
  }

  /**
   * Recursively walk the response and return the first array whose elements
   * look like product offers. Lazada nests data unpredictably (data.result.*,
   * data.module.*, data.data.list, ...), so a generic walk beats a fixed path.
   */
  function findProductArray(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 6) return null;

    if (Array.isArray(node)) {
      if (node.length > 0 && looksLikeProduct(node[0])) return node;
      for (const el of node) {
        const hit = findProductArray(el, depth + 1);
        if (hit) return hit;
      }
      return null;
    }

    for (const value of Object.values(node)) {
      const hit = findProductArray(value, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  function looksLikeProduct(obj) {
    if (!obj || typeof obj !== "object") return false;
    const keys = Object.keys(obj).join(" ").toLowerCase();
    const hasId =
      /\b(item_?id|product_?id|sku_?id|offer_?id)\b/.test(keys) ||
      keys.includes("itemid") ||
      keys.includes("productid");
    const hasSignal =
      keys.includes("commission") ||
      keys.includes("price") ||
      keys.includes("title") ||
      keys.includes("productname");
    return hasId && hasSignal;
  }

  // ─── Auto-run after page settles ───────────────────────────────────────────
  function autoRun() {
    setTimeout(() => {
      const n = window.__assLazadaScan();
      if (n === 0) {
        console.log("[LazadaSync] DOM scan empty — retry in 3s");
        setTimeout(() => window.__assLazadaScan(), 3000);
      }
    }, 1500);
    setTimeout(scanEmbeddedCategories, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoRun);
  } else {
    autoRun();
  }
})();
