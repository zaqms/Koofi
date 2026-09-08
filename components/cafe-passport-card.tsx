"use client";

import Link from "next/link";
import { useState } from "react";
import { DirectoryUpvote } from "@/components/directory-upvote";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { TargetIcon } from "@/components/target-icon";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  passportHasBrewing,
  type PassportOwnerFields,
} from "@/lib/claims-types";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { shopMapsHref } from "@/lib/public-url";
import type { Language, Shop } from "@/lib/types";
import { vibeLabels } from "@/lib/vibe-labels";

export type PassportSocial = {
  rating: number;
  reviewCount: number;
  reviewSnippet?: string;
};

type CafePassportCardProps = {
  shop: Shop;
  language?: Language;
  passport: PassportOwnerFields;
  cardNumber: string;
  backHref: string;
  localeHref: string;
  social?: PassportSocial | null;
};

type PassportTab = "brewing" | "photos" | "reviews";

export function CafePassportCard({
  shop,
  language = "ar",
  passport,
  cardNumber,
  backHref,
  localeHref,
  social = null,
}: CafePassportCardProps) {
  const dir = language === "ar" ? "rtl" : "ltr";
  const area =
    language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const tags = passportVibeTags(shop, language);
  const photos = heroPhotos(shop, passport);
  const brewing = passportHasBrewing(passport);
  const hours = passport.hours;
  const offer = passport.thinOffer;
  const [tab, setTab] = useState<PassportTab>("brewing");
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex];

  return (
    <article
      className="overflow-hidden rounded-[28px] border border-gold/35 bg-foam text-ink shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
      dir={dir}
      lang={language}
    >
      <div className="relative aspect-[4/3] bg-charcoal">
        {photo ? (
          // Owner / preview-fixture photo only.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-charcoal text-gold">
            <span className="font-serif text-2xl tracking-[0.2em]">
              {copy.cardNo[language]} {cardNumber}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-charcoal/70 to-transparent px-3 pt-3 pb-8 text-[11px] text-foam">
          <Link
            href={backHref}
            className="inline-flex min-h-8 items-center text-foam/90 hover:text-foam"
          >
            {language === "en" ? "← " : null}
            {copy.passportBack[language]}
            {language === "ar" ? " ←" : null}
          </Link>
          <p className="font-serif tracking-[0.14em] text-foam/90" dir="ltr">
            {copy.cardNo[language]} {cardNumber}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={localeHref}
              className="text-foam/80 underline-offset-2 hover:text-foam hover:underline"
            >
              {copy.switchLanguage[language]}
            </Link>
            <ShareListingButton
              shop={shop}
              language={language}
              source="card"
              variant="ghost"
            />
          </div>
        </div>
        {photos.length > 0 ? (
          <p
            className="absolute top-12 end-3 rounded-full bg-charcoal/65 px-2 py-0.5 text-[11px] text-foam"
            dir="ltr"
          >
            {photoIndex + 1} / {photos.length}
          </p>
        ) : null}
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute start-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-foam/80 text-ink"
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
              className="absolute end-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-foam/80 text-ink"
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

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.65rem] leading-tight font-semibold">
              {shop.nameEn}
            </h1>
            <p className="mt-1 text-sm leading-6 text-ink-soft" dir="rtl">
              {shop.nameAr}
            </p>
          </div>
          <VerifiedBadge language={language} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-gold px-2.5 py-1 text-[11px] leading-5 text-gold-deep">
              {area}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-paper-deep/60 px-2.5 py-1 text-[11px] leading-5 text-ink"
              >
                {tag}
              </span>
            ))}
          </div>
          {social ? <GoogleRating social={social} language={language} /> : null}
        </div>

        {hours ? (
          <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm leading-6">
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

        <div
          className="mt-5 grid grid-cols-3 border-y border-line text-sm"
          role="tablist"
        >
          <TabButton
            active={tab === "brewing"}
            onClick={() => setTab("brewing")}
          >
            {copy.brewingTab[language]}
          </TabButton>
          <TabButton
            active={tab === "photos"}
            onClick={() => setTab("photos")}
          >
            {copy.photosTab[language]}
          </TabButton>
          <TabButton
            active={tab === "reviews"}
            onClick={() => setTab("reviews")}
          >
            {copy.reviewsTab[language]}
          </TabButton>
        </div>

        {tab === "brewing" ? (
          brewing ? (
            <BrewingPanel passport={passport} language={language} />
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              {copy.brewingEmpty[language]}
            </p>
          )
        ) : null}

        {tab === "photos" ? (
          photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {photos.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className="overflow-hidden rounded-xl bg-paper-deep"
                  onClick={() => setPhotoIndex(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              {copy.photosEmpty[language]}
            </p>
          )
        ) : null}

        {tab === "reviews" ? (
          <div className="mt-4 text-sm leading-6">
            {social?.reviewSnippet ? (
              <p className="italic text-ink-soft">“{social.reviewSnippet}”</p>
            ) : (
              <p className="text-ink-soft">{copy.reviewsEmpty[language]}</p>
            )}
          </div>
        ) : null}
      </div>

      <div
        className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-foam px-5 py-3"
        dir="ltr"
      >
        <DirectoryUpvote
          shopId={shop.id}
          language={language}
          variant="passport"
        />
        <ShareListingButton
          shop={shop}
          language={language}
          source="card"
          variant="passport"
        />
        <MapsLink
          href={shopMapsHref(shop)}
          shopId={shop.id}
          locale={language}
          source="card"
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-gold px-3 py-2 text-sm text-gold hover:bg-passport-wash"
        >
          <TargetIcon />
          <span>{copy.takeMeThere[language]}</span>
        </MapsLink>
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
    <div className="mt-4">
      <div className="rounded-2xl bg-passport-wash px-4 py-4">
        <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
          {copy.nowPouring[language]}
        </p>
        {passport.brewingTitle ? (
          <p className="mt-2 font-serif text-xl leading-7 font-semibold">
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
          <p className="mt-3 font-serif text-sm leading-6 italic">
            {passport.brewingNote}
          </p>
        ) : null}
      </div>
      {passport.brewingExtra.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {passport.brewingExtra.map((item) => (
            <li
              key={`${item.title}-${item.detail}`}
              className="flex items-baseline justify-between gap-3 border-t border-line/70 pt-2"
            >
              <span className="font-serif font-medium">{item.title}</span>
              <span className="text-ink-soft">{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GoogleRating({
  social,
  language,
}: {
  social: PassportSocial;
  language: Language;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(social.rating)));
  return (
    <div className="shrink-0 text-end">
      <p className="text-[13px] leading-none text-gold" aria-hidden>
        {"★".repeat(filled)}
        {"☆".repeat(5 - filled)}
      </p>
      <p className="mt-1 text-[11px] text-ink-soft" dir="ltr">
        {social.rating.toFixed(1)} · {social.reviewCount} {copy.googleOn[language]}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "border-b-2 border-gold bg-passport-wash/70 py-2.5 font-medium text-ink"
          : "border-b-2 border-transparent py-2.5 text-ink-soft"
      }
    >
      {children}
    </button>
  );
}

function heroPhotos(shop: Shop, passport: PassportOwnerFields): string[] {
  if (passport.photos.length > 0) return passport.photos;
  if (shop.photoUrl) return [shop.photoUrl];
  if (shop.logoUrl) return [shop.logoUrl];
  return [];
}

function passportVibeTags(shop: Shop, language: Language): string[] {
  const skip = new Set(["قهوة", "Coffee"]);
  const labels = vibeLabels(shop, language).filter((label) => !skip.has(label));
  if (shop.momentTags.includes("quiet")) {
    labels.push(copy.quietWood[language]);
  }
  const seen = new Set<string>();
  const next: string[] = [];
  for (const label of labels) {
    if (!label || seen.has(label)) continue;
    seen.add(label);
    next.push(label);
  }
  return next.slice(0, 2);
}
