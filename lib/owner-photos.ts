import { BlobAccessError, put } from "@vercel/blob";
import { ENV_KEYS, readEnv } from "./env";
import { ownerPhotoPublicHref } from "./owner-photo-urls";

export {
  OWNER_PHOTO_PUBLIC_PREFIX,
  ownerPhotoDisplaySrc,
  ownerPhotoPublicHref,
  ownerPhotoProxyPathname,
} from "./owner-photo-urls";

/** Same cap as sanitizeOwnerPassport photos[]. */
export const OWNER_PHOTO_MAX = 12;
export const OWNER_PHOTO_MAX_FILES = 8;
export const OWNER_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const OWNER_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

const OWNER_PHOTO_TYPE_SET = new Set<string>(OWNER_PHOTO_TYPES);

export type OwnerPhotoError =
  | "no_blob"
  | "bad_photo"
  | "photos_full"
  | "blob_access"
  | "blob_error";

export function blobWriteConfigured(): boolean {
  return Boolean(readEnv(ENV_KEYS.BLOB_READ_WRITE_TOKEN));
}

export function checkOwnerPhotoFile(file: {
  type: string;
  size: number;
  name: string;
}): { ok: true } | { ok: false; error: "bad_photo" } {
  if (file.size <= 0 || file.size > OWNER_PHOTO_MAX_BYTES) {
    return { ok: false, error: "bad_photo" };
  }
  const type = (file.type || "").toLowerCase();
  if (OWNER_PHOTO_TYPE_SET.has(type)) return { ok: true };
  if (!type && /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
    return { ok: true };
  }
  return { ok: false, error: "bad_photo" };
}

function isUploadedFile(value: unknown): value is File {
  if (!value || typeof value !== "object") return false;
  const file = value as File;
  return (
    typeof file.arrayBuffer === "function" &&
    typeof file.size === "number" &&
    file.size > 0 &&
    typeof file.name === "string"
  );
}

/** Blob pathname. Shop id comes from a validated token — never the raw filename. */
export function ownerPhotoPathname(
  shopId: string,
  filename: string,
  stamp = "photo",
): string {
  const safeShop = shopId.replace(/[^a-z0-9-]/gi, "").slice(0, 80) || "shop";
  const base = filename.split(/[/\\]/).pop() ?? "photo";
  const trimmed = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  const safe = trimmed.slice(0, 80).replace(/^[.-]+|[.-]+$/g, "") || "photo";
  const named = /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(safe)
    ? safe
    : `${safe}.jpg`;
  const prefix = stamp.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "photo";
  return `owner/${safeShop}/${prefix}-${named}`;
}

export function isPrivateStoreAccessError(error: unknown): boolean {
  if (error instanceof BlobAccessError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /cannot use public access on a private store/i.test(message);
}

function classifyBlobError(error: unknown): OwnerPhotoError {
  if (isPrivateStoreAccessError(error)) return "blob_access";
  const message = error instanceof Error ? error.message : String(error);
  if (/too large|content type|not allowed/i.test(message)) return "bad_photo";
  return "blob_error";
}

async function putOwnerPhotoFile(
  pathname: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "image/jpeg";
  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return blob.url;
  } catch (error) {
    if (!isPrivateStoreAccessError(error)) throw error;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType,
    });
    return ownerPhotoPublicHref(blob.pathname);
  }
}

/**
 * Collect every file in the form. Do not use form.get("files") — that is
 * last-wins for the same field name. Duck-type File (instanceof fails across
 * some Next/undici realms).
 */
export function collectOwnerPhotoFiles(form: FormData): File[] {
  const files: File[] = [];
  const seen = new Set<unknown>();
  const values = [...form.getAll("files"), ...form.values()];
  for (const value of values) {
    if (seen.has(value) || !isUploadedFile(value)) continue;
    seen.add(value);
    files.push(value);
  }
  return files;
}

export async function putOwnerPhotos(
  shopId: string,
  files: File[],
): Promise<
  { ok: true; urls: string[] } | { ok: false; error: OwnerPhotoError }
> {
  if (!blobWriteConfigured()) return { ok: false, error: "no_blob" };
  if (files.length === 0) return { ok: false, error: "bad_photo" };

  const urls: string[] = [];
  const now = Date.now();
  let lastError: OwnerPhotoError = "bad_photo";
  for (const [index, file] of files.slice(0, OWNER_PHOTO_MAX_FILES).entries()) {
    const check = checkOwnerPhotoFile(file);
    if (!check.ok) {
      lastError = "bad_photo";
      continue;
    }
    try {
      urls.push(
        await putOwnerPhotoFile(
          ownerPhotoPathname(shopId, file.name, `${now}-${index}`),
          file,
        ),
      );
    } catch (error) {
      lastError = classifyBlobError(error);
    }
  }
  if (urls.length === 0) return { ok: false, error: lastError };
  return { ok: true, urls };
}
