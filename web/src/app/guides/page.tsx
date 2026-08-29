import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuides } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { thaiDate } from '@/lib/format';
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
      <h1 className="text-3xl text-brand">คู่มือเลือกซื้อ</h1>
      <p className="max-w-2xl text-ink/75">
        รวมบทความช่วยตัดสินใจก่อนซื้อ — เทียบสเปก ข้อดีข้อเสีย และรุ่นที่คุ้มที่สุดในแต่ละงบ
      </p>

      {guides.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug} className="rounded-xl border border-hairline bg-white p-5">
              <Link href={`/guides/${g.slug}`} className="text-lg text-ink hover:text-brand">
                {g.title}
              </Link>
              <p className="mt-1 line-clamp-3 text-sm text-ink/70">{g.summary}</p>
              {g.updatedAt && <p className="mt-2 text-xs text-ink/45">อัปเดต {thaiDate(g.updatedAt)}</p>}
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
