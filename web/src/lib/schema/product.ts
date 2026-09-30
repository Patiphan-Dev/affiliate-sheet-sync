import type { Article, Product } from '@/types';
import { absoluteUrl } from '../site';
import { platformLabel } from '../format';
import { organizationRef } from './entity';
import type { Json } from './types';

/** Prices come from an hourly feed, so an offer is only claimed valid for a month. */
const OFFER_VALID_DAYS = 30;

function priceValidUntil(): string {
  return new Date(Date.now() + OFFER_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function productLd(p: Product, review?: Article): Json {
  const offer: Json = {
    '@type': 'Offer',
    url: absoluteUrl(`/gear/${p.slug}`),
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: platformLabel(p.platform) },
    priceCurrency: 'THB',
  };
  if (p.price != null) {
    offer.price = p.price;
    offer.priceValidUntil = priceValidUntil();
  }

  const ld: Json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/gear/${p.slug}`)}#product`,
    name: p.name,
    sku: p.id,
    category: p.categorySlug,
    description: (review?.summary || p.caption || `${p.name} — เทียบราคาและอ่านรีวิวก่อนซื้อ`).slice(0, 300),
    offers: offer,
  };
  if (p.image) ld.image = [p.image];
  if (review) {
    // No reviewRating on purpose: the site publishes editorial summaries, not
    // scored reviews, and inventing a score would break Google's review policy.
    ld.review = {
      '@type': 'Review',
      name: review.title,
      reviewBody: review.summary,
      datePublished: review.updatedAt || undefined,
      author: organizationRef(),
    };
  }
  return ld;
}
