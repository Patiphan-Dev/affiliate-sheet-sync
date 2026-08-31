import Link from 'next/link';
import Image from 'next/image';
import { IconTag, IconBook, CATEGORY_ICON } from './icons';

/** Faint topographic contour lines — instant "outdoors" texture, zero assets. */
function Contour({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 400 220"
      preserveAspectRatio="none"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.35">
        <path d="M-20 60 C 60 20, 120 90, 200 55 S 360 10, 440 55" />
        <path d="M-20 95 C 70 55, 130 130, 210 92 S 370 45, 440 92" />
        <path d="M-20 135 C 80 95, 140 175, 220 132 S 380 85, 440 132" />
        <path d="M-20 178 C 90 140, 150 210, 235 172 S 390 128, 440 172" />
      </g>
    </svg>
  );
}

const SHORTCUTS = [
  { icon: IconTag, label: 'ดีลลดราคา', href: '/deals' },
  { icon: IconBook, label: 'คู่มือเลือกซื้อ', href: '/guides' },
  { key: 'tents', label: 'เต็นท์', href: '/category/tents' },
  { key: 'sleeping-bags', label: 'ถุงนอน', href: '/category/sleeping-bags' },
  { key: 'stoves', label: 'เตา', href: '/category/stoves' },
  { key: 'furniture', label: 'เก้าอี้ & โต๊ะ', href: '/category/furniture' },
  { key: 'lighting', label: 'ไฟ & พลังงาน', href: '/category/lighting' },
] as const;

export function HomeHero() {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1.55fr_1fr]">
        {/* main */}
        <Link
          href="/deals"
          className="relative isolate flex min-h-[210px] flex-col justify-end overflow-hidden rounded-xl p-6 text-white sm:min-h-[260px]"
        >
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="(max-width:768px) 100vw, 760px"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-deep/95 via-brand/70 to-brand/25" />
          <Contour className="text-white/70" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">คัดมาให้แล้ว</p>
            <h2 className="mt-1 max-w-md text-2xl font-bold leading-tight sm:text-[28px]">
              รวมดีลอุปกรณ์แคมป์ปิ้ง อัปเดตทุกวัน
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/90">
              เทียบราคา Shopee &amp; Lazada คลิกเดียวถึงหน้าซื้อ
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand">
              ดูดีลทั้งหมด →
            </span>
          </div>
        </Link>

        {/* side */}
        <div className="grid gap-3">
          <Link
            href="/guides"
            className="relative isolate flex min-h-[100px] flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1f7a4d] to-[#2fae6b] p-5 text-white"
          >
            <Contour className="text-white" />
            <div className="relative">
              <h3 className="text-base font-bold">คู่มือเลือกซื้อ</h3>
              <p className="mt-0.5 text-xs text-white/85">เต็นท์ · ถุงนอน · เตา — เลือกให้ถูกครั้งแรก</p>
            </div>
          </Link>
          <Link
            href="/category/tents"
            className="relative isolate flex min-h-[100px] flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#b4321a] to-[#e0562f] p-5 text-white"
          >
            <Contour className="text-white" />
            <div className="relative">
              <h3 className="text-base font-bold">เต็นท์ยอดนิยม</h3>
              <p className="mt-0.5 text-xs text-white/85">เทียบ 2 แพลตฟอร์มในที่เดียว</p>
            </div>
          </Link>
        </div>
      </div>

      {/* shortcut row */}
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-3 shadow-card">
        {SHORTCUTS.map((s) => {
          const Icon = 'icon' in s ? s.icon : CATEGORY_ICON[s.key];
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex min-w-[76px] flex-col items-center gap-1.5 rounded-lg p-2 text-center transition hover:bg-page"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon />
              </span>
              <span className="text-[11px] leading-tight text-ink">{s.label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
