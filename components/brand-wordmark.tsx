"use client";

import { useState } from "react";
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

/**
 * Locked heavier black `wain.lol` PNG. Explicit pixel height so the mark
 * cannot collapse on mobile. Text `wain.lol` stays visible until the PNG
 * reports a real painted size — empty nav is not allowed.
 */
export function BrandWordmark({ size = "nav" }: BrandWordmarkProps) {
  const height = size === "nav" ? NAV_HEIGHT_PX : FOOTER_HEIGHT_PX;
  const width = Math.round(
    (LATIN_WORDMARK.width / LATIN_WORDMARK.height) * height,
  );
  const [imgOk, setImgOk] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallbackClass =
    size === "nav"
      ? "text-[1.5rem] font-semibold leading-none text-ink"
      : "text-xs font-semibold leading-none text-ink";

  return (
    <span
      className="relative inline-flex shrink-0 items-center text-ink"
      dir="ltr"
      style={{ height, minHeight: height }}
    >
      <span className={imgOk ? "sr-only" : fallbackClass} dir="ltr">
        {PRODUCT_NAME}
      </span>
      {failed ? null : (
        // Local static PNG. next/image paints alt as transparent, so a 404
        // or a collapsed box leaves an empty nav. Native img + text fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LATIN_WORDMARK.src}
          alt={imgOk ? PRODUCT_NAME : ""}
          width={width}
          height={height}
          className={
            imgOk
              ? "block object-contain object-left"
              : "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 object-contain object-left"
          }
          style={{
            height,
            width: "auto",
            maxWidth: width,
            minHeight: height,
            objectFit: "contain",
            objectPosition: "left center",
          }}
          onLoad={(event) => {
            const el = event.currentTarget;
            if (
              el.naturalWidth > 8 &&
              el.naturalHeight > 8 &&
              el.getBoundingClientRect().height >= height - 1
            ) {
              setImgOk(true);
            }
          }}
          onError={() => {
            setFailed(true);
            setImgOk(false);
          }}
        />
      )}
    </span>
  );
}
