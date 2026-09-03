'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
}

/**
 * Horizontal category strip for the mobile header. While there is more content
 * off the right edge it shows a fading mask + a gently nudging chevron, so the
 * row reads as swipeable. The hint fades out once scrolled to the end.
 */
export function NavStrip({ items, className = '' }: { items: NavItem[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 2px slack so sub-pixel widths don't leave the hint stuck on
    setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  return (
    <div className={`relative min-h-0 min-w-0 ${className}`}>
      <div
        ref={ref}
        className="scrollbar-none flex w-full gap-6 overflow-x-auto text-[11px] font-semibold uppercase tracking-[0.12em]"
      >
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap py-1 text-subtle transition-colors hover:text-ink"
          >
            {n.name}
          </Link>
        ))}
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-page via-page to-transparent pl-10 pr-0.5 transition-opacity duration-300 ${
          more ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          className="nudge-x text-subtle"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}
