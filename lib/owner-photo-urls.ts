/** Same-origin public URL so Passport <img> works without signed cookies. */
export const OWNER_PHOTO_PUBLIC_PREFIX = "/api/passport-photo/";

export function ownerPhotoPublicHref(pathname: string): string {
  const parts = pathname
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part));
  return `${OWNER_PHOTO_PUBLIC_PREFIX}${parts.join("/")}`;
}

export function ownerPhotoProxyPathname(parts: string[]): string | null {
  if (parts.length < 3 || parts.length > 8) return null;
  const decoded: string[] = [];
  for (const part of parts) {
    let value = part;
    try {
      value = decodeURIComponent(part);
    } catch {
      return null;
    }
    if (!value || value.includes("..") || value.includes("/") || value.includes("\\")) {
      return null;
    }
    decoded.push(value);
  }
  if (decoded[0] !== "owner") return null;
  return decoded.join("/");
}

function isVercelBlobHost(host: string): boolean {
  return (
    host === "blob.vercel-storage.com" ||
    host.endsWith(".blob.vercel-storage.com") ||
    host.endsWith(".public.blob.vercel-storage.com")
  );
}

/** Visitor-safe src. Private Blob URLs become the public proxy path. */
export function ownerPhotoDisplaySrc(raw: string): string {
  const value = raw.trim();
  if (!value || value.startsWith("blob:")) return value;
  if (value.startsWith(OWNER_PHOTO_PUBLIC_PREFIX)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (!isVercelBlobHost(url.hostname)) return value;
    const pathname = decodeURIComponent(url.pathname.replace(/^\//, ""));
    if (!pathname.startsWith("owner/")) return value;
    return ownerPhotoPublicHref(pathname);
  } catch {
    return value;
  }
}
