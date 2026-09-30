import { getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';
import { htmlToText } from '@/lib/text';

export const revalidate = 3600;

/**
 * Full-text companion to /llms.txt: every guide and category FAQ as plain text,
 * so an answer engine can read the site's actual content in one fetch.
 */
export async function GET() {
  const guides = await getGuides();

  const out: string[] = [
    `# ${SITE.name} — เนื้อหาฉบับเต็ม`,
    '',
    `> ${SITE.tagline}. ${SITE.description}`,
    '',
    '# คู่มือเลือกซื้อ',
  ];

  for (const g of guides) {
    out.push('', `## ${g.title}`, `URL: ${SITE.url}/guides/${g.slug}`);
    if (g.updatedAt) out.push(`อัปเดตล่าสุด: ${g.updatedAt.slice(0, 10)}`);
    out.push('', `สรุป: ${g.summary}`, '', htmlToText(g.bodyHtml));
    if (g.faq.length) {
      out.push('', '### คำถามที่พบบ่อย');
      for (const f of g.faq) out.push('', `**${f.q}**`, f.a);
    }
  }

  out.push('', '# ถามตอบตามหมวดสินค้า');
  for (const c of CATEGORIES) {
    out.push('', `## ${c.name}`, `URL: ${SITE.url}/category/${c.slug}`, '', c.intro);
    for (const f of c.faq) out.push('', `**${f.q}**`, f.a);
  }

  return new Response(out.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
