"use client";

import { useState } from "react";
import { shopMarkLetters } from "@/lib/shop-mark";

type ShopVisualProps = {
  nameAr: string;
  nameEn: string;
  photoUrl?: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg" | "listing";
};

const DARK_LOGO_PATHS = new Set([
  "/logos/tobys-estate-hittin.png",
  "/logos/qamaria-hittin.webp",
  "/logos/first-series-olaya.png",
  "/logos/just-another-hittin.jpg",
  "/logos/repository-coffee-roasters-al-narjis.jpg",
  "/logos/core-coffee-and-roastery-al-narjis.jpg",
  "/logos/volume-coffee-roasters-al-narjis.jpg",
  "/logos/melex-specialty-coffee-al-narjis.jpg",
  "/logos/nosound-al-narjis.jpg",
  "/logos/caf-lab-al-narjis.jpg",
  "/logos/eva-al-yasmin.jpg",
  "/logos/woods-olaya.jpg",
  "/logos/qaf-olaya.jpg",
  "/logos/brew-crew-sulimaniyah.jpg",
  "/logos/coyard-sulimaniyah.jpg",
  "/logos/urth-caffe-tahlia-sulimaniyah.jpg",
  "/logos/coffee-planet-kafd.jpg",
  "/logos/hakwah-speciality-coffee-as-sahafah.jpg",
  "/logos/trieste-kafd.jpg",
  "/logos/dips-plus-diriyah.jpg",
  "/logos/malfa-coffee-house-diriyah.jpg",
  "/logos/blumen-al-safa.jpg",
  "/logos/november-coffee-an-nazhah.png",
  "/logos/elite-cup-roasters-an-nazhah.png",
  "/logos/ghandoura-an-nazhah.png",
  "/logos/wathba-an-nazhah.jpg",
  "/logos/kraz-an-nazhah.jpg",
  "/logos/cross-coffee-an-nazhah.jpg",
  "/logos/rimthan-coffee-mark.png",
  "/logos/jather.jpg",
  "/logos/harf-coffee.jpg",
  "/logos/zeila.jpg",
  "/logos/silo-cafe-al-yarmouk.png",
  "/logos/nosound-al-yarmouk.png",
  "/logos/aleel-roastery-al-yarmouk.png",
  "/logos/bourbon-al-yarmouk.png",
  "/logos/ratio-speciality-al-yarmouk.png",
  "/logos/coffee-zam-al-yarmouk.png",
  "/logos/kuro-sulimaniyah.png",
  "/logos/the-matcha-bar-olaya.jpg",
  "/logos/remis-matcha-club-hittin.png",
]);

export function ShopVisual({
  nameAr,
  nameEn,
  photoUrl,
  logoUrl,
  size = "sm",
}: ShopVisualProps) {
  const mark = shopMarkLetters(nameEn, nameAr);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const showPhoto = !showLogo && Boolean(photoUrl) && !photoFailed;
  const listing = size === "listing";
  const tileClass = showLogo
    ? DARK_LOGO_PATHS.has(logoUrl ?? "")
      ? "bg-ink"
      : listing
        ? "bg-wain-warm-cream"
        : "bg-foam"
    : listing
      ? "bg-wain-warm-cream text-bean"
      : "bg-paper-deep text-bean";
  const sizeClass =
    listing
      ? "size-20"
      : size === "lg"
        ? "size-14"
        : size === "md"
          ? "size-12"
          : "size-11";
  const radiusClass = listing ? "rounded-[16px]" : "rounded-xl";

  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden ${radiusClass} ${tileClass}`}
    >
      {showLogo ? (
        // Catalog logoUrl only. next/image needs a known host; local /logos files stay on <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={listing ? 80 : 44}
          height={listing ? 80 : 44}
          className={
            listing
              ? "size-full object-contain p-1.5"
              : "size-full object-contain p-px"
          }
          onError={() => setLogoFailed(true)}
        />
      ) : showPhoto ? (
        // Catalog photoUrl only. next/image needs a known host; we do not allow scraped Maps CDNs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          width={44}
          height={44}
          className="size-full object-cover"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-semibold tracking-wide">
          {mark}
        </span>
      )}
    </div>
  );
}
