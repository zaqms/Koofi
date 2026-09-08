import {
  emptyPassport,
  type PassportOwnerFields,
} from "./claims-types";
import type { Language } from "./types";

/** Woods Olaya — the locked SSO preview shop for Passport. */
export const PASSPORT_PREVIEW_SHOP_ID = "woods-olaya";

/**
 * Preview / local only. Production (`VERCEL_ENV=production`) never overlays
 * a fixture — Woods stays a thin unclaimed card until a real verified row.
 */
export function allowPassportPreview(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

export function isPassportPreviewShop(shopId: string): boolean {
  return shopId === PASSPORT_PREVIEW_SHOP_ID;
}

/**
 * Owner-shaped sample for the Woods Passport preview.
 * Hours stay empty — do not invent opening times.
 */
export function woodsPassportFixture(
  language: Language = "ar",
): PassportOwnerFields {
  const empty = emptyPassport();
  if (language === "en") {
    return {
      ...empty,
      brewingTitle: "Yirgacheffe · Kochere",
      brewingDetail: "Washed · 1,900 m · roasted 6 days ago",
      brewingNotes: ["jasmine", "bergamot", "honey"],
      brewingNote: "Ask for it on the V60. They will not mind.",
      brewingExtra: [
        { title: "Huila · Castillo", detail: "Espresso · cocoa · orange" },
        { title: "Haraz · Yemen", detail: "Batch · date · spice" },
      ],
    };
  }
  return {
    ...empty,
    brewingTitle: "يرقاجيفي · كوتشيري",
    brewingDetail: "مغسول · ١٩٠٠ م · محمّص من ٦ أيام",
    brewingNotes: ["ياسمين", "برغموت", "عسل"],
    brewingNote: "اطلبه على الـ V60. ما ستضايقون.",
    brewingExtra: [
      { title: "هويلا · كاستيو", detail: "إسبريسو · كاكاو · برتقال" },
      { title: "حراز · اليمن", detail: "باتش · تمر · بهار" },
    ],
  };
}

export function shouldApplyPassportPreview(
  shopId: string,
  status: "none" | "pending" | "verified",
): boolean {
  return (
    allowPassportPreview() &&
    isPassportPreviewShop(shopId) &&
    status === "none"
  );
}
