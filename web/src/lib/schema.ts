import type { Article, Category, Faq, Product } from '@/types';
import { SITE, absoluteUrl } from './site';
import { platformLabel } from './format';

type Json = Record<string, unknown>;

export function websiteLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: 'th-TH',
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  };
}

export function faqLd(faq: Faq[]): Json | null {
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function productLd(p: Product, review?: Article): Json {
  const offer: Json = {
    '@type': 'Offer',
    url: absoluteUrl(`/gear/${p.slug}`),
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: platformLabel(p.platform) },
    priceCurrency: 'THB',
  };
  if (p.price != null) offer.price = p.price;

  const ld: Json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    category: p.categorySlug,
    offers: offer,
  };
  if (p.image) ld.image = [p.image];
  if (review) {
    ld.review = {
      '@type': 'Review',
      reviewBody: review.summary,
      datePublished: review.updatedAt || undefined,
      author: { '@type': 'Organization', name: SITE.name },
    };
  }
  return ld;
}

export function itemListLd(products: Product[], listPath: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: absoluteUrl(listPath),
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/gear/${p.slug}`),
      name: p.name,
    })),
  };
}

export function collectionLd(cat: Category, count: number): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.name} — ${SITE.name}`,
    description: cat.intro,
    url: absoluteUrl(`/category/${cat.slug}`),
    about: cat.name,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    mainEntity: { '@type': 'ItemList', numberOfItems: count },
  };
}

export function articleLd(a: Article, path: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    datePublished: a.updatedAt || undefined,
    dateModified: a.updatedAt || undefined,
    inLanguage: 'th-TH',
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    mainEntityOfPage: absoluteUrl(path),
  };
}
