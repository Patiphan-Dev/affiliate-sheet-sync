import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">ไม่พบหน้านี้</h1>
      <p className="mt-2 text-ink/70">หน้าที่คุณเปิดอาจถูกย้ายหรือสินค้าถูกนำออกแล้ว</p>
      <Link href="/" className="mt-6 inline-block bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-page">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
