import { ImageResponse } from "next/og";
import { getShop } from "./catalog";
import { cityLabel, DEFAULT_LIVE_CITY } from "./cities";
import { neighborhoodLabel } from "./neighborhoods";
import { publicOgImageDataUri } from "./og-image-data";
import { OG_RTL_ROW, ogFontMeasurer, ogRtlUnits } from "./og-rtl-text";
import { PRODUCT_NAME, shopDisplayName } from "./product";
import type { Language, Shop } from "./types";

export const CAFE_OG_SIZE = { width: 1200, height: 630 };
export const CAFE_OG_CONTENT_TYPE = "image/png";

type CafeOgProps = {
  params: Promise<{ id: string }>;
};

function shopImageDataUri(shop: Shop): string | null {
  // Logo first, then photo; each must be a format Satori can decode
  // (see lib/og-image-data.ts). A webp/ico logo must not 500 the card.
  return (
    publicOgImageDataUri(shop.logoUrl) ?? publicOgImageDataUri(shop.photoUrl)
  );
}

async function loadArabicFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-400-normal.ttf",
      { cache: "force-cache" },
    );
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function cafeOpenGraphImage(
  { params }: CafeOgProps,
  language: Language,
) {
  const { id } = await params;
  const shop = getShop(id);
  const font = await loadArabicFont();
  const name = shop
    ? shopDisplayName(shop, language)
    : PRODUCT_NAME;
  const area = shop
    ? language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood, "en")
    : cityLabel(DEFAULT_LIVE_CITY, language);
  const image = shop ? shopImageDataUri(shop) : null;
  const dir = language === "en" ? "ltr" : "rtl";
  const measure = dir === "rtl" ? ogFontMeasurer(font) : null;
  // AR rows span the room beside the logo: row-reverse starts them at the
  // right edge, and long names wrap instead of overflowing.
  const rtlWidth = CAFE_OG_SIZE.width - 2 * 80 - (image ? 160 + 36 : 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f3eee4",
          color: "#1c1410",
          padding: "72px 80px",
          fontFamily: font ? "PlexArabic" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: dir === "rtl" ? "row-reverse" : "row",
            alignItems: "center",
            gap: 36,
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              width={160}
              height={160}
              style={{
                width: 160,
                height: 160,
                objectFit: "contain",
                borderRadius: 28,
                background: "#fffaf3",
              }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              direction: dir,
            }}
          >
            {dir === "rtl" ? (
              // Satori has no bidi and mis-sizes joined Arabic: lay the AR
              // words out ourselves (lib/og-rtl-text.tsx). EN is unchanged.
              <div
                style={{
                  ...OG_RTL_ROW,
                  alignSelf: "flex-end",
                  width: rtlWidth,
                  fontSize: 54,
                  lineHeight: 1.2,
                  fontWeight: 600,
                }}
              >
                {ogRtlUnits(name, 54, measure)}
              </div>
            ) : (
              <div style={{ fontSize: 54, lineHeight: 1.2, fontWeight: 600 }}>
                {name}
              </div>
            )}
            {dir === "rtl" ? (
              <div
                style={{
                  ...OG_RTL_ROW,
                  alignSelf: "flex-end",
                  width: rtlWidth,
                  fontSize: 32,
                  color: "#5c4e45",
                }}
              >
                {ogRtlUnits(area, 32, measure)}
              </div>
            ) : (
              <div style={{ fontSize: 32, color: "#5c4e45" }}>{area}</div>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            color: "#5c4e45",
            letterSpacing: 0.2,
          }}
        >
          {PRODUCT_NAME}
        </div>
      </div>
    ),
    {
      ...CAFE_OG_SIZE,
      fonts: font
        ? [{ name: "PlexArabic", data: font, weight: 400, style: "normal" }]
        : [],
    },
  );
}
