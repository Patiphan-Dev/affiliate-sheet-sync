import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd } from '@/components/JsonLd';
import { websiteLd } from '@/lib/schema';
import { SITE } from '@/lib/site';

const body = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'อุปกรณ์แคมป์ปิ้ง', 'เต็นท์', 'ถุงนอน', 'เตาแคมป์', 'เก้าอี้แคมป์',
    'ไฟคาดหัว', 'เป้เดินป่า', 'กระติกน้ำแข็ง', 'เดินป่า', 'ตั้งแคมป์',
    'รีวิวอุปกรณ์แคมป์', 'ราคา Shopee Lazada',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: 'default' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ee4d2d' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1110' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Set the theme class before first paint so there is no light→dark flash.
const noFlash = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={body.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body>
        <JsonLd data={websiteLd()} />
        <SiteHeader />
        <div className="mx-auto max-w-content px-4 pt-6">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
