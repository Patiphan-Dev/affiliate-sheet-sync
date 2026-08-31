import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';
import { ThemeToggle } from './ThemeToggle';

/** Shopee-style orange header: brand + search + a quick category row. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-brand-deep to-brand text-white">
      <div className="mx-auto max-w-content px-3 sm:px-4">
        <div className="flex items-center gap-3 py-2.5">
          <Link href="/" className="shrink-0 text-2xl font-bold tracking-tight">
            {SITE.name}
          </Link>
          <form action="/search" className="flex flex-1 items-center rounded-sm bg-white p-1">
            <input
              name="q"
              placeholder="ค้นหาอุปกรณ์แคมป์ปิ้ง เต็นท์ ถุงนอน เตา…"
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-[#222] outline-none"
            />
            <button type="submit" className="rounded-sm bg-brand px-4 py-1.5 text-white" aria-label="ค้นหา">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </form>
          <ThemeToggle />
        </div>
        <nav className="flex gap-4 overflow-x-auto pb-2 text-xs text-white/90">
          <Link href="/deals" className="whitespace-nowrap font-semibold hover:text-white/70">
            🏷️ ดีลลดราคา
          </Link>
          {CATEGORIES.filter((c) => c.slug !== 'accessories').map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap hover:text-white/70">
              {c.name}
            </Link>
          ))}
          <Link href="/guides" className="whitespace-nowrap font-semibold hover:text-white/70">
            คู่มือเลือกซื้อ
          </Link>
        </nav>
      </div>
    </header>
  );
}
