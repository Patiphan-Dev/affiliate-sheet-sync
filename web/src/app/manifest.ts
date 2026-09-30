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
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
