import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { aboutPageLd, breadcrumbLd, faqLd } from '@/lib/schema';
import { SITE } from '@/lib/site';
import { socialMetadata } from '@/lib/social';
import type { Faq } from '@/types';

const TITLE = `เกี่ยวกับ${SITE.name}`;
const DESCRIPTION = `${SITE.name} คืออะไร คัดสินค้าอย่างไร ราคามาจากไหน และรายได้มาจากไหน — อธิบายวิธีทำงานของเว็บรวมอุปกรณ์แคมป์ปิ้งจาก Shopee และ Lazada`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, path: '/about' }),
};

const FAQ: Faq[] = [
  {
    q: `${SITE.name} คืออะไร`,
    a: `${SITE.name} เป็นเว็บรวมอุปกรณ์แคมป์ปิ้งที่คัดจาก Shopee และ Lazada พร้อมคู่มือเลือกซื้อและรีวิว เพื่อให้เทียบรุ่นและราคาได้ในที่เดียว`,
  },
  {
    q: 'ราคาบนเว็บอัปเดตบ่อยแค่ไหน',
    a: 'ราคาและข้อมูลสินค้าดึงมาอัตโนมัติและรีเฟรชอย่างน้อยทุกชั่วโมง แต่ราคาจริงอาจเปลี่ยนได้ทุกเมื่อ โปรดตรวจสอบที่หน้าร้านก่อนสั่งซื้อ',
  },
  {
    q: 'เว็บนี้ได้เงินจากไหน',
    a: 'เว็บเข้าร่วมโครงการพันธมิตร (affiliate) ของ Shopee และ Lazada เมื่อมีการซื้อผ่านลิงก์ในเว็บ เราอาจได้ค่าคอมมิชชั่นโดยผู้ซื้อไม่ต้องจ่ายเพิ่ม',
  },
  {
    q: 'คัดสินค้าโดยดูจากอะไร',
    a: 'คัดตามความน่าสนใจและความคุ้มค่าของสินค้า ไม่ใช่ตามอัตราค่าคอมมิชชั่น',
  },
];

const TRAIL = [
  { name: 'หน้าแรก', path: '/' },
  { name: TITLE, path: '/about' },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <Breadcrumbs trail={TRAIL} />
      <h1 className="text-3xl font-bold tracking-tight">{TITLE}</h1>
      <p className="text-ink/80">
        {SITE.name} — {SITE.tagline} เราช่วยให้คนที่กำลังจะไปตั้งแคมป์เลือกเต็นท์ ถุงนอน เตา เก้าอี้ ไฟ และอุปกรณ์อื่นได้เร็วขึ้น
        โดยรวมรุ่นน่าสนใจจาก Shopee และ Lazada ไว้ที่เดียว พร้อมตารางเทียบรุ่นและคู่มือเลือกซื้อที่อ่านจบแล้วตัดสินใจได้
      </p>
      <h2 className="text-xl font-bold tracking-tight">เราทำงานอย่างไร</h2>
      <ul className="list-disc space-y-2 pl-5 text-ink/80">
        <li>ข้อมูลสินค้า ราคา และรูปภาพดึงจากแพลตฟอร์มอัตโนมัติและอัปเดตอย่างน้อยทุกชั่วโมง</li>
        <li>คัดสินค้าตามความน่าสนใจและความคุ้มค่า ไม่ใช่ตามอัตราค่าคอมมิชชั่น</li>
        <li>คู่มือและรีวิวเขียนให้ตอบคำถามตรงๆ ก่อน แล้วค่อยอธิบายเหตุผลและข้อควรระวัง</li>
        <li>ทุกลิงก์สินค้าเป็นลิงก์แนะนำ (affiliate) — อ่านรายละเอียดที่ <Link href="/disclosure" className="underline underline-offset-2">หน้าการเปิดเผยลิงก์</Link></li>
      </ul>
      <FaqList items={FAQ} />
      <JsonLd data={[aboutPageLd(), breadcrumbLd(TRAIL), faqLd(FAQ)]} />
    </div>
  );
}
