import type { Faq } from '@/types';

/** Answer-first FAQ. Native <details> — expands with zero JS, crawler-visible. */
export function FaqList({ items, heading = 'คำถามที่พบบ่อย' }: { items: Faq[]; heading?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-10" aria-label={heading}>
      <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
      <div className="mt-3 divide-y divide-hairline border-y border-hairline">
        {items.map((f, i) => (
          <details key={i} className="group py-3">
            <summary className="cursor-pointer list-none font-medium text-ink marker:hidden flex justify-between gap-3">
              {f.q}
              <span className="text-ink transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
