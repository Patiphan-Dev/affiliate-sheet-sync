import type { Metadata } from 'next';
import { getProducts } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { ProductExplorer } from '@/components/ProductExplorer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { itemListLd } from '@/lib/schema';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ดีลลดราคาอุปกรณ์แคมป์ปิ้ง',
  description: 'รวมสินค้าแคมป์ปิ้งที่กำลังลดราคาจาก Shopee และ Lazada อัปเดตอัตโนมัติทุกวัน',
  alternates: { canonical: '/deals' },
};

export default async function DealsPage() {
  const all = await getProducts();
  const onSale = all.filter((p) => p.discountPercent > 0 || p.hot);
  const list = (onSale.length ? onSale : all).slice(0, 120);

  return (
    <div className="space-y-4">
      <Breadcrumbs trail={[{ name: 'หน้าแรก', path: '/' }, { name: 'ดีลลดราคา', path: '/deals' }]} />
      <div className="bg-surface p-3">
        <div className="section-title">ดีลลดราคา &amp; สินค้าขายดี</div>
        <p className="mt-2 text-sm text-subtle">
          {list.length} รายการ — เรียงตามส่วนลดมากที่สุด กดการ์ดเพื่อไปหน้าสินค้าที่ร้านได้เลย
        </p>
        <div className="mt-3">
          <ProductExplorer products={list} showCategoryFilter categories={CATEGORIES} />
        </div>
      </div>
      <JsonLd data={itemListLd(list, '/deals')} />
    </div>
  );
}
