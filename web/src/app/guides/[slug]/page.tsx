import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuides, getGuideBySlug, getProducts } from '@/lib/data';
import { getCategory, productsInCategory } from '@/lib/categories';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FaqList } from '@/components/FaqList';
import { ProductCard } from '@/components/ProductCard';
import { ArticleBody, AffiliateNote, ComparisonTable, Tldr } from '@/components/content';
import { JsonLd } from '@/components/JsonLd';
import { articleLd, breadcrumbLd, faqLd } from '@/lib/schema';
import { thaiDate } from '@/lib/format';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getGuides()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGuideBySlug(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.summary.slice(0, 160),
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: g.title, description: g.summary.slice(0, 200), url: `${SITE.url}/guides/${g.slug}`, type: 'article' },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGuideBySlug(slug);
  if (!g) notFound();

  const cat = getCategory(g.refId);
  const picks = cat ? productsInCategory(await getProducts(), cat.slug).slice(0, 6) : [];

  const trail = [
    { name: 'หน้าแรก', path: '/' },
    { name: 'คู่มือเลือกซื้อ', path: '/guides' },
    { name: g.title, path: `/guides/${g.slug}` },
  ];

  return (
    <article className="space-y-6">
      <Breadcrumbs trail={trail} />
      <header>
        <h1 className="text-3xl text-brand">{g.title}</h1>
        {g.updatedAt && <p className="mt-2 text-xs text-ink/45">อัปเดตล่าสุด {thaiDate(g.updatedAt)}</p>}
      </header>

      <Tldr>{g.summary}</Tldr>
      <AffiliateNote />

      <ArticleBody html={g.bodyHtml} />

      {picks.length >= 2 && (
        <section>
          <h2 className="text-xl text-brand">ตารางเทียบรุ่นแนะนำ</h2>
          <ComparisonTable products={picks} />
        </section>
      )}

      <FaqList items={g.faq} />

      {picks.length > 0 && (
        <section>
          <h2 className="text-xl text-brand">สินค้าที่กล่าวถึงในบทความ</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {picks.slice(0, 6).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <JsonLd data={[breadcrumbLd(trail), articleLd(g, `/guides/${g.slug}`), faqLd(g.faq)]} />
    </article>
  );
}
