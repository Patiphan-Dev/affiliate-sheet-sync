import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { HomeHero, CategoryTiles } from '@/components/HomeHero';
import { guideImage } from '@/lib/guide-images';
import { JsonLd } from '@/components/JsonLd';
import { itemListLd } from '@/lib/schema';
import { thaiDate } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  const featured = products.slice(0, 30);

  return (
    <div className="-mt-6 space-y-14 pb-6">
      <HomeHero />

      <CategoryTiles />

      <section>
        <div className="flex items-end justify-between">
          <h2 className="section-title">สินค้าแนะนำประจำวัน</h2>
          <span className="text-xs text-subtle">{products.length} รายการ</span>
        </div>
        <div className="mt-5">
          <ProductExplorer products={featured} showCategoryFilter categories={CATEGORIES} />
        </div>
      </section>

      {guides.length > 0 && (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="section-title">คู่มือเลือกซื้อ</h2>
            <Link href="/guides" className="cta-link text-sm">
              ดูทั้งหมด
            </Link>
          </div>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 6).map((g) => {
              const img = guideImage(g.slug);
              return (
                <li key={g.slug} className="group">
                  <Link href={`/guides/${g.slug}`} className="block">
                    {img && (
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-lg">
                        <Image
                          src={img}
                          alt={g.title}
                          fill
                          sizes="(max-width:640px) 100vw, 380px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </span>
                    )}
                    <span className="mt-3 block font-bold leading-snug tracking-tight group-hover:underline">
                      {g.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-subtle">{g.summary}</span>
                    {g.updatedAt && (
                      <span className="mt-2 block text-[11px] uppercase tracking-wide text-subtle">
                        อัปเดต {thaiDate(g.updatedAt)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <JsonLd data={itemListLd(featured, '/')} />
    </div>
  );
}
