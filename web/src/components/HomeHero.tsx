import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/categories';

/** Full-bleed editorial hero — one image, one line, one link. */
export function HomeHero() {
  return (
    <section className="full-bleed relative">
      <div className="relative h-[62vh] min-h-[420px] w-full sm:h-[72vh]">
        <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-content px-4 pb-10 text-white sm:pb-14">
            <p className="eyebrow text-white/80">อัปเดตทุกวัน</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              รวมดีลอุปกรณ์แคมป์ปิ้ง<br className="hidden sm:block" /> เทียบราคา คลิกเดียวถึงหน้าซื้อ
            </h1>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href="/deals" className="cta-link">
                ดูดีลลดราคา
              </Link>
              <Link href="/guides" className="cta-link text-white/85">
                คู่มือเลือกซื้อ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Big image tiles, one per camping category — Nike-style browse row. */
export function CategoryTiles() {
  const cats = CATEGORIES.filter((c) => c.slug !== 'accessories');
  return (
    <section>
      <h2 className="section-title">เลือกตามหมวด</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg"
          >
            <Image
              src={`/cat/${c.slug}.jpg`}
              alt={c.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-3 left-3 text-base font-bold text-white sm:text-lg">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
