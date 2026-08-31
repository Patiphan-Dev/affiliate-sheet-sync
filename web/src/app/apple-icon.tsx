import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon — tent mark on the campfire orange. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ee4d2d',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path d="M32 12 8 52h48L32 12Z" fill="none" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
          <path d="M32 12v40" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
          <path d="m22 52 10-17 10 17Z" fill="#fff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
