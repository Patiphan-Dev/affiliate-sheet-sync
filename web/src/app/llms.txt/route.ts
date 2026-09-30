import { getProducts, getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

/** https://llmstxt.org/ — a plain-text map for AI crawlers. */
export async function GET() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}. ${SITE.description}`,
    '',
    'ราคาและข้อมูลสินค้าดึงจาก Shopee และ Lazada อัตโนมัติ อัปเดตอย่างน้อยทุกชั่วโมง ลิงก์สินค้าเป็นลิงก์แนะนำ (affiliate) — ดูรายละเอียดที่หน้าการเปิดเผยลิงก์',
    '',
    '## เกี่ยวกับเว็บ',
    `- [เกี่ยวกับ${SITE.name}](${SITE.url}/about): เว็บนี้คืออะไร คัดสินค้าอย่างไร รายได้มาจากไหน`,
    `- [การเปิดเผยลิงก์แนะนำสินค้า](${SITE.url}/disclosure)`,
    `- [เนื้อหาฉบับเต็มแบบข้อความ](${SITE.url}/llms-full.txt): คู่มือและถามตอบทุกหมวดในไฟล์เดียว`,
    '',
    '## หมวดสินค้า',
    ...CATEGORIES.filter((c) => c.slug !== 'accessories').map(
      (c) => `- [${c.name}](${SITE.url}/category/${c.slug}): ${c.intro}`,
    ),
    '',
    '## คู่มือเลือกซื้อ',
    ...guides.map((g) => `- [${g.title}](${SITE.url}/guides/${g.slug}): ${g.summary}`),
    '',
    `## สินค้า (${products.length} รายการ, อัปเดตอัตโนมัติ)`,
    ...products.slice(0, 200).map((p) => {
      const price = p.price != null ? ` — ฿${p.price.toLocaleString('th-TH')}` : '';
      return `- [${p.name}](${SITE.url}/gear/${p.slug})${price}`;
    }),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
