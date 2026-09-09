import Link from "next/link";
import { ContactUs } from "@/components/contact-us";
import { copy } from "@/lib/copy";
import { BrandWordmark } from "@/components/brand-wordmark";
import { aboutPath, feedbackPath } from "@/lib/product";
import type { Language } from "@/lib/types";

type SiteFooterProps = {
  language: Language;
  padded?: boolean;
  /** Cream type + inverted wordmark on charcoal Passport chrome. */
  onDark?: boolean;
};

/** Latin brand, About + Ideas links, Contact us. Home: after the directory. Cards: under back-to-chat. */
export function SiteFooter({
  language,
  padded = true,
  onDark = false,
}: SiteFooterProps) {
  const linkClass = onDark
    ? "text-xs text-foam/85 underline-offset-2 hover:text-foam hover:underline"
    : "text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline";
  const frameClass = padded
    ? onDark
      ? "mx-auto w-full max-w-md border-t border-foam/25 px-4 py-5"
      : "mx-auto w-full max-w-md border-t border-line bg-paper px-4 py-5"
    : onDark
      ? "mt-8 border-t border-foam/25 pt-4 pb-2"
      : "mt-8 border-t border-line pt-4 pb-2";

  return (
    <footer
      className={frameClass}
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <p className="text-xs" dir="ltr">
        <BrandWordmark size="footer" onDark={onDark} />
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={aboutPath(language)}
          className={linkClass}
        >
          {copy.about[language]}
        </Link>
        <Link
          href={feedbackPath(language)}
          className={linkClass}
        >
          {copy.feedbackLink[language]}
        </Link>
      </p>
      <div className="mt-3">
        <ContactUs language={language} />
      </div>
    </footer>
  );
}
