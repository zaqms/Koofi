import { ImageResponse } from "next/og";
import { resolvePack } from "@/lib/pack";
import { PRODUCT_NAME, shopDisplayName } from "@/lib/product";

export const alt = PRODUCT_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ImageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function PackImage({ params }: ImageProps) {
  const { id } = await params;
  const pack = resolvePack(id);
  const font = await loadArabicFont();

  const names = pack
    ? pack.shops.map((shop, index) => ({
        name: shopDisplayName(shop, pack.locale),
        why: pack.whys[index] ?? "",
      }))
    : [];
  const area = pack?.neighborhoodLabel ?? "";

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
            flexDirection: "column",
            gap: 22,
            direction: pack?.locale === "en" ? "ltr" : "rtl",
          }}
        >
          {names.map((row) => (
            <div
              key={row.name}
              style={{ display: "flex", fontSize: 42, lineHeight: 1.25 }}
            >
              {row.name} — {row.why}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            color: "#5c4e45",
            direction: pack?.locale === "en" ? "ltr" : "rtl",
          }}
        >
          {area}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            color: "#5c4e45",
            letterSpacing: 0.2,
          }}
        >
          {PRODUCT_NAME}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "PlexArabic", data: font, weight: 400, style: "normal" }]
        : [],
    },
  );
}
