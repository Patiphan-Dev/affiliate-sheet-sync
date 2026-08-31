import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { platformLabel, soldText } from '@/lib/format';
import { IconTent } from './icons';

const AFF_REL = 'sponsored nofollow noopener';

/**
 * Editorial product card. The image + name + price link straight to the
 * affiliate URL (we earn the commission); a small "รีวิว" link goes to our own
 * page for internal linking / SEO.
 */
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="group">
      <a href={p.link} target="_blank" rel={AFF_REL} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
          {p.image ? (
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 300px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-hairline">
              <IconTent width={44} height={44} />
            </div>
          )}
          {p.discountPercent > 0 && (
            <span className="absolute left-2 top-2 bg-sale px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
              -{p.discountPercent}%
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <p className="text-[11px] uppercase tracking-wide text-subtle">{platformLabel(p.platform)}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[2.5em] text-sm leading-snug">{p.name}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-bold text-price">
              ฿{p.price != null ? p.price.toLocaleString('th-TH') : '—'}
            </span>
            {p.originalPrice != null && (
              <span className="text-xs text-subtle line-through">฿{p.originalPrice.toLocaleString('th-TH')}</span>
            )}
          </div>
          {(p.rating != null || soldText(p.sold)) && (
            <p className="mt-0.5 text-[11px] text-subtle">
              {p.rating != null && <span>★ {p.rating.toFixed(1)}</span>}
              {p.rating != null && soldText(p.sold) && ' · '}
              {soldText(p.sold) && <span>ขายแล้ว {soldText(p.sold)}</span>}
            </p>
          )}
        </div>
      </a>
      <Link
        href={`/gear/${p.slug}`}
        className="mt-1.5 inline-block border-b border-current pb-px text-[11px] font-semibold uppercase tracking-wide text-subtle transition hover:text-ink"
      >
        อ่านรีวิว
      </Link>
    </article>
  );
}
