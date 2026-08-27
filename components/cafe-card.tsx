import { CardActionRow } from "@/components/card-action-row";
import { CardBeen } from "@/components/card-been";
import { CardClaim } from "@/components/card-claim";
import { CardShare } from "@/components/card-share";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import { shopMapsHref } from "@/lib/public-url";
import type { Language, Shop } from "@/lib/types";
import { vibeLine } from "@/lib/vibe-labels";

type CafeCardProps = {
  shop: Shop;
  language?: Language;
};

export function CafeCard({ shop, language = "ar" }: CafeCardProps) {
  const hours = shop.hours?.trim();
  const primary = shopDisplayName(shop, language);
  const dir = language === "ar" ? "rtl" : "ltr";
  const area =
    language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const vibe = vibeLine(shop, language);

  return (
    <article
      className="relative mt-4 rounded-[28px] border border-line bg-foam p-6 shadow-[0_12px_40px_rgba(28,20,16,0.06)]"
      dir={dir}
      lang={language}
    >
      {isExampleShop(shop) ? (
        <span className="absolute top-5 end-5 rounded-full bg-paper-deep px-2.5 py-1 text-xs text-ink-soft">
          {exampleBadge(language)}
        </span>
      ) : null}

      <ShopVisual
        nameAr={shop.nameAr}
        nameEn={shop.nameEn}
        photoUrl={shop.photoUrl}
        logoUrl={shop.logoUrl}
      />

      <h1 className="mt-5 break-words text-4xl font-bold leading-[1.05] tracking-tight text-pretty sm:text-[2.75rem]">
        {primary}
      </h1>

      {isExampleShop(shop) ? (
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {copy.exampleNote[language]}
        </p>
      ) : null}

      <dl className="mt-6 space-y-3 rounded-2xl border border-line bg-paper/70 px-4 py-3.5 text-sm leading-6">
        <div>
          <dt className="text-xs text-ink-soft">{copy.neighborhood[language]}</dt>
          <dd>{area}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{copy.vibe[language]}</dt>
          <dd>{vibe}</dd>
        </div>
      </dl>

      <div className="mt-4 text-sm leading-6">
        <p className="text-xs text-ink-soft">{copy.hours[language]}</p>
        <p>{hours || copy.noHours[language]}</p>
      </div>

      <CardClaim language={language} />

      <CardActionRow mapsHref={shopMapsHref(shop)} language={language} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CardShare shopId={shop.id} name={primary} language={language} />
        <CardBeen shopId={shop.id} language={language} />
      </div>
    </article>
  );
}
