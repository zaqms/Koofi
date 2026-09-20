import { CafeCard } from "@/components/cafe-card";
import { CafeEnBlurb } from "@/components/cafe-en-blurb";
import { DocumentLocale } from "@/components/document-locale";
import { ShopUpvoteProvider } from "@/components/shop-upvote-provider";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { listDirectoryShopsForDistrict } from "@/lib/catalog";
import { cardPath, homePath } from "@/lib/product";
import type { Language, Shop } from "@/lib/types";

type CafeCardPageViewProps = {
  shop: Shop;
  language: Language;
  inboundFrom?: string;
};

export async function CafeCardPageView({
  shop,
  language,
  inboundFrom,
}: CafeCardPageViewProps) {
  const home = homePath(language);
  const other: Language = language === "ar" ? "en" : "ar";
  const localeHref = inboundFrom
    ? `${cardPath(shop.id, other)}?from=${encodeURIComponent(inboundFrom)}`
    : cardPath(shop.id, other);
  const siblings = listDirectoryShopsForDistrict(shop.neighborhood).filter(
    (row) => row.id !== shop.id,
  );

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md bg-wain-paper px-4 pb-6 pt-3"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <TrackShareInbound
        kind="listing"
        shopId={shop.id}
        from={inboundFrom}
      />
      <ShopUpvoteProvider>
        <CafeCard
          shop={shop}
          language={language}
          backHref={home}
          localeHref={localeHref}
          siblings={siblings}
        />
      </ShopUpvoteProvider>
      <CafeEnBlurb shop={shop} language={language} />
      <SiteFooter language={language} padded={false} />
    </main>
  );
}
