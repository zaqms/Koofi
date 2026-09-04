import Link from "next/link";
import { DirectoryUpvote } from "@/components/directory-upvote";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { cardPath, shopDisplayName } from "@/lib/product";
import type { Language } from "@/lib/types";
import { vibeLine } from "@/lib/vibe-labels";

type DirectoryCardProps = {
  shop: DirectoryShop;
  language: Language;
};

export function DirectoryCard({ shop, language }: DirectoryCardProps) {
  const name = shopDisplayName(shop, language);
  const area = language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const vibe = vibeLine(shop, language);
  const href = cardPath(shop.id, language);

  return (
    <li className="rounded-2xl border border-line bg-foam px-3 py-3">
      <div className="flex items-start gap-2" dir="ltr">
        <Link
          href={href}
          className="flex min-h-16 min-w-0 flex-1 items-start gap-3 rounded-xl outline-none hover:bg-paper-deep/70 focus-visible:ring-2 focus-visible:ring-bean"
          dir="ltr"
        >
          <ShopVisual
            nameAr={shop.nameAr}
            nameEn={shop.nameEn}
            photoUrl={shop.photoUrl}
            logoUrl={shop.logoUrl}
          />
          <div
            className="min-w-0 flex-1 py-0.5"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <h3 className="text-lg font-semibold leading-tight">{name}</h3>
            <p className="text-[11px] leading-4 text-ink-soft">
              {area}
              <ShopDistance
                coords={
                  shop.lat != null && shop.lng != null
                    ? { lat: shop.lat, lng: shop.lng }
                    : null
                }
                language={language}
              />
            </p>
            {vibe ? (
              <p className="mt-1 truncate text-sm leading-5">{vibe}</p>
            ) : null}
            <p className="mt-1 text-xs text-bean underline-offset-2">
              {copy.cardLink[language]}
            </p>
          </div>
        </Link>
        <DirectoryUpvote shopId={shop.id} language={language} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <MapsLink
          href={shop.mapsHref}
          shopId={shop.id}
          locale={language}
          source="list"
          className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
          aria-label={copy.maps[language]}
          title={copy.maps[language]}
        >
          <MapPinIcon />
        </MapsLink>
        <ShareListingButton shop={shop} language={language} source="list" />
      </div>
    </li>
  );
}
