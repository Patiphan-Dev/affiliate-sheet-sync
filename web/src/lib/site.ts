/** Site-wide constants. Edit these to rebrand. */

export const SITE = {
  name: 'แคมป์เกียร์',
  tagline: 'เว็บไซต์รวมสินค้าแคมป์ปิ้งที่ดีที่สุดในไทย',
  description:
    'รวมอุปกรณ์แคมป์ปิ้งคัดสรร — เต็นท์ ถุงนอน เตา เก้าอี้ ไฟ พร้อมรีวิวและคู่มือเลือกซื้อ อัปเดตราคาและดีลจาก Shopee และ Lazada อัตโนมัติ',
  locale: 'th_TH',
  /** Raster 512×512 logo for Organization schema (Google needs PNG/JPG, not SVG). */
  logo: '/logo.png',
  /** Site-wide 1200×630 share image (src/app/opengraph-image.jpg, served at this path). */
  shareImage: '/opengraph-image.jpg',
  /** Public profiles of the brand (Facebook page, YouTube…). Add URLs here to feed Organization.sameAs. */
  sameAs: [] as string[],
  /** Overridden by NEXT_PUBLIC_SITE_URL at build time. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://campgear.patiphandev.com').replace(/\/$/, ''),
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
