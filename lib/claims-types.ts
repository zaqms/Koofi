import { ownerPhotoDisplaySrc } from "./owner-photo-urls";

export const CLAIM_STATUSES = ["none", "pending", "verified"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const PROOF_TYPES = ["cr"] as const;
export type ProofType = (typeof PROOF_TYPES)[number];

export type ClaimError =
  | "not_found"
  | "no_storage"
  | "rate_limited"
  | "bad_phone"
  | "bad_otp"
  | "otp_not_configured"
  | "already_claimed"
  | "bad_proof";

export type OwnerTokenError =
  | "missing"
  | "invalid"
  | "expired"
  | "revoked"
  | "wrong_shop"
  | "not_verified"
  | "no_storage"
  | "not_found";

export type PendingClaim = {
  shopId: string;
  ownerPhoneE164: string;
  proofAssetUrl: string | null;
  createdAt: string;
};

export type VerifiedClaimRow = {
  shopId: string;
  updatedAt: string;
};

export type PassportBrewingExtra = {
  title: string;
  detail: string;
};

/**
 * Passport owner fields on shop_claims.passport.
 * Hours are owner-supplied only — never invent them from catalog or Places.
 */
export type PassportOwnerFields = {
  photos: string[];
  brewingNote: string;
  brewingTitle: string;
  brewingDetail: string;
  brewingNotes: string[];
  brewingExtra: PassportBrewingExtra[];
  hours: string;
  thinOffer: string;
  phone: string;
  instagram: string;
};

export function emptyPassport(): PassportOwnerFields {
  return {
    photos: [],
    brewingNote: "",
    brewingTitle: "",
    brewingDetail: "",
    brewingNotes: [],
    brewingExtra: [],
    hours: "",
    thinOffer: "",
    phone: "",
    instagram: "",
  };
}

export type ShopClaim = {
  shopId: string;
  status: Exclude<ClaimStatus, "none">;
  ownerPhoneE164: string;
  proofType: ProofType;
  proofAssetUrl: string | null;
  passport: PassportOwnerFields;
  otpStub: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Public card — no owner name, never the claim-row phone. */
export type PublicClaimStatus = {
  shopId: string;
  status: ClaimStatus;
  storage: "ready" | "missing";
  passport?: PassportOwnerFields;
  preview?: boolean;
};

export type PublicVerifiedList = {
  verifiedIds: string[];
  storage: "ready" | "missing";
};

export const STUB_OTP_CODE = "000000";

export function parseProofType(raw: unknown): ProofType | undefined {
  if (raw === "cr") return raw;
  return undefined;
}

function parseBrewingExtra(raw: unknown): PassportBrewingExtra[] {
  if (!Array.isArray(raw)) return [];
  const extras: PassportBrewingExtra[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.detail !== "string") continue;
    extras.push({ title: row.title, detail: row.detail });
  }
  return extras;
}

/** Accept an array, a last-wins string URL, or a JSON array string. */
export function parsePhotoList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (raw && typeof raw === "object") {
    const values = Object.values(raw);
    if (
      values.length > 0 &&
      values.every((item): item is string => typeof item === "string")
    ) {
      return values;
    }
    return [];
  }
  if (typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      /* not a JSON array */
    }
  }
  return [trimmed];
}

/**
 * Persist the full owner list. A one-URL save must not collapse a longer
 * Neon array (last-file-wins after upload). Two-or-more URLs replace, so
 * the owner can still remove extras.
 */
export function coalescePassportPhotos(
  existing: string[],
  incoming: string[],
): string[] {
  const saved = mergePassportPhotos(existing, []);
  const next = mergePassportPhotos(incoming, []);
  if (next.length >= 2) return next;
  if (next.length === 0) return next;
  if (saved.length > 1 && saved.includes(next[0])) return saved;
  if (saved.length > 1) return mergePassportPhotos(saved, next);
  return next;
}

export function mergePassportPhotos(
  existing: string[],
  incoming: string[],
  max = 12,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...existing, ...incoming]) {
    const photo = safePassportPhoto(raw);
    if (!photo || seen.has(photo)) continue;
    seen.add(photo);
    out.push(photo);
    if (out.length >= max) break;
  }
  return out;
}

export function parsePassport(raw: unknown): PassportOwnerFields {
  const empty = emptyPassport();
  let value: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        value = parsed as Record<string, unknown>;
      }
    } catch {
      return empty;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    value = raw as Record<string, unknown>;
  }
  if (!value) return empty;
  return {
    photos: parsePhotoList(value.photos),
    brewingNote: typeof value.brewingNote === "string" ? value.brewingNote : "",
    brewingTitle: typeof value.brewingTitle === "string" ? value.brewingTitle : "",
    brewingDetail:
      typeof value.brewingDetail === "string" ? value.brewingDetail : "",
    brewingNotes: Array.isArray(value.brewingNotes)
      ? value.brewingNotes.filter((item): item is string => typeof item === "string")
      : [],
    brewingExtra: parseBrewingExtra(value.brewingExtra),
    hours: typeof value.hours === "string" ? value.hours : "",
    thinOffer: typeof value.thinOffer === "string" ? value.thinOffer : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    instagram: typeof value.instagram === "string" ? value.instagram : "",
  };
}

/** Same-origin paths or http(s) only. No javascript: or protocol-relative. */
export function safePassportPhoto(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* not a URL */
  }
  return null;
}

export function publicPassport(raw: PassportOwnerFields): PassportOwnerFields {
  return {
    photos: raw.photos
      .map((photo) => safePassportPhoto(photo))
      .filter((photo): photo is string => Boolean(photo)),
    brewingNote: raw.brewingNote.trim(),
    brewingTitle: raw.brewingTitle.trim(),
    brewingDetail: raw.brewingDetail.trim(),
    brewingNotes: raw.brewingNotes.map((note) => note.trim()).filter(Boolean),
    brewingExtra: raw.brewingExtra
      .map((item) => ({
        title: item.title.trim(),
        detail: item.detail.trim(),
      }))
      .filter((item) => item.title || item.detail),
    hours: raw.hours.trim(),
    thinOffer: raw.thinOffer.trim(),
    phone: raw.phone.trim(),
    instagram: raw.instagram.trim(),
  };
}

export function passportHasBrewing(passport: PassportOwnerFields): boolean {
  return Boolean(
    passport.brewingNote ||
      passport.brewingTitle ||
      passport.brewingDetail ||
      passport.brewingNotes.length > 0 ||
      passport.brewingExtra.length > 0,
  );
}

export function preferPassportUi(status: ClaimStatus): boolean {
  return status === "verified";
}

/**
 * Owner photos win as a full carousel. Catalog logo/photo is only the
 * fallback when passport.photos[] is empty — never a single-frame stand-in
 * that hides extra owner images.
 */
export function passportHeroPhotos(
  passport: PassportOwnerFields,
  shop?: { photoUrl?: string; logoUrl?: string },
): string[] {
  const owner = mergePassportPhotos(passport.photos, []).map(ownerPhotoDisplaySrc);
  if (owner.length > 0) return owner;
  const fallback = shop?.photoUrl || shop?.logoUrl;
  return fallback ? [fallback] : [];
}

export function instagramHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (url.hostname === "instagram.com" || url.hostname === "www.instagram.com")
    ) {
      return url.href;
    }
    return null;
  } catch {
    const handle = value.replace(/^@/, "");
    if (/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      return `https://www.instagram.com/${handle}/`;
    }
    return null;
  }
}

export function ownerPhoneHref(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!/^\+?[0-9]{8,15}$/.test(digits)) return null;
  return `tel:${digits}`;
}

const OWNER_WRITE_LIMITS = {
  brewingNote: 280,
  brewingTitle: 120,
  brewingDetail: 200,
  hours: 120,
  thinOffer: 160,
  phone: 32,
  instagram: 80,
  photo: 2048,
  note: 40,
  extraTitle: 80,
  extraDetail: 80,
} as const;

function clip(value: string, max: number): string {
  return value.slice(0, max);
}

/**
 * Owner-writable Passport only. Drops name / district / pin / status.
 * Hours stay empty unless the owner typed them — never invent defaults.
 */
export function sanitizeOwnerPassport(raw: unknown): PassportOwnerFields {
  const parsed = publicPassport(parsePassport(raw));
  return {
    photos: mergePassportPhotos(parsed.photos, []).map((photo) =>
      clip(photo, OWNER_WRITE_LIMITS.photo),
    ),
    brewingNote: clip(parsed.brewingNote, OWNER_WRITE_LIMITS.brewingNote),
    brewingTitle: clip(parsed.brewingTitle, OWNER_WRITE_LIMITS.brewingTitle),
    brewingDetail: clip(parsed.brewingDetail, OWNER_WRITE_LIMITS.brewingDetail),
    brewingNotes: parsed.brewingNotes
      .slice(0, 12)
      .map((note) => clip(note, OWNER_WRITE_LIMITS.note)),
    brewingExtra: parsed.brewingExtra.slice(0, 8).map((item) => ({
      title: clip(item.title, OWNER_WRITE_LIMITS.extraTitle),
      detail: clip(item.detail, OWNER_WRITE_LIMITS.extraDetail),
    })),
    hours: clip(parsed.hours, OWNER_WRITE_LIMITS.hours),
    thinOffer: clip(parsed.thinOffer, OWNER_WRITE_LIMITS.thinOffer),
    phone: clip(parsed.phone, OWNER_WRITE_LIMITS.phone),
    instagram: clip(parsed.instagram, OWNER_WRITE_LIMITS.instagram),
  };
}
