import { formatListingPacket, formatSharePacket } from "./packet";
import { encodePackId, packSharePath } from "./pack";
import { cardSharePath, shopDisplayName } from "./product";
import type { ChatPick, Language, Shop } from "./types";
import { shopWhyLine } from "./why-line";

export function packIdForPicks(input: {
  picks: ChatPick[];
  language: Language;
  ask: string;
}): string {
  return encodePackId({
    locale: input.language,
    shopIds: input.picks.map((pick) => pick.id),
    ask: input.ask,
  });
}

export function packetTextForPicks(input: {
  picks: ChatPick[];
  language: Language;
  ask: string;
  origin: string;
}): { packId: string; text: string; restoreUrl: string } {
  const packId = packIdForPicks(input);
  const restoreUrl = `${input.origin.replace(/\/$/, "")}${packSharePath(packId)}`;
  return {
    packId,
    restoreUrl,
    text: formatSharePacket({
      ask: input.ask,
      picks: input.picks,
      language: input.language,
      restoreUrl,
    }),
  };
}

export function listingPacketForShop(input: {
  shop: Pick<Shop, "id" | "nameAr" | "nameEn" | "neighborhood" | "momentTags" | "vibeTags">;
  language: Language;
  origin: string;
}): { text: string; cardUrl: string } {
  const cardUrl = `${input.origin.replace(/\/$/, "")}${cardSharePath(input.shop.id, input.language)}`;
  return {
    cardUrl,
    text: formatListingPacket({
      name: shopDisplayName(input.shop, input.language),
      why: shopWhyLine(input.shop, input.language),
      cardUrl,
    }),
  };
}

/** Last-resort only. No phone number — they pick the chat. Not Contact us. */
export function whatsAppShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export type SharePackResult = "shared" | "copied" | "whatsapp" | "cancelled" | "failed";

async function copyPacket(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Phones: system share sheet (they pick WhatsApp, Snap, IG, Messages, …).
 * Packet already includes the restore URL — do not pass `url` or it duplicates.
 * Desktop / blocked in-app browsers: clipboard, then wa.me/?text= last.
 */
export async function sharePackPacket(text: string): Promise<SharePackResult> {
  const shareData = { text };
  if (typeof navigator.share === "function") {
    try {
      if (navigator.canShare?.(shareData) !== false) {
        await navigator.share(shareData);
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  if (await copyPacket(text)) return "copied";

  window.location.href = whatsAppShareHref(text);
  return "whatsapp";
}
