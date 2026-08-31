import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/data';
import { CATEGORIES, getCategory, productsInCategory } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { FaqList } from '@/components/FaqList';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbLd, collectionLd, faqLd, itemListLd } from '@/lib/schema';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — รวมรุ่นน่าซื้อ`,
    description: cat.intro,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: `${cat.name} — ${SITE.name}`, description: cat.intro, url: `${SITE.url}/category/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const products = productsInCategory(await getProducts(), slug);
  const trail = [
    { name: 'หน้าแรก', path: '/' },
    { name: cat.name, path: `/category/${cat.slug}` },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs trail={trail} />
      <header className="relative overflow-hidden rounded-xl">
        <Image
          src={`/cat/${cat.slug}.jpg`}
          alt=""
          fill
          priority
          sizes="(max-width:768px) 100vw, 1200px"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/55 to-ink/20" />
        <div className="p-6 text-white sm:p-8">
          <h1 className="text-3xl font-bold">{cat.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90">{cat.intro}</p>
        </div>
      </header>

      {products.length ? (
        <ProductExplorer products={products} />
      ) : (
        <p className="text-sm text-ink/60">ยังไม่มีสินค้าในหมวดนี้ กลับมาดูใหม่เร็ว ๆ นี้</p>
      )}

      <FaqList items={cat.faq} heading={`คำถามที่พบบ่อยเรื่อง${cat.name}`} />

      <JsonLd
        data={[
          breadcrumbLd(trail),
          collectionLd(cat, products.length),
          itemListLd(products, `/category/${cat.slug}`),
          faqLd(cat.faq),
        ]}
      />
    </div>
  );
}
