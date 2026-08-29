/**
 * selection-sync.js — capture-then-confirm sync for Shopee and Lazada.
 *
 * Browsing a platform NEVER writes to the backend: captured products are only
 * staged in capture-store.js. A product is saved when the user selects items on
 * the platform and downloads their affiliate links ("รับลิงก์" / "Get Link") —
 * that export lists exactly what was ticked. On download we:
 *
 *   1. save the selected products,
 *   2. backfill their affiliate links,
 *   3. sweep every unselected product out of the buffer (the user passed on them).
 *
 * Same shape as the autopost-saas extension, generalised over both platforms.
 */

import { createCaptureStore } from './capture-store.js';
import { upsertById, patchColumnById } from './sheet-store.js';
import { pushLog, broadcast } from './panel-log.js';

const BATCH_SIZE = 50;

// Per-platform differences, kept in one place so the flow below stays generic.
// `toRow` flattens a raw platform offer into readable columns (see sheet-schema.js).
const PLATFORMS = {
  shopee: {
    label: 'Shopee',
    tab: 'shopee_products',
    store: createCaptureStore('shopee', p => idOrNull(shopeeCard(p).itemid ?? p?.item_id ?? p?.source_item_id)),
    linkItemId: l => idOrNull(l?.item_id),
    linkIsComplete: l => !!l?.short_link,
    linkColumn: 'short_link',
    linkValue: l => l.short_link,
    toRow: p => {
      const c = shopeeCard(p);
      const original = microBaht(c.price_min_before_discount ?? c.price_before_discount ?? c.price_max_before_discount);
      const discount = pctNum(c.discount ?? c.raw_discount ?? c.show_discount);
      return {
        item_id:         idOrNull(c.itemid ?? p?.item_id ?? p?.source_item_id),
        name:            c.name ?? p?.name ?? p?.title ?? null,
        price:           shopeePrice(microBaht(c.price_min ?? c.price ?? c.price_max ?? p?.price), original, discount),
        original_price:  original,
        discount:        discount,
        commission_rate: pctNum(p?.seller_commission_rate ?? p?.default_commission_rate ?? p?.commission_rate ?? p?.max_commission_rate),
        rating:          round1(c.item_rating?.rating_star),
        sold:            numOrNull(c.historical_sold ?? c.sold),
        shop:            c.shop_name ?? p?.shop_name ?? null,
        image_url:       shopeeImg(c.image ?? (Array.isArray(c.images) ? c.images[0] : null) ?? p?.image),
        product_url:     p?.product_link ?? p?.product_url ??
                         (c.shopid && c.itemid ? `https://shopee.co.th/product/${c.shopid}/${c.itemid}` : null),
      };
    },
  },
  lazada: {
    label: 'Lazada',
    tab: 'lazada_products',
    store: createCaptureStore('lazada', p => idOrNull(p?.itemId ?? p?.item_id ?? p?.productId ?? p?.id)),
    linkItemId: l => idOrNull(l?.itemId),
    linkIsComplete: l => !!l?.affiliateUrl,
    linkColumn: 'affiliate_url',
    linkValue: l => l.affiliateUrl,
    toRow: p => ({
      item_id:         idOrNull(p?.itemId ?? p?.item_id ?? p?.productId ?? p?.id),
      name:            p?.name ?? p?.title ?? p?.productName ?? p?.itemName ?? null,
      price:           numOrNull(p?.priceNumber ?? p?.price ?? p?.discountPrice ?? p?.salePrice ?? p?.priceShow),
      original_price:  numOrNull(p?.originalPriceNumber ?? p?.originalPrice ?? p?.originalPriceShow ?? p?.listPrice ?? p?.priceBeforeDiscount),
      discount:        pctNum(p?.discount ?? p?.discountPercent ?? p?.discountRate),
      commission_rate: pctNum(p?.formatTotalCommissionRate ?? p?.commissionRate ?? p?.commission_rate ?? p?.commission ?? p?.payoutRate),
      rating:          round1(p?.ratingScore ?? p?.rating ?? p?.averageStar),
      sold:            numOrNull(p?.sold ?? p?.itemSoldCntShow ?? p?.soldCount),
      shop:            p?.sellerName ?? p?.shopName ?? p?.brandName ?? null,
      image_url:       withHttps(p?.image ?? p?.imageUrl ?? p?.mainImage ?? p?.image_url ?? p?.itemImg),
      product_url:     p?.itemUrl ?? p?.productUrl ?? p?.httpPdpLink ?? p?.product_url ?? null,
    }),
  },
};

function idOrNull(id) {
  return id === undefined || id === null || String(id).trim() === '' ? null : String(id).trim();
}

/** Plain number from "฿1,234", "5%", 1234 … or null. */
function numOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** "7%" / "7" / 7 → 7 */
function pctNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? n : null;
}

/** Shopee stores prices ×100000 ("12500000" → 125.00). */
function microBaht(v) {
  const n = numOrNull(v);
  return n === null ? null : Math.round(n / 1000) / 100;
}

/**
 * A ฿0–1 headline price is almost always a Shopee new-user / exclusive-price
 * artifact (the card still shows a real price). Fall back to the price Shopee
 * actually displays: before-discount price minus the card discount %.
 */
function shopeePrice(price, original, discountPct) {
  if (price != null && price >= 10) return price;
  if (original != null && original > 50) {
    return discountPct != null ? Math.round(original * (1 - discountPct / 100)) : original;
  }
  return price;
}

function round1(v) {
  const n = numOrNull(v);
  return n === null ? null : Math.round(n * 10) / 10;
}

/** Shopee image field is a file hash, not a URL. */
function shopeeImg(hash) {
  if (!hash) return null;
  return /^https?:/i.test(hash) ? hash : `https://down-th.img.susercontent.com/file/${hash}`;
}

function withHttps(url) {
  if (!url) return null;
  return url.startsWith('//') ? `https:${url}` : url;
}

/** Real Shopee offer data lives one level down, under this key. */
function shopeeCard(p) {
  return (p && p.batch_item_for_item_card_full) || p || {};
}

// One-at-a-time gate per platform: the pending selection is read-modify-written
// in storage, so overlapping runs would drop or duplicate entries.
const gates = { shopee: Promise.resolve(), lazada: Promise.resolve() };
function serialize(platform, task) {
  const run = gates[platform].then(task, task);
  gates[platform] = run.catch(() => {});
  return run;
}

// ─── Capture — buffer only, never send ────────────────────────────────────────
export async function handleCapture(platform, products) {
  const { label, store } = PLATFORMS[platform];
  const added = await store.buffer(products);
  if (!added) return;
  const size = await store.size();
  pushLog(`👀 เห็นสินค้า ${label} ${added} ชิ้น — เก็บไว้ในเครื่อง (${size}) ยังไม่บันทึก`);
  await refreshBadge();
  broadcast({ type: 'STAT_UPDATE', platform, sent: 0 });
}

// ─── Download — save the selection, sweep the rest ────────────────────────────
export function handleSelection(platform, links) {
  const cfg = PLATFORMS[platform];
  const valid = (links ?? []).filter(l => cfg.linkItemId(l) && cfg.linkIsComplete(l));
  if (!valid.length) return Promise.resolve({ sent: 0 });

  return serialize(platform, async () => {
    // The platforms emit the same export twice (API response + object-URL blob);
    // ids already saved are dropped so the second copy is a no-op.
    const allIds = [...new Set(valid.map(cfg.linkItemId))];
    const ids = await cfg.store.filterUnsent(allIds);
    if (!ids.length) return { sent: 0 };

    const keep = new Set(ids);
    const fresh = valid.filter(l => keep.has(cfg.linkItemId(l)));
    const pending = await cfg.store.getPending();
    const swept = await cfg.store.keepOnly([...ids, ...pending.ids]);

    await cfg.store.mergePending({ ids, links: fresh });
    pushLog(`📥 ${cfg.label}: ดาวน์โหลดลิงก์ ${ids.length} สินค้า` +
            (swept ? ` — ทิ้งที่ไม่ได้เลือก ${swept} ชิ้น` : ''));
    return sendPending(platform);
  });
}

export function flushSelection(platform) {
  return serialize(platform, () => sendPending(platform));
}

/**
 * Sends what the last download selected and has not been confirmed saved yet.
 * Products go first so the link backfill has rows to match against; both steps
 * write back only what still failed, so the next call retries just that.
 */
async function sendPending(platform) {
  const cfg = PLATFORMS[platform];
  const pending = await cfg.store.getPending();
  if (!pending.ids.length && !pending.links.length) return { sent: 0 };

  const { sent, failedIds } = await sendSelectedProducts(platform, pending.ids);

  // A link whose product did not save has no row to match — hold it back with
  // the product instead of burning it on a backfill that would update nothing.
  const failed = new Set(failedIds);
  const held  = pending.links.filter(l => failed.has(cfg.linkItemId(l)));
  const ready = pending.links.filter(l => !failed.has(cfg.linkItemId(l)));
  const linksLeft = await backfillLinks(platform, ready);

  await cfg.store.setPending({ ids: failedIds, links: [...held, ...linksLeft] });
  await refreshBadge();
  broadcast({ type: 'STAT_UPDATE', platform, sent });
  return { sent };
}

async function sendSelectedProducts(platform, ids) {
  const cfg = PLATFORMS[platform];
  if (!ids.length) return { sent: 0, failedIds: [] };

  const products = await cfg.store.peek(ids);
  const missing = ids.length - products.length;
  if (missing > 0) {
    // Not in the buffer = never rendered while browsing, so there is no data to save.
    pushLog(`ℹ️ ${cfg.label}: ข้าม ${missing} สินค้า — ไม่ได้เปิดดูในรอบนี้ (เลื่อนดูก่อนกดรับลิงก์)`);
  }
  if (!products.length) return { sent: 0, failedIds: [] };

  let sent = 0;
  const failedIds = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const chunkIds = chunk.map(cfg.store.itemId).filter(Boolean);
    try {
      const r = await upsertById(cfg.tab, chunk.map(cfg.toRow));
      sent += (r.updated ?? 0) + (r.inserted ?? 0);
      await cfg.store.markSent(chunkIds);
      await cfg.store.drop(chunkIds);
    } catch (e) {
      failedIds.push(...chunkIds);   // stays buffered → retried on the next flush
      pushLog(`⚠️ ${cfg.label}: เขียน Sheet ล้มเหลว — ${String(e.message ?? e).slice(0, 120)}`);
    }
  }

  if (sent > 0) {
    await bumpSyncedCount(platform, sent);
    pushLog(`✅ บันทึกสินค้า ${cfg.label} ที่เลือก ${sent} ชิ้น`);
  } else {
    pushLog(`⚠️ ${cfg.label}: บันทึกไม่สำเร็จ — กด "ส่งที่ค้างอีกครั้ง" ใน panel`);
  }
  return { sent, failedIds };
}

/** Returns the links still needing a backfill (empty on success). */
async function backfillLinks(platform, links) {
  const cfg = PLATFORMS[platform];
  if (!links.length) return [];
  const entries = links.map(l => ({ id: cfg.linkItemId(l), value: cfg.linkValue(l) }));
  try {
    const r = await patchColumnById(cfg.tab, cfg.linkColumn, entries);
    pushLog(`🔗 ${cfg.label} links: backfill ${r.updated}` +
            (r.missing.length ? ` — รอสินค้าอีก ${r.missing.length} รายการ` : ''));
    // A link whose product row has not landed yet: hold it for the next round.
    const missing = new Set(r.missing);
    return links.filter(l => missing.has(String(cfg.linkItemId(l))));
  } catch (e) {
    pushLog(`⚠️ ${cfg.label} links: backfill ล้มเหลว — ${String(e.message ?? e).slice(0, 120)}`);
    return links;
  }
}

// ─── Stats, reset, badge ──────────────────────────────────────────────────────
export async function getPlatformStats(platform) {
  const cfg = PLATFORMS[platform];
  const d = await chrome.storage.local.get([`${platform}_synced`, `${platform}_last`]);
  const pending = await cfg.store.getPending();
  return {
    synced:   d[`${platform}_synced`] ?? 0,
    pending:  pending.ids.length,        // selected, not yet confirmed saved
    buffered: await cfg.store.size(),    // seen while browsing, never sent
    lastAt:   d[`${platform}_last`] ?? null,
  };
}

export async function resetPlatform(platform) {
  await PLATFORMS[platform].store.clear();
  await chrome.storage.local.remove([`${platform}_synced`, `${platform}_last`]);
  await refreshBadge();
  return { ok: true };
}

async function bumpSyncedCount(platform, n) {
  const key = `${platform}_synced`;
  const prev = (await chrome.storage.local.get(key))[key] ?? 0;
  await chrome.storage.local.set({ [key]: prev + n, [`${platform}_last`]: Date.now() });
}

/** Badge = products staged and waiting for the user to pick and download. */
export async function refreshBadge() {
  const counts = await Promise.all(Object.values(PLATFORMS).map(p => p.store.size()));
  const total = counts.reduce((a, b) => a + b, 0);
  chrome.action.setBadgeText({ text: total > 0 ? String(total) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#0D9488' });
}
