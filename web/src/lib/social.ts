import type { Metadata } from 'next';
import { SITE, absoluteUrl } from '@/lib/site';

/** Site-wide 1200×630 share image (src/app/opengraph-image.jpg, served at this path). */
const DEFAULT_SHARE_IMAGE = '/opengraph-image.jpg';

interface SocialInput {
  title: string;
  description: string;
  /** Canonical path of the page, e.g. `/category/tents`. */
  path: string;
  /** Page-specific image (absolute URL or site path); falls back to the site image. */
  image?: string | null;
  type?: 'website' | 'article';
}

/**
 * OpenGraph + Twitter metadata for a page.
 *
 * Next replaces the whole `openGraph` / `twitter` object when a page defines
 * its own, so every field (siteName, locale, image) has to be restated here —
 * otherwise link previews lose their image on that page.
 */
export function socialMetadata(input: SocialInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = absoluteUrl(input.image || DEFAULT_SHARE_IMAGE);
  return {
    openGraph: {
      type: input.type ?? 'website',
      siteName: SITE.name,
      locale: SITE.locale,
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
