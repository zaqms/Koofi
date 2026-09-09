import Link from "next/link";
import { CafeCard } from "@/components/cafe-card";
import { CafeEnBlurb } from "@/components/cafe-en-blurb";
import { DocumentLocale } from "@/components/document-locale";
import { ShopUpvoteProvider } from "@/components/shop-upvote-provider";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { publicClaimStatus } from "@/lib/claims";
import { preferPassportUi } from "@/lib/claims-types";
import { shopCardNumber } from "@/lib/catalog";
import { copy } from "@/lib/copy";
import { BrandHomeLink } from "@/components/brand-home-link";
import {
  allowPassportPreview,
  isPassportPreviewShop,
} from "@/lib/passport-preview";
import { loadPassportSocial } from "@/lib/passport-social";
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
  const previewPassport =
    allowPassportPreview() && isPassportPreviewShop(shop.id);
  const claim = await publicClaimStatus(shop.id);
  const passportPage =
    previewPassport || (claim.ok && preferPassportUi(claim.status));
  const social = passportPage ? await loadPassportSocial(shop, language) : null;

  return (
    <main
      className={
        passportPage
          ? "mx-auto min-h-dvh w-full max-w-md bg-charcoal px-3 py-4"
          : "mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      }
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <TrackShareInbound
        kind="listing"
        shopId={shop.id}
        from={inboundFrom}
      />
      {passportPage ? null : (
        <header className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            <BrandHomeLink language={language} />
          </p>
          <Link
            href={localeHref}
            className="text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            {copy.switchLanguage[language]}
          </Link>
        </header>
      )}
      <ShopUpvoteProvider>
        <CafeCard
          shop={shop}
          language={language}
          previewPassport={previewPassport}
          cardNumber={shopCardNumber(shop.id)}
          backHref={home}
          localeHref={localeHref}
          social={social}
        />
      </ShopUpvoteProvider>
      {language === "en" && !passportPage ? <CafeEnBlurb shop={shop} /> : null}
      {passportPage ? null : (
        <p className="mt-6">
          <Link href={home} className="text-sm text-bean hover:text-bean-deep">
            {copy.backToChat[language]}
          </Link>
        </p>
      )}
      <div className={passportPage ? "px-2" : undefined}>
        <SiteFooter language={language} padded={false} onDark={passportPage} />
      </div>
    </main>
  );
}
