'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Fades + slides its children in the first time they scroll into view.
 * SSR renders the content already visible-in-markup (just class `reveal`), so
 * there's no layout shift and it degrades gracefully without JS.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const reveal = () => setShown(true);

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          reveal();
          io.disconnect();
        }
      },
      // positive bottom margin => fire a little before the element enters the viewport
      { rootMargin: '0px 0px 12% 0px', threshold: 0 },
    );
    io.observe(el);

    // Failsafe: never leave content invisible if the observer is throttled
    // (background tab, slow device) or misses the element entirely.
    const t = window.setTimeout(reveal, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
