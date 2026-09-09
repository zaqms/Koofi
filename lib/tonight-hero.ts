import { readFile } from "node:fs/promises";
import path from "node:path";
import { get } from "@vercel/blob";
import { blobWriteConfigured } from "./owner-photos";
import {
  OWNER_PHOTO_PUBLIC_PREFIX,
  ownerPhotoProxyPathname,
} from "./owner-photo-urls";
import { safeTonightPhotoPath } from "./tonight";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

/**
 * ImageResponse / Satori fetch the <img> src themselves. On a protected
 * Preview that HTTP GET is SSO-blocked, so the hero vanishes and the PNG
 * is cream + gradient only. Embed bytes (data URI) instead of a URL.
 */
export async function loadTonightHeroDataUri(
  src: string | null | undefined,
): Promise<string | null> {
  const safe = safeTonightPhotoPath(src);
  if (!safe) return null;

  if (safe.startsWith("/passport/") || safe.startsWith("/logos/")) {
    return readPublicHero(safe);
  }
  if (safe.startsWith(OWNER_PHOTO_PUBLIC_PREFIX)) {
    return readOwnerHero(safe);
  }
  return null;
}

async function readPublicHero(safe: string): Promise<string | null> {
  const abs = path.resolve(PUBLIC_ROOT, safe.slice(1));
  if (!abs.startsWith(`${PUBLIC_ROOT}${path.sep}`)) return null;
  try {
    const buf = await readFile(abs);
    return toDataUri(safe, buf);
  } catch {
    return null;
  }
}

async function readOwnerHero(safe: string): Promise<string | null> {
  if (!blobWriteConfigured()) return null;
  const rest = safe.slice(OWNER_PHOTO_PUBLIC_PREFIX.length);
  const pathname = ownerPhotoProxyPathname(rest.split("/").filter(Boolean));
  if (!pathname) return null;
  try {
    const blob = await readOwnerBlob(pathname);
    if (!blob?.stream) return null;
    const buf = Buffer.from(await new Response(blob.stream).arrayBuffer());
    return toDataUri(safe, buf, blob.blob.contentType);
  } catch {
    return null;
  }
}

async function readOwnerBlob(pathname: string) {
  try {
    return await get(pathname, { access: "private" });
  } catch {
    try {
      return await get(pathname, { access: "public" });
    } catch {
      return null;
    }
  }
}

function toDataUri(
  name: string,
  buf: Buffer,
  contentType?: string | null,
): string {
  const mime =
    contentType && contentType.startsWith("image/")
      ? contentType
      : name.endsWith(".png")
        ? "image/png"
        : name.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
