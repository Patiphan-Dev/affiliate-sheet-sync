import type { Metadata } from 'next';
import { getGuides } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { GuideCard } from '@/components/GuideCard';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'คู่มือเลือกซื้ออุปกรณ์แคมป์ปิ้ง',
  description: 'บทความเปรียบเทียบและแนะนำวิธีเลือกซื้อเต็นท์ ถุงนอน เตา และอุปกรณ์แคมป์ปิ้งอื่น ๆ',
  alternates: { canonical: '/guides' },
};

export default async function GuidesIndex() {
  const guides = await getGuides();
  return (
    <div className="space-y-6">
      <Breadcrumbs trail={[{ name: 'หน้าแรก', path: '/' }, { name: 'คู่มือเลือกซื้อ', path: '/guides' }]} />
      <h1 className="text-3xl font-bold tracking-tight">คู่มือเลือกซื้อ</h1>
      <p className="max-w-2xl text-ink/75">
        รวมบทความช่วยตัดสินใจก่อนซื้อ — เทียบสเปก ข้อดีข้อเสีย และรุ่นที่คุ้มที่สุดในแต่ละงบ
      </p>

      {guides.length ? (
        <ul className="divide-y divide-hairline sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:divide-y-0">
          {guides.map((g) => (
            <li key={g.slug} className="py-4 first:pt-0 last:pb-0 sm:py-0">
              <GuideCard guide={g} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60">ยังไม่มีบทความ กลับมาดูใหม่เร็ว ๆ นี้</p>
      )}

      <JsonLd guides={guides.map((g) => ({ slug: g.slug, title: g.title }))} />
    </div>
  );
}

function JsonLd({ guides }: { guides: { slug: string; title: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'คู่มือเลือกซื้ออุปกรณ์แคมป์ปิ้ง',
    itemListElement: guides.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/guides/${g.slug}`,
      name: g.title,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
