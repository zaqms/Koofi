import { getShop } from "@/lib/catalog";
import { fetchPlacePhotoUrl } from "@/lib/places-photo";

export const runtime = "nodejs";

type PhotoContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: PhotoContext) {
  const { id } = await context.params;
  const shop = getShop(id);
  if (!shop) {
    return new Response(null, { status: 204 });
  }

  const src = await fetchPlacePhotoUrl(shop);
  if (!src) {
    return new Response(null, { status: 204 });
  }

  if (shop.photoUrl && src === shop.photoUrl) {
    return Response.redirect(src, 302);
  }

  try {
    const image = await fetch(src, { signal: AbortSignal.timeout(8000) });
    if (!image.ok || !image.body) {
      return new Response(null, { status: 204 });
    }
    return new Response(image.body, {
      headers: {
        "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
