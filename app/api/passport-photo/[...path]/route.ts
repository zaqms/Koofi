import { get } from "@vercel/blob";
import { blobWriteConfigured } from "@/lib/owner-photos";
import { ownerPhotoProxyPathname } from "@/lib/owner-photo-urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_FOUND = { "Cache-Control": "no-store" } as const;

/**
 * Public Passport hero images. The Blob store may be private; visitors load
 * this same-origin URL in <img> with no signed cookies.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const pathname = ownerPhotoProxyPathname(path);
  if (!pathname) {
    return new Response("not found", { status: 404, headers: NOT_FOUND });
  }
  if (!blobWriteConfigured()) {
    return new Response("not found", { status: 503, headers: NOT_FOUND });
  }

  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;
  const blob = await readOwnerBlob(pathname, ifNoneMatch);
  if (!blob) {
    return new Response("not found", { status: 404, headers: NOT_FOUND });
  }
  if (blob.statusCode === 304 || !blob.stream) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: blob.blob.etag,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      ETag: blob.blob.etag,
    },
  });
}

async function readOwnerBlob(pathname: string, ifNoneMatch?: string) {
  try {
    return await get(pathname, { access: "private", ifNoneMatch });
  } catch {
    try {
      return await get(pathname, { access: "public", ifNoneMatch });
    } catch {
      return null;
    }
  }
}
