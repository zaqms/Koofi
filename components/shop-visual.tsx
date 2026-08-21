"use client";

import { useState } from "react";
import { shopMarkLetters } from "@/lib/shop-mark";

type ShopVisualProps = {
  nameAr: string;
  nameEn: string;
  photoUrl?: string;
  logoUrl?: string;
};

export function ShopVisual({
  nameAr,
  nameEn,
  photoUrl,
  logoUrl,
}: ShopVisualProps) {
  const mark = shopMarkLetters(nameEn, nameAr);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-paper-deep text-bean">
      {showPhoto ? (
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
      {logoUrl && !logoFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={14}
          height={14}
          className="absolute bottom-0.5 right-0.5 size-3.5 rounded-sm bg-foam object-cover"
          onError={() => setLogoFailed(true)}
        />
      ) : null}
    </div>
  );
}
