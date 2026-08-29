import { CardBeen } from "@/components/card-been";
import { MapsLink } from "@/components/maps-link";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { officialShopCoords } from "@/lib/place-coords";
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
  const site = shop.officialSite?.trim();
  const primary = shopDisplayName(shop, language);
  const dir = language === "ar" ? "rtl" : "ltr";
  const area =
    language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const vibe = vibeLine(shop, language);
  const coords = officialShopCoords(shop);

  return (
    <article
      className="mt-4 rounded-[28px] border border-line bg-foam p-5 shadow-[0_12px_40px_rgba(28,20,16,0.06)]"
      dir={dir}
      lang={language}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3" dir="ltr">
          <ShopVisual
            nameAr={shop.nameAr}
            nameEn={shop.nameEn}
            photoUrl={shop.photoUrl}
            logoUrl={shop.logoUrl}
          />
          <div className="min-w-0 flex-1" dir={dir}>
            <h1 className="text-2xl font-semibold leading-tight">{primary}</h1>
          </div>
        </div>
        {isExampleShop(shop) ? (
          <span className="rounded-full bg-paper-deep px-2.5 py-1 text-xs text-ink-soft">
            {exampleBadge(language)}
          </span>
        ) : null}
      </div>

      {isExampleShop(shop) ? (
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {copy.exampleNote[language]}
        </p>
      ) : null}

      <dl className="mt-5 space-y-3 text-sm leading-6">
        <div>
          <dt className="text-xs text-ink-soft">{copy.neighborhood[language]}</dt>
          <dd>
            {area}
            <ShopDistance coords={coords} language={language} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{copy.vibe[language]}</dt>
          <dd>{vibe}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{copy.hours[language]}</dt>
          <dd>{hours || copy.noHours[language]}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-2">
        <MapsLink
          href={shopMapsHref(shop)}
          className="rounded-2xl bg-bean px-4 py-3 text-center text-sm text-foam hover:bg-bean-deep"
        >
          {copy.maps[language]}
        </MapsLink>
        {site ? (
          <a
            href={site}
            className="rounded-2xl border border-line px-4 py-3 text-center text-sm hover:border-bean"
            rel="noreferrer"
          >
            {copy.site[language]}
          </a>
        ) : null}
        <CardBeen shopId={shop.id} language={language} />
      </div>
    </article>
  );
}
