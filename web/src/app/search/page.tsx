import type { Metadata } from 'next';
import { getProducts } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ค้นหาสินค้า',
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const needle = q.trim().toLowerCase();
  const all = await getProducts();
  const results = needle ? all.filter((p) => p.name.toLowerCase().includes(needle)) : all;

  return (
    <div className="space-y-4">
      <Breadcrumbs trail={[{ name: 'หน้าแรก', path: '/' }, { name: `ค้นหา: ${q || 'ทั้งหมด'}`, path: '/search' }]} />
      <div className="bg-surface p-3">
        <h1 className="text-lg font-semibold text-ink">
          ผลการค้นหา{q ? ` “${q}”` : ''} <span className="text-sm font-normal text-subtle">({results.length})</span>
        </h1>
        <div className="mt-3">
          <ProductExplorer products={results} showCategoryFilter categories={CATEGORIES} />
        </div>
      </div>
    </div>
  );
}
