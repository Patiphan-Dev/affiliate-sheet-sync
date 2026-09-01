import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/categories';
import { Reveal } from './Reveal';

/** Full-bleed editorial hero — one image (slow zoom), staggered copy, two links. */
export function HomeHero() {
  return (
    <section className="full-bleed relative">
      <div className="relative h-[68svh] min-h-[440px] w-full overflow-hidden sm:h-[80svh]">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-content px-4 pb-12 text-white sm:pb-16">
            <p className="rise eyebrow text-white/75" style={{ animationDelay: '0.1s' }}>
              อัปเดตทุกวัน
            </p>
            <h1
              className="rise mt-3 max-w-3xl text-[clamp(1.9rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-tight"
              style={{ animationDelay: '0.18s' }}
            >
              รวมดีลอุปกรณ์แคมป์ปิ้ง
              <br className="hidden sm:block" /> เทียบราคา คลิกเดียวถึงหน้าซื้อ
            </h1>
            <div className="rise mt-6 flex flex-wrap gap-x-6 gap-y-3" style={{ animationDelay: '0.3s' }}>
              <Link href="/deals" className="cta-link">
                ดูดีลลดราคา <span className="arrow">→</span>
              </Link>
              <Link href="/guides" className="cta-link text-white/80">
                คู่มือเลือกซื้อ <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}

/** Big image tiles per camping category — hover: image zoom + label lift. */
export function CategoryTiles() {
  const cats = CATEGORIES.filter((c) => c.slug !== 'accessories');
  return (
    <section>
      <Reveal as="h2" className="section-title">
        เลือกตามหมวด
      </Reveal>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((c, i) => (
          <Reveal key={c.slug} delay={i * 60}>
            <Link
              href={`/category/${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-lg"
            >
              <Image
                src={`/cat/${c.slug}.jpg`}
                alt={c.name}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-colors duration-300 group-hover:from-black/85" />
              <div className="absolute inset-x-3 bottom-3">
                <span className="block translate-y-0 text-base font-bold text-white transition-transform duration-300 group-hover:-translate-y-1 sm:text-lg">
                  {c.name}
                </span>
                <span className="mt-1 block h-px w-8 origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Scrolling brand ticker — the platforms + shops we pull from. */
export function BrandMarquee({ shops }: { shops: string[] }) {
  const items = ['Shopee', 'Lazada', ...shops].filter(Boolean).slice(0, 14);
  if (items.length < 4) return null;
  const row = [...items, ...items];
  return (
    <section
      aria-hidden
      className="marquee full-bleed overflow-hidden border-y border-hairline bg-surface py-4"
    >
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap pl-10">
        {row.map((s, i) => (
          <span key={i} className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
