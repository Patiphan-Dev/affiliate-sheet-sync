import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts, getProductBySlug, getReviewFor } from '@/lib/data';
import { getCategory } from '@/lib/categories';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FaqList } from '@/components/FaqList';
import { ProductCard } from '@/components/ProductCard';
import { ArticleBody, AffiliateNote, ComparisonTable, Tldr } from '@/components/content';
import { JsonLd } from '@/components/JsonLd';
import { articleLd, breadcrumbLd, faqLd, productLd } from '@/lib/schema';
import { baht, platformLabel, thaiDate } from '@/lib/format';
import { SITE } from '@/lib/site';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.slice(0, 300).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const review = await getReviewFor(p.id);
  const desc = review?.summary || `${p.name} ราคา ${baht(p.price)} — เทียบราคาและอ่านรีวิวก่อนซื้อ`;
  return {
    title: p.name,
    description: desc.slice(0, 160),
    alternates: { canonical: `/gear/${p.slug}` },
    openGraph: {
      title: p.name,
      description: desc.slice(0, 200),
      url: `${SITE.url}/gear/${p.slug}`,
      images: p.image ? [p.image] : undefined,
    },
  };
}

export default async function GearPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [all, review] = await Promise.all([getProducts(), getReviewFor(p.id)]);
  const cat = getCategory(p.categorySlug);
  const related = all.filter((x) => x.categorySlug === p.categorySlug && x.slug !== p.slug).slice(0, 8);

  const trail = [
    { name: 'หน้าแรก', path: '/' },
    ...(cat ? [{ name: cat.name, path: `/category/${cat.slug}` }] : []),
    { name: p.name, path: `/gear/${p.slug}` },
  ];

  return (
    <article className="space-y-8">
      <Breadcrumbs trail={trail} />

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-hairline bg-surface">
          {p.image && <Image src={p.image} alt={p.name} fill sizes="320px" className="object-contain" priority />}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl text-ink">{baht(p.price)}</span>
            <span className="rounded bg-ink/5 px-2 py-1 text-xs text-ink/70">{platformLabel(p.platform)}</span>
            {p.updatedAt && <span className="text-xs text-ink/45">อัปเดตราคา {thaiDate(p.updatedAt)}</span>}
          </div>
          <a
            href={p.link}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="mt-4 inline-block bg-ink px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-page hover:opacity-85"
          >
            ดูราคาล่าสุดที่ {platformLabel(p.platform)} →
          </a>
          {review?.summary && (
            <div className="mt-5">
              <Tldr>{review.summary}</Tldr>
            </div>
          )}
          <AffiliateNote />
        </div>
      </div>

      {review?.bodyHtml && (
        <section>
          <h2 className="text-xl font-bold tracking-tight">รีวิว {p.name}</h2>
          <ArticleBody html={review.bodyHtml} />
        </section>
      )}

      {related.length >= 2 && (
        <section>
          <h2 className="text-xl font-bold tracking-tight">รุ่นใกล้เคียงในหมวด{cat?.name}</h2>
          <ComparisonTable products={[p, ...related.slice(0, 4)]} />
        </section>
      )}

      {review?.faq?.length ? <FaqList items={review.faq} /> : cat ? <FaqList items={cat.faq} /> : null}

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold tracking-tight">ดูสินค้าอื่นในหมวดนี้</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((x) => (
              <ProductCard key={x.slug} product={x} />
            ))}
          </div>
          {cat && (
            <Link href={`/category/${cat.slug}`} className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
              ดู{cat.name}ทั้งหมด →
            </Link>
          )}
        </section>
      )}

      <JsonLd
        data={[
          breadcrumbLd(trail),
          productLd(p, review),
          review ? articleLd(review, `/gear/${p.slug}`) : null,
          faqLd(review?.faq?.length ? review.faq : cat?.faq ?? []),
        ]}
      />
    </article>
  );
}
