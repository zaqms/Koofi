"use client";

import { useState } from "react";
import { shopMarkLetters } from "@/lib/shop-mark";

type ShopVisualProps = {
  nameAr: string;
  nameEn: string;
  photoUrl?: string;
  logoUrl?: string;
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
]);

export function ShopVisual({
  nameAr,
  nameEn,
  photoUrl,
  logoUrl,
}: ShopVisualProps) {
  const mark = shopMarkLetters(nameEn, nameAr);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const showPhoto = !showLogo && Boolean(photoUrl) && !photoFailed;
  const tileClass = showLogo
    ? DARK_LOGO_PATHS.has(logoUrl ?? "")
      ? "bg-ink"
      : "bg-foam"
    : "bg-paper-deep text-bean";

  return (
    <div
      className={`relative size-11 shrink-0 overflow-hidden rounded-xl ${tileClass}`}
    >
      {showLogo ? (
        // Catalog logoUrl only. next/image needs a known host; local /logos files stay on <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={44}
          height={44}
          className="size-full object-contain p-px"
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
