'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

type Sort = 'new' | 'reco' | 'discount' | 'cheap' | 'pricey';

/**
 * Client wrapper around a server-rendered list. All products are passed in and
 * rendered on the server for SEO; this only filters/sorts what is already there.
 */
export function ProductExplorer({
  products,
  showCategoryFilter = false,
  categories = [],
}: {
  products: Product[];
  showCategoryFilter?: boolean;
  categories?: { slug: string; name: string }[];
}) {
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState<Sort>('new');

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (platform && p.platform !== platform) return false;
      if (cat && p.categorySlug !== cat) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === 'reco') return Number(b.hot) - Number(a.hot) || (b.commission ?? 0) - (a.commission ?? 0);
      if (sort === 'discount') return b.discountPercent - a.discountPercent;
      if (sort === 'cheap') return (a.price ?? 1e12) - (b.price ?? 1e12);
      if (sort === 'pricey') return (b.price ?? 0) - (a.price ?? 0);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [products, q, platform, cat, sort]);

  const inputCls =
    'rounded-sm border border-hairline bg-surface px-3 py-2 text-sm outline-none focus:border-brand';

  return (
    <div>
      <div className="flex flex-wrap gap-2 border border-hairline bg-surface p-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาในรายการนี้…"
          className={`min-w-[180px] flex-1 ${inputCls}`}
        />
        {showCategoryFilter && (
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
          <option value="">ทุกแพลตฟอร์ม</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={inputCls}>
          <option value="new">ใหม่ล่าสุด</option>
          <option value="reco">แนะนำ</option>
          <option value="discount">ลดราคาเยอะ</option>
          <option value="cheap">ราคาถูก → แพง</option>
          <option value="pricey">ราคาแพง → ถูก</option>
        </select>
      </div>

      <p className="mt-2 text-xs text-subtle">{view.length} รายการ</p>

      {view.length ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {view.map((p) => (
            <ProductCard key={`${p.platform}-${p.id}`} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-subtle">ไม่พบสินค้าตามเงื่อนไข</p>
      )}
    </div>
  );
}
