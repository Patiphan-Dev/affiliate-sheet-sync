/**
 * review-sync.js — stores Shopee buyer reviews captured from product pages.
 *
 * The raw rows feed the Apps Script `buildReviewArticles` job, which turns them
 * into the website's review articles. Keyed by Shopee's comment id, so seeing the
 * same review again (revisiting a page) updates instead of duplicating.
 */

import { upsertById } from './sheet-store.js';
import { pushLog } from './panel-log.js';

export const REVIEWS_TAB = 'shopee_reviews';

export async function handleReviewCapture(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) return;
  try {
    const { inserted, updated } = await upsertById(REVIEWS_TAB, reviews);
    if (inserted) pushLog(`💬 เก็บรีวิว Shopee ใหม่ ${inserted} รายการ (อัปเดต ${updated})`);
  } catch (e) {
    pushLog(`⚠️ บันทึกรีวิวไม่สำเร็จ: ${e.message ?? e}`);
  }
}
