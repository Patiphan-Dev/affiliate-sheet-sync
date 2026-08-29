export function baht(n: number | null): string {
  return n == null ? '—' : `฿${n.toLocaleString('th-TH')}`;
}

export function thaiDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function platformLabel(p: string): string {
  return p === 'lazada' ? 'Lazada' : 'Shopee';
}

/** 3200 → "3.2พัน+", 45 → "45" — Shopee-style sold count. */
export function soldText(n: number | null): string {
  if (!n || n < 1) return '';
  if (n >= 1_000_000) return `${Math.floor(n / 100_000) / 10}ล้าน+`;
  if (n >= 1_000) return `${Math.floor(n / 100) / 10}พัน+`;
  return String(n);
}
