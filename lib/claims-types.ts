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

export function parsePassport(raw: unknown): PassportOwnerFields {
  const empty = emptyPassport();
  if (!raw || typeof raw !== "object") return empty;
  const value = raw as Record<string, unknown>;
  return {
    photos: Array.isArray(value.photos)
      ? value.photos.filter((item): item is string => typeof item === "string")
      : [],
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
