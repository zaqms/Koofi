import Link from "next/link";
import { CafeCard } from "@/components/cafe-card";
import { DocumentLocale } from "@/components/document-locale";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { copy } from "@/lib/copy";
import { BrandHomeLink } from "@/components/brand-home-link";
import { cardPath, homePath } from "@/lib/product";
import type { Language, Shop } from "@/lib/types";

type CafeCardPageViewProps = {
  shop: Shop;
  language: Language;
  inboundFrom?: string;
};

export function CafeCardPageView({
  shop,
  language,
  inboundFrom,
}: CafeCardPageViewProps) {
  const home = homePath(language);
  const other: Language = language === "ar" ? "en" : "ar";
  const localeHref = inboundFrom
    ? `${cardPath(shop.id, other)}?from=${encodeURIComponent(inboundFrom)}`
    : cardPath(shop.id, other);

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <TrackShareInbound
        kind="listing"
        shopId={shop.id}
        from={inboundFrom}
      />
      <header className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          <BrandHomeLink language={language} /> · {copy.shareHint[language]}
        </p>
        <Link
          href={localeHref}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>
      <CafeCard shop={shop} language={language} />
      <p className="mt-6">
        <Link href={home} className="text-sm text-bean hover:text-bean-deep">
          {copy.backToChat[language]}
        </Link>
      </p>
      <SiteFooter language={language} padded={false} />
    </main>
  );
}
