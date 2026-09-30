import type { Article, Category, Faq, Product } from '@/types';
import { SITE, absoluteUrl } from '../site';
import { WEBSITE_ID, organizationRef } from './entity';
import type { Json } from './types';

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

export function itemListLd(products: Product[], listPath: string, name?: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    url: absoluteUrl(listPath),
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/gear/${p.slug}`),
      name: p.name,
      ...(p.image ? { image: p.image } : {}),
    })),
  };
}

export function collectionLd(cat: Category, count: number, image?: string | null): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.name} — ${SITE.name}`,
    description: cat.intro,
    url: absoluteUrl(`/category/${cat.slug}`),
    inLanguage: 'th-TH',
    about: cat.name,
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl(image) } } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@type': 'ItemList', numberOfItems: count },
  };
}

/**
 * `images` should be absolute URLs; Google recommends several aspect ratios
 * (16:9, 4:3, 1:1) for Article rich results, so pass every one you have.
 */
export function articleLd(a: Article, path: string, images: string[] = []): Json {
  const ld: Json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title.slice(0, 110),
    description: a.summary,
    datePublished: a.updatedAt || undefined,
    dateModified: a.updatedAt || undefined,
    inLanguage: 'th-TH',
    author: { ...organizationRef(), '@type': 'Organization', name: SITE.name, url: absoluteUrl('/about') },
    publisher: organizationRef(),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
  };
  if (images.length) ld.image = images;
  return ld;
}
