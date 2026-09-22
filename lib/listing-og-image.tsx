import { ImageResponse } from "next/og";
import { LISTING_OG_SIZE, type ListingOgCopy } from "./listing-og";
import { PRODUCT_NAME } from "./product";

const ARABIC_FONT =
  "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-700-normal.ttf";

async function loadArabicFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(ARABIC_FONT, { cache: "force-cache" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

function titleSize(title: string): number {
  const length = title.trim().length;
  if (length <= 12) return 84;
  if (length <= 22) return 64;
  if (length <= 36) return 52;
  return 44;
}

export async function listingOpenGraphImage(copy: ListingOgCopy) {
  const font = await loadArabicFont();
  const rtl = copy.language === "ar";
  const align = rtl ? "flex-end" : "flex-start";
  const title = copy.title;
  const subtitle = copy.subtitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbf8f2",
          color: "#1e1714",
          padding: "72px 80px",
          fontFamily: font ? "PlexArabic" : "sans-serif",
          direction: rtl ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 8,
            borderRadius: 999,
            background: "#7f3526",
            alignSelf: align,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: align,
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: titleSize(copy.title),
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              color: "#6b5c52",
              maxWidth: 980,
            }}
          >
            {subtitle}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: align,
            fontSize: 28,
            color: "#7f3526",
            letterSpacing: 0.2,
          }}
        >
          {PRODUCT_NAME}
        </div>
      </div>
    ),
    {
      ...LISTING_OG_SIZE,
      fonts: font
        ? [{ name: "PlexArabic", data: font, weight: 700, style: "normal" }]
        : [],
      headers: {
        "cache-control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
