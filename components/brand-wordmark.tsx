"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/product";

/** Cropped locked Latin mark. Intrinsic size after whitespace trim. */
export const LATIN_WORDMARK = {
  src: "/brand/wain-lol-wordmark.png",
  width: 1058,
  height: 234,
} as const;

/** Nav must stay readable on a phone. Do not size this PNG with `1em`. */
const NAV_HEIGHT_PX = 24;
const FOOTER_HEIGHT_PX = 14;

type BrandWordmarkProps = {
  size?: "nav" | "footer";
};

function markLooksPainted(el: HTMLImageElement): boolean {
  return el.naturalWidth > 8 && el.naturalHeight > 8;
}

/**
 * Locked heavier black `wain.lol` PNG. Explicit pixel height so the mark
 * cannot collapse on mobile. Visible text `wain.lol` until the PNG is
 * confirmed painted — never an empty nav, never both stacked.
 */
export function BrandWordmark({ size = "nav" }: BrandWordmarkProps) {
  const height = size === "nav" ? NAV_HEIGHT_PX : FOOTER_HEIGHT_PX;
  const width = Math.round(
    (LATIN_WORDMARK.width / LATIN_WORDMARK.height) * height,
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgOk, setImgOk] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallbackClass =
    size === "nav"
      ? "text-[1.5rem] font-semibold leading-none text-ink"
      : "text-xs font-semibold leading-none text-ink";

  function acceptIfPainted(el: HTMLImageElement | null) {
    if (!el || failed) return;
    if (markLooksPainted(el)) {
      setImgOk(true);
    }
  }

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete) acceptIfPainted(el);
  });

  return (
    <span
      className="relative inline-flex shrink-0 items-center overflow-visible text-ink"
      dir="ltr"
      style={{ height, minHeight: height }}
    >
      <span
        className={imgOk ? "sr-only" : fallbackClass}
        dir="ltr"
        aria-hidden={imgOk}
      >
        {PRODUCT_NAME}
      </span>
      {failed ? null : (
        // Local static PNG. next/image paints alt as transparent, so a 404
        // or a collapsed box leaves an empty nav. Native img + text fallback.
        // Cached images can skip onLoad — also check img.complete.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={LATIN_WORDMARK.src}
          alt={imgOk ? PRODUCT_NAME : ""}
          width={width}
          height={height}
          className="block object-contain object-left"
          style={{
            height,
            width: "auto",
            maxWidth: width,
            minHeight: height,
            objectFit: "contain",
            objectPosition: "left center",
            opacity: imgOk ? 1 : 0,
            position: imgOk ? "static" : "absolute",
            left: 0,
            top: 0,
          }}
          onLoad={(event) => acceptIfPainted(event.currentTarget)}
          onError={() => {
            setFailed(true);
            setImgOk(false);
          }}
        />
      )}
    </span>
  );
}
