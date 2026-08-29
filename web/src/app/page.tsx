import Link from 'next/link';
import { getProducts, getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { HomeHero } from '@/components/HomeHero';
import { CATEGORY_ICON } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { itemListLd } from '@/lib/schema';
import { SITE } from '@/lib/site';
import { thaiDate } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  const featured = products.slice(0, 30);

  return (
    <div className="space-y-4">
      <h1 className="sr-only">
        {SITE.name} — {SITE.tagline}
      </h1>

      <HomeHero />

      <section className="rounded-xl bg-white p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">หมวดหมู่</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.slug];
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-lg p-2 text-center transition hover:bg-page"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-page text-ink transition group-hover:bg-brand group-hover:text-white">
                  {Icon ? <Icon /> : null}
                </span>
                <span className="text-[11px] leading-tight text-ink">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-card">
        <div className="section-title flex items-center justify-between">
          <span>สินค้าแนะนำประจำวัน</span>
          <span className="text-xs font-normal normal-case text-subtle">{products.length} รายการ</span>
        </div>
        <div className="mt-3">
          <ProductExplorer products={featured} showCategoryFilter categories={CATEGORIES} />
        </div>
      </section>

      {guides.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-card">
          <div className="section-title">คู่มือเลือกซื้อ</div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug} className="rounded-lg border border-hairline p-4 transition hover:border-brand hover:shadow-card">
                <Link href={`/guides/${g.slug}`} className="font-semibold text-ink hover:text-brand">
                  {g.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-subtle">{g.summary}</p>
                {g.updatedAt && <p className="mt-2 text-xs text-subtle">อัปเดต {thaiDate(g.updatedAt)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd data={itemListLd(featured, '/')} />
    </div>
  );
}
