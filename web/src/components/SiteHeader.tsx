'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';
import { ThemeToggle } from './ThemeToggle';
import { NavStrip } from './NavStrip';

const NAV = [
  { name: 'ดีลลดราคา', href: '/deals' },
  ...CATEGORIES.filter((c) => c.slug !== 'accessories').map((c) => ({
    name: c.name,
    href: `/category/${c.slug}`,
  })),
  { name: 'คู่มือเลือกซื้อ', href: '/guides' },
];

/** Minimal editorial header — condenses on scroll. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-page/85 backdrop-blur transition-shadow duration-300 ${
        scrolled ? 'border-b border-hairline shadow-[0_1px_20px_rgba(0,0,0,0.06)]' : 'border-b border-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-content items-center gap-3 px-4 transition-[padding] duration-300 ${
          scrolled ? 'py-2' : 'py-3'
        }`}
      >
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
            className="w-40 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-subtle transition-[width] duration-300 focus:w-56"
          />
          <button type="submit" aria-label="ค้นหา" className="px-3 py-1.5 text-subtle transition-colors hover:text-ink">
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

      <nav
        className={`mx-auto grid max-w-content grid-cols-[minmax(0,1fr)] overflow-hidden px-4 transition-[grid-template-rows,opacity,padding] duration-300 ${
          // keep the nav reachable on mobile (no hamburger); only condense on ≥sm
          scrolled
            ? 'grid-rows-[1fr] pb-2.5 opacity-100 sm:grid-rows-[0fr] sm:pb-0 sm:opacity-0'
            : 'grid-rows-[1fr] pb-2.5 opacity-100'
        }`}
      >
        <NavStrip items={NAV} />
      </nav>
    </header>
  );
}
