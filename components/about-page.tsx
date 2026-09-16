import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import { ContactUs } from "@/components/contact-us";
import { FaqList } from "@/components/faq-list";
import { copy } from "@/lib/copy";
import { aboutFaqs, faqHeading } from "@/lib/faq";
import { aboutPath, feedbackPath, homePath, LOCKED_ABOUT } from "@/lib/product";
import type { Language } from "@/lib/types";

function AboutMarks({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <em key={index}>{part.slice(1, -1)}</em>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function AboutLockedCopy({ language }: { language: Language }) {
  const blocks = LOCKED_ABOUT.markdown[language].trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, index) => (
        <p key={index} className="mt-3 text-sm leading-7">
          {block.split("\n").map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              <AboutMarks text={line} />
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

type AboutPageViewProps = {
  language: Language;
};

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
        <AboutLockedCopy language={language} />
        <p className="mt-4">
          <Link
            href={feedbackPath(language)}
            className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            {copy.feedbackLink[language]}
          </Link>
        </p>
      </article>

      <FaqList
        items={aboutFaqs(language)}
        language={language}
        heading={faqHeading(language)}
      />

      <div className="mt-8 border-t border-line pt-4">
        <ContactUs language={language} />
      </div>

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
