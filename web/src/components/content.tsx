import type { Product } from '@/types';
import { baht } from '@/lib/format';

/** Short answer-first box — the bit AI answer engines tend to lift and cite. */
export function Tldr({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rounded-xl border-l-4 border-brand bg-surface p-4 text-sm leading-relaxed text-ink/85">
      <span className="mr-2 text-brand">สรุปสั้น</span>
      {children}
    </aside>
  );
}

export function AffiliateNote() {
  return (
    <p className="mt-3 text-xs text-ink/55">
      บทความนี้มีลิงก์แนะนำสินค้า เราอาจได้รับค่าตอบแทนเมื่อคุณซื้อผ่านลิงก์ โดยไม่มีค่าใช้จ่ายเพิ่มกับคุณ
    </p>
  );
}

/** Article HTML from the Sheet. Trusted: authored by the site's own pipeline. */
export function ArticleBody({ html }: { html: string }) {
  return (
    <div
      className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/85 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand [&_h3]:mt-6 [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-brand [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ComparisonTable({ products }: { products: Product[] }) {
  if (products.length < 2) return null;
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-hairline text-left text-ink/70">
            <th className="py-2 pr-3 font-medium">รุ่น</th>
            <th className="py-2 pr-3 font-medium">ราคา</th>
            <th className="py-2 pr-3 font-medium">แพลตฟอร์ม</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={`${p.platform}-${p.id}`} className="border-b border-hairline align-top">
              <td className="py-2 pr-3">{p.name}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{baht(p.price)}</td>
              <td className="py-2 pr-3 capitalize">{p.platform}</td>
              <td className="py-2">
                <a
                  href={p.link}
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="text-brand underline whitespace-nowrap"
                >
                  ดูราคา →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
