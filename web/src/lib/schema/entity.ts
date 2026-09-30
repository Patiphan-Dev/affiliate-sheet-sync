import { SITE, absoluteUrl } from '../site';
import type { Json } from './types';

/** Stable @id values so every page's JSON-LD points at the same entities. */
export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Reference to the publisher entity, for author / publisher / seller fields. */
export function organizationRef(): Json {
  return { '@id': ORG_ID };
}

export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: { '@type': 'ImageObject', url: absoluteUrl(SITE.logo), width: 512, height: 512 },
    image: absoluteUrl(SITE.shareImage),
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function websiteLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    alternateName: `${SITE.name} — ${SITE.tagline}`,
    url: SITE.url,
    description: SITE.description,
    inLanguage: 'th-TH',
    publisher: organizationRef(),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function aboutPageLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `เกี่ยวกับ${SITE.name}`,
    url: absoluteUrl('/about'),
    inLanguage: 'th-TH',
    isPartOf: { '@id': WEBSITE_ID },
    about: organizationRef(),
  };
}
