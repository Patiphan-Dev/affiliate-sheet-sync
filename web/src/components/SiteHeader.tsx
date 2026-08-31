import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';
import { ThemeToggle } from './ThemeToggle';

/** Minimal editorial header — near-black on white, thin rule, uppercase nav. */
export function SiteHeader() {
  const nav = [
    { name: 'ดีลลดราคา', href: '/deals' },
    ...CATEGORIES.filter((c) => c.slug !== 'accessories').map((c) => ({
      name: c.name,
      href: `/category/${c.slug}`,
    })),
    { name: 'คู่มือเลือกซื้อ', href: '/guides' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
            <path d="M32 12 8 52h48L32 12Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            <path d="M32 12v40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="m22 52 10-17 10 17Z" fill="currentColor" />
          </svg>
          {SITE.name}
        </Link>

        <form action="/search" className="ml-auto hidden items-center border border-hairline sm:flex">
          <input
            name="q"
            placeholder="ค้นหา…"
            className="w-40 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-subtle focus:w-56"
          />
          <button type="submit" aria-label="ค้นหา" className="px-3 py-1.5 text-subtle hover:text-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        <Link href="/search" aria-label="ค้นหา" className="ml-auto p-1.5 text-subtle hover:text-ink sm:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Link>

        <ThemeToggle />
      </div>

      <nav className="mx-auto flex max-w-content gap-6 overflow-x-auto px-4 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-subtle transition hover:text-ink">
            {n.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
