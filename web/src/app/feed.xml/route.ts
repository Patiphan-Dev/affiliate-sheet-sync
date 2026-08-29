import { getProducts, getGuides } from '@/lib/data';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

export async function GET() {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);

  const items = [
    ...guides.map((g) => ({
      title: g.title,
      link: `${SITE.url}/guides/${g.slug}`,
      desc: g.summary,
      date: g.updatedAt,
    })),
    ...products.slice(0, 50).map((p) => ({
      title: p.name,
      link: `${SITE.url}/gear/${p.slug}`,
      desc: p.caption || `${p.name} — เทียบราคาและรีวิว`,
      date: p.updatedAt,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITE.name)}</title>
<link>${SITE.url}</link>
<description>${esc(SITE.description)}</description>
<language>th</language>
${items
  .map(
    (it) => `<item>
<title>${esc(it.title)}</title>
<link>${esc(it.link)}</link>
<guid isPermaLink="true">${esc(it.link)}</guid>
<description>${esc(it.desc)}</description>${it.date ? `\n<pubDate>${new Date(it.date).toUTCString()}</pubDate>` : ''}
</item>`,
  )
  .join('\n')}
</channel></rss>`;

  return new Response(body, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
