import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/** PWA manifest — lets the site be added to a phone home screen, app-like. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#ee4d2d',
    lang: 'th',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
