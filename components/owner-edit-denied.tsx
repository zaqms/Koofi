import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import type { OwnerTokenError } from "@/lib/claims-types";
import { copy, ownerEditErrorCopy } from "@/lib/copy";
import { homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type OwnerEditDeniedProps = {
  language: Language;
  error: OwnerTokenError;
};

export function OwnerEditDenied({ language, error }: OwnerEditDeniedProps) {
  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md bg-charcoal px-4 py-6 text-foam"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="flex items-center justify-between gap-3 text-sm">
        <BrandHomeLink language={language} className="text-foam" />
      </header>
      <section className="mt-10 rounded-[28px] border border-gold/35 bg-foam px-5 py-8 text-ink shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
          {copy.ownerEditTitle[language]}
        </p>
        <h1 className="mt-3 font-serif text-2xl leading-tight font-semibold">
          {copy.ownerEditDenied[language]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          {ownerEditErrorCopy(error, language)}
        </p>
        <p className="mt-6">
          <Link
            href={homePath(language)}
            className="inline-flex min-h-11 items-center rounded-lg border border-gold px-4 text-sm text-gold hover:bg-passport-wash"
          >
            {copy.passportBack[language]}
          </Link>
        </p>
      </section>
    </main>
  );
}
