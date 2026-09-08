import { appendVerifiedPassportPhotos } from "@/lib/claims";
import { allowRate, clientIp } from "@/lib/feedback";
import {
  collectOwnerPhotoFiles,
  OWNER_PHOTO_MAX,
  putOwnerPhotos,
} from "@/lib/owner-photos";
import { validateOwnerToken } from "@/lib/owner-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function tokenStatus(error: string): number {
  if (error === "no_storage" || error === "no_blob") return 503;
  if (error === "blob_access" || error === "blob_error") return 503;
  if (error === "not_verified") return 403;
  if (error === "expired" || error === "revoked" || error === "wrong_shop") {
    return 401;
  }
  if (error === "missing" || error === "not_found" || error === "invalid") {
    return 401;
  }
  if (error === "photos_full" || error === "bad_photo") return 400;
  return 400;
}

export async function POST(request: Request) {
  if (!allowRate(`owner-photos:${clientIp(request)}`, 12, 10 * 60 * 1000)) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: NO_STORE },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: "missing" },
      { status: 400, headers: NO_STORE },
    );
  }

  const session = await validateOwnerToken({
    shopId: form.get("shop") ?? form.get("shopId"),
    token: form.get("token"),
  });
  if (!session.ok) {
    return Response.json(
      { ok: false, error: session.error },
      { status: tokenStatus(session.error), headers: NO_STORE },
    );
  }

  const remaining = OWNER_PHOTO_MAX - session.passport.photos.length;
  if (remaining <= 0) {
    return Response.json(
      { ok: false, error: "photos_full" },
      { status: 400, headers: NO_STORE },
    );
  }

  const files = collectOwnerPhotoFiles(form).slice(0, remaining);
  const uploaded = await putOwnerPhotos(session.shopId, files);
  if (!uploaded.ok) {
    return Response.json(
      { ok: false, error: uploaded.error },
      { status: tokenStatus(uploaded.error), headers: NO_STORE },
    );
  }

  const saved = await appendVerifiedPassportPhotos({
    shopId: session.shopId,
    urls: uploaded.urls,
  });
  if (!saved.ok) {
    return Response.json(
      { ok: false, error: saved.error },
      { status: tokenStatus(saved.error), headers: NO_STORE },
    );
  }

  return Response.json(
    {
      ok: true,
      shopId: saved.shopId,
      urls: uploaded.urls,
      passport: saved.passport,
    },
    { headers: NO_STORE },
  );
}
