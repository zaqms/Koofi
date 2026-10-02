import { readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

/**
 * Satori (next/og ImageResponse) can only decode PNG, APNG, JPEG and GIF
 * rasters. For a `data:` URI it trusts the declared mime: an unsupported type
 * (image/webp, ico, avif...) throws "u2 is not iterable" inside Satori and the
 * route 500s, and a wrong mime (JPEG bytes declared image/png) renders an
 * empty tile. So the mime always comes from the bytes, never the extension,
 * and anything Satori can't draw is dropped (the card renders without it).
 */
export type OgImageMime = "image/png" | "image/jpeg" | "image/gif";

export function sniffOgImageMime(buf: Uint8Array): OgImageMime | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) return "image/png";
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
  ) {
    return "image/gif";
  }
  return null;
}

/** Bytes → Satori-safe data URI, or null if Satori can't decode them. */
export function ogDataUriFromBytes(buf: Buffer): string | null {
  const mime = sniffOgImageMime(buf);
  return mime ? `data:${mime};base64,${buf.toString("base64")}` : null;
}

const PUBLIC_ROOT = resolve(process.cwd(), "public");

/** A /public path (e.g. "/logos/x.png") → Satori-safe data URI, or null. */
export function publicOgImageDataUri(path: string | null | undefined): string | null {
  const p = path?.trim();
  if (!p || !p.startsWith("/") || p.startsWith("//")) return null;
  const abs = resolve(join(PUBLIC_ROOT, p));
  if (!abs.startsWith(`${PUBLIC_ROOT}${sep}`)) return null;
  try {
    return ogDataUriFromBytes(readFileSync(abs));
  } catch {
    return null;
  }
}
