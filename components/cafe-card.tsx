"use client";

import { useEffect, useState } from "react";
import { CafeClaimFooter } from "@/components/cafe-claim-footer";
import { CafePassportCard } from "@/components/cafe-passport-card";
import { CardBeen } from "@/components/card-been";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import {
  emptyPassport,
  preferPassportUi,
  type ClaimStatus,
  type PassportOwnerFields,
} from "@/lib/claims-types";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { woodsPassportFixture } from "@/lib/passport-preview";
import { officialShopCoords } from "@/lib/place-coords";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import { shopMapsHref } from "@/lib/public-url";
import type { Language, Shop } from "@/lib/types";
import { vibeLine } from "@/lib/vibe-labels";

type CafeCardProps = {
  shop: Shop;
  language?: Language;
  previewPassport?: boolean;
};

type ClaimPayload = {
  ok?: boolean;
  status?: ClaimStatus;
  passport?: PassportOwnerFields;
  preview?: boolean;
};

export function CafeCard({
  shop,
  language = "ar",
  previewPassport = false,
}: CafeCardProps) {
  const [status, setStatus] = useState<ClaimStatus>(
    previewPassport ? "verified" : "none",
  );
  const [passport, setPassport] = useState<PassportOwnerFields>(() =>
    previewPassport ? woodsPassportFixture(language) : emptyPassport(),
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/claims?shopId=${encodeURIComponent(shop.id)}`)
      .then((response) => response.json() as Promise<ClaimPayload>)
      .then((payload) => {
        if (cancelled || !payload.ok) return;
        if (payload.status === "verified") {
          setStatus("verified");
          setPassport(
            payload.preview
              ? woodsPassportFixture(language)
              : (payload.passport ?? emptyPassport()),
          );
          return;
        }
        if (payload.status === "pending") {
          setStatus("pending");
          return;
        }
        if (previewPassport) {
          setStatus("verified");
          setPassport(woodsPassportFixture(language));
          return;
        }
        setStatus("none");
      })
      .catch(() => {
        if (previewPassport) {
          setStatus("verified");
          setPassport(woodsPassportFixture(language));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [language, previewPassport, shop.id]);

  if (preferPassportUi(status)) {
    return (
      <CafePassportCard shop={shop} language={language} passport={passport} />
    );
  }

  return (
    <ThinCafeCard shop={shop} language={language} status={status} />
  );
}

function ThinCafeCard({
  shop,
  language,
  status,
}: {
  shop: Shop;
  language: Language;
  status: ClaimStatus;
}) {
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
      </dl>

      <div className="mt-5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MapsLink
            href={shopMapsHref(shop)}
            shopId={shop.id}
            locale={language}
            source="card"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
            aria-label={copy.maps[language]}
            title={copy.maps[language]}
          >
            <MapPinIcon />
          </MapsLink>
          <ShareListingButton shop={shop} language={language} source="card" />
        </div>
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
      <CafeClaimFooter shop={shop} language={language} status={status} />
    </article>
  );
}
