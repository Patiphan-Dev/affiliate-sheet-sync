import 'server-only';
import type { Article } from '@/types';
import { getArticles } from './data';
import { htmlToText } from './text';

/**
 * A product page is only worth indexing once it carries our own review.
 * Without one it is just a name, a price and an affiliate link — the same data
 * Shopee/Lazada already rank for — and hundreds of those thin pages drag down
 * how Google rates the whole site. Pages stay reachable (noindex, follow) and
 * become indexable on their own as soon as a review lands in the `articles` tab.
 *
 * ~800 Thai characters is roughly 150–200 words: below that a "review" is a
 * blurb, not something that answers what a buyer searched for.
 */
const MIN_REVIEW_TEXT_CHARS = 800;

export function isIndexableReview(review: Pick<Article, 'bodyHtml'> | undefined): boolean {
  if (!review?.bodyHtml) return false;
  return htmlToText(review.bodyHtml).length >= MIN_REVIEW_TEXT_CHARS;
}

/** Product ids whose /gear page should be indexed and listed in the sitemap. */
export async function getIndexableProductIds(): Promise<Set<string>> {
  const articles = await getArticles();
  const ids = new Set<string>();
  for (const a of articles) {
    if (a.kind === 'review' && isIndexableReview(a)) ids.add(a.refId);
  }
  return ids;
}
