/**
 * capture-store.js — per-platform staging for products seen while browsing.
 *
 * Nothing here is sent anywhere. Products captured by the interceptors are held
 * locally until the user selects products on the platform and downloads their
 * links; only the selected ones are then saved, and the rest are swept away.
 *
 * State lives in chrome.storage.local because an MV3 service worker is evicted
 * between the browsing session and the download click, which would otherwise
 * wipe an in-memory buffer.
 */

const MAX_ENTRIES   = 3000;            // buffered products; oldest evicted first
const RESEND_BLOCK_MS = 10 * 60 * 1000; // window that suppresses a duplicate export
const WRITE_DEBOUNCE_MS = 800;

/**
 * @param {string} platform  storage namespace, e.g. 'shopee'
 * @param {(product: object) => string|null} itemId  reads the platform's id field
 */
export function createCaptureStore(platform, itemId) {
  const BUFFER_KEY  = `${platform}_buffer`;   // { [itemId]: product }
  const PENDING_KEY = `${platform}_pending`;  // { ids: string[], links: object[] }
  const SENT_KEY    = `${platform}_sent_ids`; // string[] — already saved this install

  let cache = null;       // Map<itemId, product> — mirror of BUFFER_KEY
  let writeTimer = null;

  async function load() {
    if (cache) return cache;
    const d = await chrome.storage.local.get(BUFFER_KEY);
    cache = new Map(Object.entries(d[BUFFER_KEY] ?? {}));
    return cache;
  }

  function scheduleWrite() {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(persist, WRITE_DEBOUNCE_MS);
  }

  // storage.local is capped at ~10MB and raw offers are fat, so a full buffer can
  // blow the quota. Trim the oldest quarter and retry rather than throwing away
  // the whole write (which would lose everything staged so far).
  async function persist() {
    if (!cache) return;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await chrome.storage.local.set({ [BUFFER_KEY]: Object.fromEntries(cache) });
        return;
      } catch (err) {
        const trim = Math.ceil(cache.size / 4);
        if (trim === 0) { console.warn(`[${platform}] buffer write failed:`, err); return; }
        console.warn(`[${platform}] storage เต็ม — ตัดสินค้าเก่าทิ้ง ${trim} ชิ้น`);
        for (const id of [...cache.keys()].slice(0, trim)) cache.delete(id);
      }
    }
  }

  function evictOverflow(buf) {
    // Map iterates in insertion order, so the first keys are the oldest captures.
    for (const id of buf.keys()) {
      if (buf.size <= MAX_ENTRIES) break;
      buf.delete(id);
    }
  }

  return {
    itemId,
    platform,

    /** Stage products locally. Returns the count of item ids not seen before. */
    async buffer(products) {
      const buf = await load();
      let added = 0;
      for (const product of products ?? []) {
        const id = itemId(product);
        if (!id) continue;
        if (!buf.has(id)) added++;
        buf.delete(id);        // re-insert so a refreshed item counts as newest
        buf.set(id, product);
      }
      if (products?.length) {
        evictOverflow(buf);
        scheduleWrite();
      }
      return added;
    },

    /** Buffered products for these ids (removal happens only once a save succeeds). */
    async peek(ids) {
      const buf = await load();
      const found = [];
      for (const id of ids) {
        const product = buf.get(String(id));
        if (product) found.push(product);
      }
      return found;
    },

    /** Drop products the backend has accepted. */
    async drop(ids) {
      const buf = await load();
      let dropped = 0;
      for (const id of ids) if (buf.delete(String(id))) dropped++;
      if (dropped) scheduleWrite();
      return dropped;
    },

    /**
     * Discard everything the user did NOT select — a download means "these are
     * the ones I want"; the rest were only ever browsed. Returns how many went.
     */
    async keepOnly(ids) {
      const buf = await load();
      const keep = new Set(ids.map(String));
      let swept = 0;
      for (const id of [...buf.keys()]) {
        if (keep.has(id)) continue;
        buf.delete(id);
        swept++;
      }
      if (swept) scheduleWrite();
      return swept;
    },

    async size() {
      return (await load()).size;
    },

    async clear() {
      cache = new Map();
      clearTimeout(writeTimer);
      await chrome.storage.local.remove([BUFFER_KEY, PENDING_KEY, SENT_KEY]);
    },

    // ─── Pending selection (survives a failed send + worker eviction) ─────────

    async getPending() {
      const d = await chrome.storage.local.get(PENDING_KEY);
      const p = d[PENDING_KEY] ?? {};
      return { ids: p.ids ?? [], links: p.links ?? [] };
    },

    async setPending({ ids, links }) {
      await chrome.storage.local.set({ [PENDING_KEY]: { ids, links } });
    },

    /** Merge a new download into whatever is still awaiting a successful send. */
    async mergePending({ ids, links }) {
      const prev = await this.getPending();
      const seen = new Set(prev.links.map(linkKey));
      const mergedLinks = [...prev.links];
      for (const link of links) {
        const key = linkKey(link);
        if (seen.has(key)) continue;
        seen.add(key);
        mergedLinks.push(link);
      }
      const merged = { ids: [...new Set([...prev.ids, ...ids])], links: mergedLinks };
      await this.setPending(merged);
      return merged;
    },

    // ─── Just-saved guard ────────────────────────────────────────────────────
    // Platforms fire the same export twice (API response + object-URL blob);
    // without this the second copy would re-send everything it just saved. The
    // guard EXPIRES on purpose — selecting the same product again days later is
    // a deliberate refresh (price/commission changed) and must go through.

    async filterUnsent(ids) {
      const sent = (await chrome.storage.local.get(SENT_KEY))[SENT_KEY] ?? {};
      const cutoff = Date.now() - RESEND_BLOCK_MS;
      return ids.filter(id => !(sent[String(id)] > cutoff));
    },

    async markSent(ids) {
      if (!ids.length) return;
      const sent = (await chrome.storage.local.get(SENT_KEY))[SENT_KEY] ?? {};
      const now = Date.now();
      const cutoff = now - RESEND_BLOCK_MS;
      for (const [id, at] of Object.entries(sent)) if (at <= cutoff) delete sent[id];
      for (const id of ids) sent[String(id)] = now;
      await chrome.storage.local.set({ [SENT_KEY]: sent });
    },
  };
}

function linkKey(link) {
  return JSON.stringify(link);
}
