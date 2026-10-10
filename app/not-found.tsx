import { headers } from "next/headers";
import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { SiteFooter } from "@/components/site-footer";
import { localeFromRequestHeaders } from "@/lib/locale";
import { homePath } from "@/lib/product";

const NOT_FOUND_COPY = {
  ar: {
    title: "هالبطاقة مو موجودة",
    hint: "يمكن الرابط غلط، أو المحل بعد ما انضاف للقائمة.",
    back: "ارجع للشات",
  },
  en: {
    title: "This card doesn't exist",
    hint: "The link may be wrong, or the café hasn't been added yet.",
    back: "Back to the chat",
  },
} as const;

export default async function NotFound() {
  // Body, footer and cookie banner follow the request locale (/en/* is
  // English), so an English 404 is English throughout.
  const language = localeFromRequestHeaders(await headers());
  const text = NOT_FOUND_COPY[language];
  return (
    <>
      <main
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4"
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
        <DocumentLocale language={language} />
        <h1 className="text-xl font-semibold">{text.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{text.hint}</p>
        <Link href={homePath(language)} className="mt-4 text-sm text-bean">
          {text.back}
        </Link>
      </main>
      <SiteFooter language={language} />
    </>
  );
}
