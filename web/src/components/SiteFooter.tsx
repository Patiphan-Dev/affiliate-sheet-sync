import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t-4 border-brand bg-surface">
      <div className="mx-auto grid max-w-content gap-6 px-4 py-8 text-sm sm:grid-cols-4">
        <div className="sm:col-span-1">
          <div className="text-lg font-bold text-brand">{SITE.name}</div>
          <p className="mt-2 text-subtle">{SITE.tagline}</p>
        </div>
        <div>
          <div className="font-semibold text-ink">หมวดสินค้า</div>
          <ul className="mt-2 space-y-1 text-subtle">
            {CATEGORIES.filter((c) => c.slug !== 'accessories').map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink">คู่มือ</div>
          <ul className="mt-2 space-y-1 text-subtle">
            <li><Link href="/guides" className="hover:text-brand">คู่มือเลือกซื้อทั้งหมด</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink">เกี่ยวกับเรา</div>
          <ul className="mt-2 space-y-1 text-subtle">
            <li><Link href="/disclosure" className="hover:text-brand">การเปิดเผยลิงก์แนะนำ</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto max-w-content px-4 py-4 text-xs text-subtle">
          เว็บไซต์นี้มีลิงก์แนะนำสินค้า (affiliate) เมื่อคุณกดซื้อผ่านลิงก์ เราอาจได้รับค่าตอบแทนโดยไม่มีค่าใช้จ่ายเพิ่มกับคุณ ·
          ราคาและสต็อกดึงมาอัตโนมัติ อาจไม่ตรงกับหน้าร้าน โปรดตรวจสอบอีกครั้งก่อนสั่งซื้อ
        </div>
      </div>
    </footer>
  );
}
