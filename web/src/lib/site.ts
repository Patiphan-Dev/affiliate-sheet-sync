/** Site-wide constants. Edit these to rebrand. */

export const SITE = {
  name: 'แคมป์เกียร์',
  tagline: 'เว็บไซต์รวมสินค้าแคมป์ปิ้งที่ดีที่สุดในไทย',
  description:
    'รวมอุปกรณ์แคมป์ปิ้งคัดสรร — เต็นท์ ถุงนอน เตา เก้าอี้ ไฟ พร้อมรีวิวและคู่มือเลือกซื้อ อัปเดตราคาและดีลจาก Shopee และ Lazada อัตโนมัติ',
  locale: 'th_TH',
  /** Overridden by NEXT_PUBLIC_SITE_URL at build time. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.vercel.app').replace(/\/$/, ''),
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
