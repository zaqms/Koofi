"use client";

import Link from "next/link";
import { ListingActionFace, listingActionClassName } from "@/components/listing-action";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { listingLocationOrder } from "@/lib/listing-location";
import { listingCardTags } from "@/lib/listing-tags";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { cardPath, shopDisplayName } from "@/lib/product";
import { shopDistanceForVisitor } from "@/lib/shop-distance-label";
import type { MapsClickSource } from "@/lib/track";
import type { Language } from "@/lib/types";
import { useVisitorLocation } from "@/lib/visitor-location";

type DirectoryCardProps = {
  shop: DirectoryShop;
  language: Language;
  mapsSource?: MapsClickSource;
  badge?: string | null;
  onMapsClick?: () => void;
};

export function DirectoryCard({
  shop,
  language,
  mapsSource = "list",
  badge = null,
  onMapsClick,
}: DirectoryCardProps) {
  const name = shopDisplayName(shop, language);
  const area =
    language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood, "en");
  const tags = listingCardTags(shop, language);
  const href = cardPath(shop.id, language);
  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <li
      data-listing-card=""
      className="rounded-[var(--radius-card)] border border-wain-divider bg-wain-paper px-3.5 py-3.5 shadow-[0_2px_8px_rgba(30,23,20,0.05)]"
      dir={dir}
      lang={language}
    >
      <div className="flex items-center gap-3">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none hover:bg-wain-warm-cream/60 focus-visible:ring-2 focus-visible:ring-bean"
        >
          <ShopVisual
            nameAr={shop.nameAr}
            nameEn={shop.nameEn}
            photoUrl={shop.photoUrl}
            logoUrl={shop.logoUrl}
            size="listing"
          />
          <div className="min-w-0 flex-1 py-0.5">
            {badge ? (
              <p className="mb-1 inline-flex rounded-full bg-wain-warm-cream px-2 py-0.5 text-[11px] leading-4 text-wain-soft-taupe">
                {badge}
              </p>
            ) : null}
            <h3 className="text-lg font-semibold leading-tight break-words">
              {name}
            </h3>
            <ListingLocation
              language={language}
              neighborhood={area}
              lat={shop.lat}
              lng={shop.lng}
            />
            {tags.length > 0 ? (
              <ul className="mt-1.5 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-wain-warm-cream px-2 py-0.5 text-[11px] leading-4 text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Link>
        <div className="flex shrink-0 items-start gap-2">
          <MapsLink
            href={shop.mapsHref}
            shopId={shop.id}
            locale={language}
            source={mapsSource}
            className={listingActionClassName}
            aria-label={copy.listingMap[language]}
            title={copy.listingMap[language]}
            onClick={
              onMapsClick
                ? (event) => {
                    event.stopPropagation();
                    onMapsClick();
                  }
                : undefined
            }
          >
            <ListingActionFace label={copy.listingMap[language]}>
              <MapPinIcon className="size-5" />
            </ListingActionFace>
          </MapsLink>
          <ShareListingButton
            shop={shop}
            language={language}
            source="list"
            variant="listing"
          />
        </div>
      </div>
    </li>
  );
}

function ListingLocation({
  language,
  neighborhood,
  lat,
  lng,
}: {
  language: Language;
  neighborhood: string;
  lat?: number;
  lng?: number;
}) {
  const visitor = useVisitorLocation();
  const display = shopDistanceForVisitor({
    status: visitor.status,
    lat: visitor.status === "ready" ? visitor.lat : undefined,
    lng: visitor.status === "ready" ? visitor.lng : undefined,
    coords: lat != null && lng != null ? { lat, lng } : null,
    language,
  });
  const order = listingLocationOrder(language);
  const distance =
    display.kind === "hidden" ? null : (
      <span
        dir="ltr"
        data-shop-distance={display.kind}
        {...(display.kind === "km"
          ? { "data-shop-distance-km": display.km.toFixed(3) }
          : {})}
      >
        {display.label}
      </span>
    );

  return (
    <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] leading-4 text-wain-soft-taupe">
      <MapPinIcon className="size-3.5 shrink-0" />
      {distance && order === "distance-first" ? (
        <>
          {distance}
          <span aria-hidden>{"·"}</span>
        </>
      ) : null}
      <span className="min-w-0 break-words">{neighborhood}</span>
      {distance && order === "neighborhood-first" ? (
        <>
          <span aria-hidden>{"·"}</span>
          {distance}
        </>
      ) : null}
    </p>
  );
}
