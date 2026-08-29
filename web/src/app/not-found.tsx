import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl text-brand">ไม่พบหน้านี้</h1>
      <p className="mt-2 text-ink/70">หน้าที่คุณเปิดอาจถูกย้ายหรือสินค้าถูกนำออกแล้ว</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
