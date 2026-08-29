import Link from 'next/link';

/** Shopee-style top block: a 3-banner promo grid + a row of quick shortcuts. */

const BANNERS = {
  main: {
    href: '/deals',
    title: 'รวมดีลแคมป์ปิ้ง คัดมาให้แล้ว',
    sub: 'อัปเดตราคาและส่วนลดจาก Shopee & Lazada ทุกวัน',
    className: 'from-brand-deep to-brand',
  },
  topRight: {
    href: '/guides',
    title: 'คู่มือเลือกซื้อ',
    sub: 'เต็นท์ · ถุงนอน · เตา — เลือกให้ถูกตั้งแต่ครั้งแรก',
    className: 'from-[#f97316] to-brand',
  },
  bottomRight: {
    href: '/category/tents',
    title: 'เต็นท์ยอดนิยม',
    sub: 'เทียบราคา 2 แพลตฟอร์มในที่เดียว',
    className: 'from-[#d0011b] to-brand-deep',
  },
};

const SHORTCUTS: { icon: string; label: string; href: string }[] = [
  { icon: '🏷️', label: 'ดีลลดราคา', href: '/deals' },
  { icon: '📖', label: 'คู่มือเลือกซื้อ', href: '/guides' },
  { icon: '⛺', label: 'เต็นท์', href: '/category/tents' },
  { icon: '🛌', label: 'ถุงนอน', href: '/category/sleeping-bags' },
  { icon: '🔥', label: 'เตา', href: '/category/stoves' },
  { icon: '🪑', label: 'เก้าอี้ & โต๊ะ', href: '/category/furniture' },
  { icon: '🔦', label: 'ไฟ & พลังงาน', href: '/category/lighting' },
];

function Banner({ href, title, sub, className, tall = false }: (typeof BANNERS)['main'] & { tall?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col justify-end rounded-sm bg-gradient-to-br ${className} p-4 text-white ${
        tall ? 'min-h-[180px] sm:min-h-[240px]' : 'min-h-[86px] sm:min-h-[114px]'
      }`}
    >
      <div className={tall ? 'text-xl font-bold sm:text-2xl' : 'text-base font-bold'}>{title}</div>
      <div className="mt-1 text-xs text-white/90 sm:text-sm">{sub}</div>
    </Link>
  );
}

export function HomeHero() {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Banner {...BANNERS.main} tall />
        <div className="grid grid-rows-2 gap-2">
          <Banner {...BANNERS.topRight} />
          <Banner {...BANNERS.bottomRight} />
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto bg-white p-3">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href + s.label}
            href={s.href}
            className="flex min-w-[68px] flex-col items-center gap-1 rounded-sm p-1 text-center hover:bg-page"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="text-[11px] leading-tight text-ink">{s.label}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
