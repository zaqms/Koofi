import Link from "next/link";
import { BrandHomeLink } from "@/components/brand-home-link";
import { DocumentLocale } from "@/components/document-locale";
import { SiteFooter } from "@/components/site-footer";
import { copy } from "@/lib/copy";
import {
  LEGAL_PLACEHOLDER_PATTERN,
  legalDoc,
  type LegalKind,
} from "@/lib/legal";
import { homePath, privacyPath, termsPath } from "@/lib/product";
import type { Language } from "@/lib/types";

function legalPath(kind: LegalKind, language: Language): string {
  return kind === "privacy" ? privacyPath(language) : termsPath(language);
}

/** Highlight review markers so nothing unconfirmed reads as final. */
function LegalText({ text }: { text: string }) {
  const parts = text.split(LEGAL_PLACEHOLDER_PATTERN);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={index}
            className="rounded bg-gold/25 px-1 font-semibold text-ink [overflow-wrap:anywhere]"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

type LegalPageViewProps = {
  kind: LegalKind;
  language: Language;
};

export function LegalPageView({ kind, language }: LegalPageViewProps) {
  const doc = legalDoc(kind, language);
  const other: Language = language === "ar" ? "en" : "ar";
  const sibling: LegalKind = kind === "privacy" ? "terms" : "privacy";
  const siblingLabel =
    sibling === "privacy" ? copy.privacyLink[language] : copy.termsLink[language];

  return (
    <>
      <main
        className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
        dir={language === "ar" ? "rtl" : "ltr"}
        lang={language}
      >
        <DocumentLocale language={language} />
        <header className="flex items-center justify-between gap-3">
          <BrandHomeLink language={language} className="text-lg font-semibold" />
          <Link
            href={legalPath(kind, other)}
            className="text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            {copy.switchLanguage[language]}
          </Link>
        </header>

        <article className="mt-8 rounded-2xl border border-line bg-foam px-4 py-5 [overflow-wrap:anywhere]">
          <h1 className="text-base font-semibold">{doc.title}</h1>
          <p className="mt-1 text-xs text-ink-soft">{doc.updated}</p>
          {doc.intro.map((paragraph, index) => (
            <p key={index} className="mt-3 text-sm leading-7">
              <LegalText text={paragraph} />
            </p>
          ))}

          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-6">
              <h2 className="text-sm font-semibold">{section.heading}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="mt-2 text-sm leading-7">
                  <LegalText text={paragraph} />
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-7">
                  {section.bullets.map((bullet, index) => (
                    <li key={index}>
                      <LegalText text={bullet} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <p className="mt-6">
            <Link
              href={legalPath(sibling, language)}
              className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
            >
              {siblingLabel}
            </Link>
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
      <SiteFooter language={language} />
    </>
  );
}
