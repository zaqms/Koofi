import Link from "next/link";
import { ContactUs } from "@/components/contact-us";
import { copy } from "@/lib/copy";
import { BrandWordmark } from "@/components/brand-wordmark";
import { aboutPath } from "@/lib/product";
import type { Language } from "@/lib/types";

type SiteFooterProps = {
  language: Language;
  padded?: boolean;
};

/** Latin brand, About link, Contact us. Home: after the directory. Cards: under back-to-chat. */
export function SiteFooter({ language, padded = true }: SiteFooterProps) {
  return (
    <footer
      className={
        padded
          ? "mx-auto w-full max-w-md border-t border-line bg-paper px-4 py-5"
          : "mt-8 border-t border-line pt-4 pb-2"
      }
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <p className="text-xs" dir="ltr">
        <BrandWordmark />
      </p>
      <Link
        href={aboutPath(language)}
        className="mt-2 inline-block text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
      >
        {copy.about[language]}
      </Link>
      <div className="mt-3">
        <ContactUs language={language} />
      </div>
    </footer>
  );
}
