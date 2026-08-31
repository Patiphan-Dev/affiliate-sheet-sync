import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'การเปิดเผยลิงก์แนะนำสินค้า',
  description: `${SITE.name} ใช้ลิงก์แนะนำสินค้า (affiliate) — อธิบายว่าทำงานอย่างไรและกระทบผู้ใช้อย่างไร`,
  alternates: { canonical: '/disclosure' },
};

export default function DisclosurePage() {
  return (
    <div className="max-w-2xl space-y-4">
      <Breadcrumbs trail={[{ name: 'หน้าแรก', path: '/' }, { name: 'การเปิดเผยลิงก์แนะนำ', path: '/disclosure' }]} />
      <h1 className="text-3xl font-bold tracking-tight">การเปิดเผยลิงก์แนะนำสินค้า</h1>
      <p className="text-ink/80">
        {SITE.name} เข้าร่วมโครงการพันธมิตร (affiliate) ของ Shopee และ Lazada เมื่อคุณกดลิงก์สินค้าบนเว็บนี้แล้วทำการซื้อ
        เราอาจได้รับค่าคอมมิชชั่นจากแพลตฟอร์ม <strong>โดยที่คุณไม่ต้องจ่ายเพิ่มแม้แต่บาทเดียว</strong>
      </p>
      <p className="text-ink/80">
        รายได้ส่วนนี้ใช้ดูแลเว็บและผลิตรีวิว/คู่มือ เราคัดสินค้าตามความน่าสนใจและความคุ้มค่า
        ไม่ใช่ตามอัตราค่าคอมมิชชั่น และราคาที่แสดงดึงมาอัตโนมัติ อาจไม่ตรงกับหน้าร้าน ณ เวลาที่คุณเข้าดู โปรดตรวจสอบอีกครั้งก่อนสั่งซื้อ
      </p>
    </div>
  );
}
