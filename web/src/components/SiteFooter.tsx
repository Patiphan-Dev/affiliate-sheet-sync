import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 text-sm sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-base font-bold tracking-tight">
            <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden>
              <path d="M32 12 8 52h48L32 12Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
              <path d="M32 12v40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <path d="m22 52 10-17 10 17Z" fill="currentColor" />
            </svg>
            {SITE.name}
          </div>
          <p className="mt-3 text-subtle">{SITE.tagline}</p>
        </div>
        <div>
          <div className="eyebrow">หมวดสินค้า</div>
          <ul className="mt-3 space-y-2 text-subtle">
            {CATEGORIES.filter((c) => c.slug !== 'accessories').map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="transition hover:text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow">คู่มือ</div>
          <ul className="mt-3 space-y-2 text-subtle">
            <li><Link href="/guides" className="transition hover:text-ink">คู่มือเลือกซื้อทั้งหมด</Link></li>
            <li><Link href="/deals" className="transition hover:text-ink">ดีลลดราคา</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow">เกี่ยวกับ</div>
          <ul className="mt-3 space-y-2 text-subtle">
            <li><Link href="/disclosure" className="transition hover:text-ink">การเปิดเผยลิงก์แนะนำ</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-content px-4 py-5 text-xs text-subtle">
          เว็บไซต์นี้มีลิงก์แนะนำสินค้า (affiliate) เมื่อกดซื้อผ่านลิงก์เราอาจได้รับค่าตอบแทนโดยไม่มีค่าใช้จ่ายเพิ่มกับคุณ ·
          ราคาและสต็อกดึงมาอัตโนมัติ อาจไม่ตรงกับหน้าร้าน โปรดตรวจสอบอีกครั้งก่อนสั่งซื้อ
        </p>
      </div>
    </footer>
  );
}
