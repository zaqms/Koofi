import { formatSharePacket } from "./packet";
import { encodePackId, packSharePath } from "./pack";
import type { ChatPick, Language } from "./types";

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

/** Share-to-a-friend. No phone number — they pick the chat. Not Contact us. */
export function whatsAppShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function silentCopy(text: string): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {
    // Silent fallback only. Do not toast.
  }
}

/**
 * Open the user's WhatsApp with the packet prefilled.
 * Native scheme first so we do not land on WhatsApp Web / QR.
 * wa.me/?text= (no number) is the public share URL.
 * Clipboard only if WhatsApp does not take over.
 */
export function openWhatsAppPacket(text: string): void {
  const encoded = encodeURIComponent(text);
  const native = `whatsapp://send?text=${encoded}`;
  const waMe = whatsAppShareHref(text);

  window.location.href = native;

  window.setTimeout(() => {
    if (document.hidden) return;
    window.location.href = waMe;
    window.setTimeout(() => {
      if (!document.hidden) silentCopy(text);
    }, 900);
  }, 500);
}
