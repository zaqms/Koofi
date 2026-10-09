import { headers } from "next/headers";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { localeFromRequestHeaders } from "@/lib/locale";

export default async function NotFound() {
  // Footer (Privacy, Terms, Cookie settings) follows the request locale,
  // like the cookie banner; the 404 body copy is unchanged.
  const language = localeFromRequestHeaders(await headers());
  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <h1 className="text-xl font-semibold">هالبطاقة مو موجودة</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          يمكن الرابط غلط، أو المحل بعد ما انضاف للقائمة.
        </p>
        <Link href="/" className="mt-4 text-sm text-bean">
          ارجع للشات
        </Link>
      </main>
      <SiteFooter language={language} />
    </>
  );
}
