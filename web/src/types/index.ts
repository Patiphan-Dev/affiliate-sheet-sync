/** Domain types shared across the site. */

export type Platform = 'shopee' | 'lazada';

/** One row of the Apps Script `?page=feed` response, after normalisation. */
export interface Product {
  platform: Platform;
  id: string;
  slug: string;
  name: string;
  price: number | null;
  /** list / before-discount price, when the feed provides it */
  originalPrice: number | null;
  /** derived from price vs originalPrice; 0 when unknown */
  discountPercent: number;
  /** internal ranking signal (not shown to visitors) */
  commission: number | null;
  rating: number | null;
  sold: number | null;
  shop: string;
  /** derived: worth a "ขายดี" flag */
  hot: boolean;
  /** derived: updated within the last few days */
  isNew: boolean;
  image: string;
  /** affiliate link — where a card click goes */
  link: string;
  caption: string;
  categorySlug: string;
  updatedAt: string;
}

export interface Category {
  slug: string;
  name: string;
  /** lowercase keywords that map a product name into this category */
  match: string[];
  intro: string;
  faq: Faq[];
}

export interface Faq {
  q: string;
  a: string;
}

export type ArticleKind = 'review' | 'guide';

/** One row of the Apps Script `?page=articles` response (or a mock). */
export interface Article {
  kind: ArticleKind;
  slug: string;
  title: string;
  /** product id for kind==='review'; category slug for kind==='guide' */
  refId: string;
  summary: string;
  /** HTML body (already sanitised upstream) */
  bodyHtml: string;
  faq: Faq[];
  updatedAt: string;
}
