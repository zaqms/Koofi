"use client";

import { useState } from "react";
import { CardBeen } from "@/components/card-been";
import { DirectoryUpvote } from "@/components/directory-upvote";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  instagramHref,
  ownerPhoneHref,
  passportHasBrewing,
  type PassportOwnerFields,
} from "@/lib/claims-types";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { officialShopCoords } from "@/lib/place-coords";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import { shopMapsHref } from "@/lib/public-url";
import type { Language, Shop } from "@/lib/types";
import { vibeLabels } from "@/lib/vibe-labels";

type CafePassportCardProps = {
  shop: Shop;
  language?: Language;
  passport: PassportOwnerFields;
};

type PassportTab = "brewing" | "photos";

export function CafePassportCard({
  shop,
  language = "ar",
  passport,
}: CafePassportCardProps) {
  const dir = language === "ar" ? "rtl" : "ltr";
  const primary = shopDisplayName(shop, language);
  const other = shopDisplayName(shop, language === "ar" ? "en" : "ar");
  const area =
    language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const tags = vibeLabels(shop, language);
  const coords = officialShopCoords(shop);
  const site = shop.officialSite?.trim();
  const photos = passport.photos;
  const brewing = passportHasBrewing(passport);
  const hours = passport.hours;
  const offer = passport.thinOffer;
  const ig = instagramHref(passport.instagram);
  const phone = ownerPhoneHref(passport.phone);
  const showTabs = brewing && photos.length > 0;
  const [tab, setTab] = useState<PassportTab>("brewing");
  const [photoIndex, setPhotoIndex] = useState(0);
  const activeTab: PassportTab = showTabs ? tab : brewing ? "brewing" : "photos";
  const photo = photos[photoIndex];

  return (
    <article
      className="mt-4 overflow-visible rounded-[28px] border border-line bg-foam shadow-[0_12px_40px_rgba(28,20,16,0.06)]"
      dir={dir}
      lang={language}
    >
      <div className="relative overflow-hidden rounded-t-[28px] bg-paper-deep">
        {photo ? (
          <div className="relative aspect-[16/10] bg-paper-deep">
            {/* Owner-supplied passport photo only. Local or http(s). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              className="size-full object-cover"
            />
            {photos.length > 1 ? (
              <p
                className="absolute top-3 start-3 rounded-full bg-charcoal/70 px-2 py-0.5 text-[11px] text-foam"
                dir="ltr"
              >
                {photoIndex + 1} / {photos.length}
              </p>
            ) : null}
            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-foam/90 px-2 py-1 text-sm text-ink"
                  onClick={() =>
                    setPhotoIndex((index) =>
                      index === 0 ? photos.length - 1 : index - 1,
                    )
                  }
                  aria-label={language === "ar" ? "الصورة السابقة" : "Previous photo"}
                >
                  {language === "ar" ? "›" : "‹"}
                </button>
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-foam/90 px-2 py-1 text-sm text-ink"
                  onClick={() =>
                    setPhotoIndex((index) =>
                      index === photos.length - 1 ? 0 : index + 1,
                    )
                  }
                  aria-label={language === "ar" ? "الصورة التالية" : "Next photo"}
                >
                  {language === "ar" ? "‹" : "›"}
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center">
            <ShopVisual
              nameAr={shop.nameAr}
              nameEn={shop.nameEn}
              photoUrl={shop.photoUrl}
              logoUrl={shop.logoUrl}
            />
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight">{primary}</h1>
            {other && other !== primary ? (
              <p className="mt-1 text-sm leading-6 text-ink-soft" dir="auto">
                {other}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <VerifiedBadge language={language} />
            {isExampleShop(shop) ? (
              <span className="rounded-full bg-paper-deep px-2.5 py-1 text-xs text-ink-soft">
                {exampleBadge(language)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-gold bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink">
            {area}
            <ShopDistance coords={coords} language={language} />
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-paper-deep px-2.5 py-1 text-[11px] leading-5 text-ink"
            >
              {tag}
            </span>
          ))}
        </div>

        {hours ? (
          <p className="mt-4 flex items-center gap-2 text-sm leading-6">
            <span className="size-2 shrink-0 rounded-full bg-vote" aria-hidden />
            <span>{hours}</span>
          </p>
        ) : null}

        {offer ? (
          <p className="mt-3 rounded-2xl bg-passport-wash px-3 py-2 text-sm leading-6">
            <span className="text-[11px] text-gold">{copy.thinOffer[language]}</span>
            <span className="ms-2">{offer}</span>
          </p>
        ) : null}

        {showTabs ? (
          <div
            className="mt-5 grid grid-cols-2 border-b border-line text-sm"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "brewing"}
              className={tabClass(activeTab === "brewing")}
              onClick={() => setTab("brewing")}
            >
              {copy.brewingTab[language]}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "photos"}
              className={tabClass(activeTab === "photos")}
              onClick={() => setTab("photos")}
            >
              {copy.photosTab[language]}
            </button>
          </div>
        ) : null}

        {activeTab === "brewing" && brewing ? (
          <BrewingPanel passport={passport} language={language} />
        ) : null}

        {activeTab === "photos" && photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                className="overflow-hidden rounded-xl bg-paper-deep"
                onClick={() => {
                  setPhotoIndex(index);
                  setTab("photos");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        {ig || phone ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {ig ? (
              <a
                href={ig}
                className="rounded-2xl border border-line px-3 py-2 hover:border-bean"
                rel="noreferrer"
                target="_blank"
              >
                {copy.instagram[language]}
              </a>
            ) : null}
            {phone ? (
              <a
                href={phone}
                className="rounded-2xl border border-line px-3 py-2 hover:border-bean"
              >
                {copy.callShop[language]}
              </a>
            ) : null}
          </div>
        ) : null}

        {site ? (
          <a
            href={site}
            className="mt-4 block rounded-2xl border border-line px-4 py-3 text-center text-sm hover:border-bean"
            rel="noreferrer"
          >
            {copy.site[language]}
          </a>
        ) : null}

        <div
          className="sticky bottom-0 -mx-5 mt-5 flex items-center gap-2 border-t border-line bg-foam px-5 py-3"
          dir="ltr"
        >
          <DirectoryUpvote shopId={shop.id} language={language} />
          <ShareListingButton shop={shop} language={language} source="card" compact />
          <MapsLink
            href={shopMapsHref(shop)}
            shopId={shop.id}
            locale={language}
            source="card"
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-gold px-3 py-2 text-sm text-ink hover:bg-passport-wash"
          >
            <MapPinIcon />
            <span>{copy.takeMeThere[language]}</span>
          </MapsLink>
        </div>

        <CardBeen shopId={shop.id} language={language} />

        <footer className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
          <p dir="ltr">{copy.listedOn[language]}</p>
        </footer>
      </div>
    </article>
  );
}

function BrewingPanel({
  passport,
  language,
}: {
  passport: PassportOwnerFields;
  language: Language;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-passport-wash px-4 py-4">
      <p className="text-[11px] tracking-wide text-gold">
        {copy.nowPouring[language]}
      </p>
      {passport.brewingTitle ? (
        <p className="mt-2 text-xl font-semibold leading-7">
          {passport.brewingTitle}
        </p>
      ) : null}
      {passport.brewingDetail ? (
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          {passport.brewingDetail}
        </p>
      ) : null}
      {passport.brewingNotes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {passport.brewingNotes.map((note) => (
            <span
              key={note}
              className="rounded-full bg-foam px-2.5 py-1 text-[11px] leading-5"
            >
              {note}
            </span>
          ))}
        </div>
      ) : null}
      {passport.brewingNote ? (
        <p className="mt-3 text-sm leading-6 italic">{passport.brewingNote}</p>
      ) : null}
      {passport.brewingExtra.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-line/70 pt-3 text-sm">
          {passport.brewingExtra.map((item) => (
            <li
              key={`${item.title}-${item.detail}`}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-ink-soft">{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function tabClass(active: boolean): string {
  return active
    ? "border-b-2 border-gold py-2 font-medium text-ink"
    : "border-b-2 border-transparent py-2 text-ink-soft";
}
