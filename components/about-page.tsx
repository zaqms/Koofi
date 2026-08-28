import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import { copy } from "@/lib/copy";
import { FEEDBACK_MAIL, aboutPath, homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type AboutPageViewProps = {
  language: Language;
};

function AboutNote({ language }: { language: Language }) {
  const text = copy.aboutNote[language];
  const at = text.indexOf(FEEDBACK_MAIL);
  if (at === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, at)}
      <a
        href={`mailto:${FEEDBACK_MAIL}`}
        className="text-bean underline-offset-2 hover:text-bean-deep hover:underline"
      >
        {FEEDBACK_MAIL}
      </a>
      {text.slice(at + FEEDBACK_MAIL.length)}
    </>
  );
}

export function AboutPageView({ language }: AboutPageViewProps) {
  const other: Language = language === "ar" ? "en" : "ar";

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="flex items-center justify-between gap-3">
        <BrandHomeLink language={language} className="text-lg font-semibold" />
        <Link
          href={aboutPath(other)}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>

      <article className="mt-8 rounded-2xl border border-line bg-foam px-4 py-5">
        <h1 className="text-base font-semibold">{copy.about[language]}</h1>
        <p className="mt-3 text-sm leading-7">{copy.aboutLead[language]}</p>
        <p className="mt-3 text-sm leading-7">
          <AboutNote language={language} />
        </p>
      </article>

      <p className="mt-6">
        <Link
          href={homePath(language)}
          className="text-sm text-bean hover:text-bean-deep"
        >
          {copy.backToChat[language]}
        </Link>
      </p>
    </main>
  );
}
