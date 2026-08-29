import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #f53d2d 0%, #ee4d2d 45%, #ff7a45 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="60" height="60" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#fff" />
            <path d="M32 16 14 48h36L32 16Z" fill="none" stroke="#ee4d2d" strokeWidth="5" strokeLinejoin="round" />
            <path d="M32 16v32" stroke="#ee4d2d" strokeWidth="5" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 940 }}>{SITE.tagline}</div>
          <div style={{ fontSize: 30, opacity: 0.92 }}>
            รวมดีลอุปกรณ์แคมป์ปิ้ง · เทียบราคา Shopee &amp; Lazada
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
