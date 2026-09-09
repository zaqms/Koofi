import { ImageResponse } from "next/og";
import { getShop } from "@/lib/catalog";
import { loadTonightHeroDataUri } from "@/lib/tonight-hero";
import {
  sanitizeTonightCardLine,
  safeTonightPhotoPath,
  satoriArabicLine,
  tonightDistrict,
  tonightHeroForShop,
  TONIGHT_IMAGE_SIZE,
  TONIGHT_WATERMARK,
  TONIGHT_WATERMARK_PX,
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
  const line = sanitizeTonightCardLine(url.searchParams.get("line"));
  const requested = safeTonightPhotoPath(url.searchParams.get("photo"));
  const fallback = tonightHeroForShop(shop);
  const hero =
    (await loadTonightHeroDataUri(requested)) ??
    (await loadTonightHeroDataUri(fallback));
  const district = tonightDistrict(shop, language);
  const eyebrow = language === "ar" ? "الليلة" : "tonight";
  const align = language === "ar" ? "flex-end" : "flex-start";

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
          position: "relative",
          background: "#f3ead8",
          color: "#fffaf3",
          fontFamily: arabic ? "PlexArabic" : "sans-serif",
        }}
      >
        {hero ? (
          // Full-bleed cafe hero / logo. Never a black empty half.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt=""
            width={TONIGHT_IMAGE_SIZE.width}
            height={TONIGHT_IMAGE_SIZE.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: TONIGHT_IMAGE_SIZE.width,
              height: TONIGHT_IMAGE_SIZE.height,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: TONIGHT_IMAGE_SIZE.width,
              height: TONIGHT_IMAGE_SIZE.height,
              alignItems: "center",
              justifyContent: "center",
              background: "#f3ead8",
              color: "#8d6b38",
              fontSize: 80,
              letterSpacing: 8,
              fontFamily: serif ? "PassportSerif" : "serif",
            }}
          >
            {TONIGHT_WATERMARK}
          </div>
        )}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            background:
              "linear-gradient(to bottom, rgba(27,24,20,0.55) 0%, rgba(27,24,20,0) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "72px 56px 56px",
            background:
              "linear-gradient(to top, rgba(27,24,20,0.92) 0%, rgba(27,24,20,0.62) 58%, rgba(27,24,20,0) 100%)",
            alignItems: align,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#e4c37a",
              fontSize: 30,
              letterSpacing: language === "ar" ? 0 : 6,
              textTransform: "uppercase",
            }}
          >
            {language === "ar" ? satoriArabicLine(eyebrow) : eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontFamily: serif ? "PassportSerif" : "serif",
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.12,
              color: "#fffaf3",
            }}
          >
            {shop.nameEn}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 38,
              lineHeight: 1.3,
              color: "#f3ead8",
            }}
          >
            {satoriArabicLine(shop.nameAr)}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              border: "1.5px solid #e4c37a",
              borderRadius: 999,
              padding: "10px 22px",
              color: "#e4c37a",
              fontSize: 26,
              background: "rgba(27,24,20,0.35)",
            }}
          >
            {language === "ar" ? satoriArabicLine(district) : district}
          </div>
          {line ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 34,
                lineHeight: 1.4,
                color: "#fffaf3",
              }}
            >
              {/[\u0600-\u06FF]/.test(line) ? satoriArabicLine(line) : line}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: 36,
              color: "#e4c37a",
              fontSize: TONIGHT_WATERMARK_PX,
              letterSpacing: 3,
              fontFamily: serif ? "PassportSerif" : "serif",
            }}
          >
            {TONIGHT_WATERMARK}
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
