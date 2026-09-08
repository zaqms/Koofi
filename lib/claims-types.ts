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

/** Empty Passport owner fields. Not public-writable until verified (later PRs). */
export type PassportOwnerFields = {
  photos: string[];
  brewingNote: string;
  hours: string;
  thinOffer: string;
  phone: string;
  instagram: string;
};

export function emptyPassport(): PassportOwnerFields {
  return {
    photos: [],
    brewingNote: "",
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

/** Public card footer — no owner name, no phone. */
export type PublicClaimStatus = {
  shopId: string;
  status: ClaimStatus;
  storage: "ready" | "missing";
};

export const STUB_OTP_CODE = "000000";

export function parseProofType(raw: unknown): ProofType | undefined {
  if (raw === "cr") return raw;
  return undefined;
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
    hours: typeof value.hours === "string" ? value.hours : "",
    thinOffer: typeof value.thinOffer === "string" ? value.thinOffer : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    instagram: typeof value.instagram === "string" ? value.instagram : "",
  };
}
