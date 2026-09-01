import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { HomeHero, CategoryTiles, BrandMarquee } from '@/components/HomeHero';
import { Reveal } from '@/components/Reveal';
import { guideImage } from '@/lib/guide-images';
import { JsonLd } from '@/components/JsonLd';
import { itemListLd } from '@/lib/schema';
import { thaiDate } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  const featured = products.slice(0, 30);
  const shops = [...new Set(products.map((p) => p.shop).filter(Boolean))];
  const featureGuide = guides[0];
  const featureImg = featureGuide ? guideImage(featureGuide.slug, featureGuide.refId) : null;

  return (
    <div className="-mt-6 space-y-16 pb-10 sm:space-y-24">
      <HomeHero />

      <BrandMarquee shops={shops} />

      <CategoryTiles />

      {featureGuide && featureImg && (
        <Reveal>
          <Link
            href={`/guides/${featureGuide.slug}`}
            className="full-bleed group relative block bg-surface"
          >
            <div className="mx-auto grid max-w-content items-stretch gap-0 md:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
                <Image
                  src={featureImg}
                  alt={featureGuide.title}
                  fill
                  sizes="(max-width:768px) 100vw, 600px"
                  className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center gap-3 px-4 py-10 sm:px-10">
                <p className="eyebrow">คู่มือแนะนำ</p>
                <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {featureGuide.title}
                </h2>
                <p className="line-clamp-3 text-sm text-subtle sm:text-base">{featureGuide.summary}</p>
                <span className="cta-link mt-2 self-start">
                  อ่านต่อ <span className="arrow">→</span>
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      )}

      <section>
        <Reveal className="flex items-end justify-between">
          <h2 className="section-title">สินค้าแนะนำประจำวัน</h2>
          <span className="text-xs text-subtle">{products.length} รายการ</span>
        </Reveal>
        <Reveal className="mt-6" delay={80}>
          <ProductExplorer products={featured} showCategoryFilter categories={CATEGORIES} />
        </Reveal>
      </section>

      {guides.length > 0 && (
        <section>
          <Reveal className="flex items-end justify-between">
            <h2 className="section-title">คู่มือเลือกซื้อ</h2>
            <Link href="/guides" className="cta-link text-sm">
              ดูทั้งหมด <span className="arrow">→</span>
            </Link>
          </Reveal>
          <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 6).map((g, i) => {
              const img = guideImage(g.slug, g.refId);
              return (
                <Reveal key={g.slug} as="li" delay={(i % 3) * 70} className="group">
                  <Link href={`/guides/${g.slug}`} className="block">
                    {img && (
                      <span className="relative block aspect-[16/10] overflow-hidden rounded-lg">
                        <Image
                          src={img}
                          alt={g.title}
                          fill
                          sizes="(max-width:640px) 100vw, 380px"
                          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
                        />
                      </span>
                    )}
                    <span className="mt-3 block font-bold leading-snug tracking-tight underline-offset-4 group-hover:underline">
                      {g.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-subtle">{g.summary}</span>
                    {g.updatedAt && (
                      <span className="mt-2 block text-[11px] uppercase tracking-wide text-subtle">
                        อัปเดต {thaiDate(g.updatedAt)}
                      </span>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      <JsonLd data={itemListLd(featured, '/')} />
    </div>
  );
}
