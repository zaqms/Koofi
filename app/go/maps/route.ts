import { getShop } from "@/lib/catalog";
import { mapsHref, shopMapsHref } from "@/lib/public-url";

export const runtime = "nodejs";

const NOINDEX = {
  "X-Robots-Tag": "noindex",
} as const;

function notFound(): Response {
  return new Response(null, { status: 404, headers: NOINDEX });
}

function toMaps(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      ...NOINDEX,
      Location: url,
    },
  });
}

/**
 * Email-only Maps hop. Gmail hrefs stay on wain.lol; this 302s onto
 * the catalog shortlink / place URL or a pin lat,lng. Not linked from UI.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shop")?.trim();
  if (shopId) {
    const shop = getShop(shopId);
    if (!shop) return notFound();
    return toMaps(shopMapsHref(shop));
  }

  const latRaw = url.searchParams.get("lat")?.trim();
  const lngRaw = url.searchParams.get("lng")?.trim();
  if (latRaw && lngRaw) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return toMaps(mapsHref(lat, lng));
    }
  }

  return notFound();
}
