import Link from "next/link";
import { CafeCard } from "@/components/cafe-card";
import { DocumentLocale } from "@/components/document-locale";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME } from "@/lib/product";
import type { Language, Shop } from "@/lib/types";

type CafeCardPageViewProps = {
  shop: Shop;
  language: Language;
};

export function CafeCardPageView({ shop, language }: CafeCardPageViewProps) {
  const home = language === "en" ? "/en" : "/";

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <p className="text-xs text-ink-soft">
        {PRODUCT_NAME} · {copy.shareHint[language]}
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
