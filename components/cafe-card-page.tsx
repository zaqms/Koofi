import Link from "next/link";
import { CafeCard } from "@/components/cafe-card";
import { DocumentLocale } from "@/components/document-locale";
import { copy } from "@/lib/copy";
import { BrandHomeLink } from "@/components/brand-home-link";
import { homePath } from "@/lib/product";
import type { Language, Shop } from "@/lib/types";

type CafeCardPageViewProps = {
  shop: Shop;
  language: Language;
};

export function CafeCardPageView({ shop, language }: CafeCardPageViewProps) {
  const home = homePath(language);

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md overflow-visible px-4 pt-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <p className="text-xs text-ink-soft">
        <BrandHomeLink language={language} /> · {copy.shareHint[language]}
      </p>
      <CafeCard shop={shop} language={language} />
      <p className="mt-6">
        <Link href={home} className="text-sm text-bean hover:text-bean-deep">
          {copy.backToChat[language]}
        </Link>
      </p>
    </main>
  );
}
