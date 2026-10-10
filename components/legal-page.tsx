import Link from "next/link";
import { BrandHomeLink } from "@/components/brand-home-link";
import { DocumentLocale } from "@/components/document-locale";
import { SiteFooter } from "@/components/site-footer";
import { copy } from "@/lib/copy";
import {
  LEGAL_LTR_PATTERN,
  LEGAL_PLACEHOLDER_PATTERN,
  legalDoc,
  type LegalKind,
} from "@/lib/legal";
import { homePath, privacyPath, termsPath } from "@/lib/product";
import type { Language } from "@/lib/types";

function legalPath(kind: LegalKind, language: Language): string {
  return kind === "privacy" ? privacyPath(language) : termsPath(language);
}

/** Longest {{token}} kept on one line; longer ones may wrap anywhere. */
const LTR_NOWRAP_MAX = 28;

/**
 * {{token}} → an isolated LTR span, so Latin identifiers (_ga_<ID>,
 * GTM-W3TM4552, /h/…) keep their order inside Arabic text.
 */
function LtrTokens({ text }: { text: string }) {
  const parts = text.split(LEGAL_LTR_PATTERN);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <bdi
            key={index}
            dir="ltr"
            className={`font-mono text-[0.9em] ${
              // Short ids stay on one line (no "GTM-" / "W3TM4552" split);
              // only very long tokens may break.
              part.length > LTR_NOWRAP_MAX ? "[overflow-wrap:anywhere]" : "whitespace-nowrap"
            }`}
          >
            {part}
          </bdi>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
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
            <LtrTokens text={part} />
          </mark>
        ) : (
          <LtrTokens key={index} text={part} />
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
          <p className="mt-1 text-xs text-ink-soft">
            <LegalText text={doc.updated} />
          </p>
          {doc.intro.map((paragraph, index) => (
            <p key={index} className="mt-3 text-sm leading-7">
              <LegalText text={paragraph} />
            </p>
          ))}

          {doc.sections.map((section) => (
            <section key={section.heading} id={section.id} className={`${section.subsection ? "mt-4" : "mt-6"} scroll-mt-4`}>
              {section.subsection ? (
                <h3 className="text-sm font-medium">{section.heading}</h3>
              ) : (
                <h2 className="text-sm font-semibold">{section.heading}</h2>
              )}
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
              {section.after?.map((paragraph, index) => (
                <p key={`after-${index}`} className="mt-2 text-sm leading-7">
                  <LegalText text={paragraph} />
                </p>
              ))}
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
