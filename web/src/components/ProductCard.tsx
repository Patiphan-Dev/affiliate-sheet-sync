import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { platformLabel, soldText } from '@/lib/format';
import { IconTent } from './icons';

const AFF_REL = 'sponsored nofollow noopener';

/**
 * Marketplace card. The image / name / price and the primary button all point
 * straight at the affiliate link (opens the platform product page → we earn the
 * commission). A small secondary link goes to our own review page for SEO.
 */
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-cardhover">
      <a href={p.link} target="_blank" rel={AFF_REL} className="group flex flex-1 flex-col">
        <div className="relative aspect-square bg-page">
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw"
              className="object-cover transition duration-200 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-hairline">
              <IconTent width={40} height={40} />
            </div>
          )}
          <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {platformLabel(p.platform)}
          </span>
          {p.discountPercent > 0 && (
            <span className="absolute right-0 top-2 rounded-l bg-gold px-2 py-1 text-center text-[11px] font-bold leading-none text-white shadow-sm">
              -{p.discountPercent}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-2">
          {(p.hot || p.isNew) && (
            <div className="flex gap-1">
              {p.hot && (
                <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[10px] font-semibold text-gold">ขายดี</span>
              )}
              {p.isNew && (
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">ใหม่</span>
              )}
            </div>
          )}
          <p className="line-clamp-2 min-h-[2.5em] text-[13px] leading-tight text-ink group-hover:text-brand">
            {p.name}
          </p>
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-price">
              <span className="text-xs">฿</span>
              <span className="text-lg font-medium">
                {p.price != null ? p.price.toLocaleString('th-TH') : '—'}
              </span>
            </span>
            {p.originalPrice != null && (
              <span className="text-xs text-subtle line-through">
                ฿{p.originalPrice.toLocaleString('th-TH')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-subtle">
            {p.rating != null && <span>⭐ {p.rating.toFixed(1)}</span>}
            {soldText(p.sold) && <span>ขายแล้ว {soldText(p.sold)}</span>}
          </div>
        </div>
      </a>

      <div className="flex gap-1 p-2 pt-0">
        <a
          href={p.link}
          target="_blank"
          rel={AFF_REL}
          className="flex-1 rounded-md bg-brand px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-brand-dark"
        >
          ดูสินค้า
        </a>
        <Link
          href={`/gear/${p.slug}`}
          className="rounded-md border border-hairline px-2 py-1.5 text-center text-xs text-subtle transition hover:border-brand hover:text-brand"
        >
          รีวิว
        </Link>
      </div>
    </article>
  );
}
