import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="text-xl font-semibold">هالبطاقة مو موجودة</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        يمكن الرابط غلط، أو المحل لسه ما انضاف للقائمة.
      </p>
      <Link href="/" className="mt-4 text-sm text-bean">
        ارجع للدردشة
      </Link>
    </main>
  );
}
