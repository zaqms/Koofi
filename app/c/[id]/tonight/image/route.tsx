import { ImageResponse } from "next/og";
import { getShop } from "@/lib/catalog";
import { PRODUCT_NAME } from "@/lib/product";
import {
  sanitizeTonightLine,
  safeTonightPhotoPath,
  satoriArabicLine,
  tonightDistrict,
  tonightHeroForShop,
  TONIGHT_IMAGE_SIZE,
} from "@/lib/tonight";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImageContext = { params: Promise<{ id: string }> };

function localeFrom(value: string | null): Language {
  return value === "en" ? "en" : "ar";
}

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: ImageContext) {
  const { id } = await context.params;
  const shop = getShop(id);
  if (!shop) {
    return new Response("not found", { status: 404 });
  }

  const url = new URL(request.url);
  const language = localeFrom(url.searchParams.get("locale"));
  const line = sanitizeTonightLine(url.searchParams.get("line"));
  const photo =
    safeTonightPhotoPath(url.searchParams.get("photo")) ??
    tonightHeroForShop(shop);
  const hero = photo ? new URL(photo, url.origin).toString() : null;
  const district = tonightDistrict(shop, language);
  const eyebrow = language === "ar" ? "الليلة" : "tonight";

  const [arabic, arabicBold, serif] = await Promise.all([
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-400-normal.ttf",
    ),
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-700-normal.ttf",
    ),
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/source-serif-4@latest/latin-700-normal.ttf",
    ),
  ]);

  const fonts = [
    arabic
      ? { name: "PlexArabic", data: arabic, weight: 400 as const, style: "normal" as const }
      : null,
    arabicBold
      ? { name: "PlexArabic", data: arabicBold, weight: 700 as const, style: "normal" as const }
      : null,
    serif
      ? { name: "PassportSerif", data: serif, weight: 700 as const, style: "normal" as const }
      : null,
  ].filter((font): font is NonNullable<typeof font> => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: TONIGHT_IMAGE_SIZE.width,
          height: TONIGHT_IMAGE_SIZE.height,
          display: "flex",
          flexDirection: "column",
          background: "#1b1814",
          color: "#fffaf3",
          fontFamily: arabic ? "PlexArabic" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: TONIGHT_IMAGE_SIZE.width,
            height: 980,
            background: "#1b1814",
            overflow: "hidden",
          }}
        >
          {hero ? (
            // Cafe hero / logo only. Same-origin paths.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt=""
              width={TONIGHT_IMAGE_SIZE.width}
              height={980}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "#b0894a",
                fontSize: 72,
                letterSpacing: 8,
              }}
            >
              {PRODUCT_NAME}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 64px 52px",
            background: "#1b1814",
            alignItems: language === "ar" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#b0894a",
              fontSize: 28,
              letterSpacing: language === "ar" ? 0 : 6,
              textTransform: "uppercase",
            }}
          >
            {language === "ar" ? satoriArabicLine(eyebrow) : eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontFamily: serif ? "PassportSerif" : "serif",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {shop.nameEn}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 40,
              lineHeight: 1.35,
              color: "#f3ead8",
            }}
          >
            {satoriArabicLine(shop.nameAr)}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              border: "1px solid #b0894a",
              borderRadius: 999,
              padding: "10px 22px",
              color: "#b0894a",
              fontSize: 26,
            }}
          >
            {language === "ar" ? satoriArabicLine(district) : district}
          </div>
          {line ? (
            <div
              style={{
                display: "flex",
                marginTop: 36,
                fontSize: 34,
                lineHeight: 1.45,
                color: "#fffaf3",
              }}
            >
              {/[\u0600-\u06FF]/.test(line) ? satoriArabicLine(line) : line}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              color: "#b0894a",
              fontSize: 28,
              letterSpacing: 2,
            }}
          >
            {PRODUCT_NAME}
          </div>
        </div>
      </div>
    ),
    {
      ...TONIGHT_IMAGE_SIZE,
      fonts,
      headers: {
        "Cache-Control": line
          ? "private, no-store"
          : "public, max-age=300, s-maxage=300",
      },
    },
  );
}
