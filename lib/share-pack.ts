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

export async function copySharePacket(text: string): Promise<"copied" | "shared" | "failed"> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // Clipboard can fail in some in-app browsers; Web Share is the fallback.
  }

  const shareData = { text };
  try {
    if (navigator.share && navigator.canShare?.(shareData) !== false) {
      await navigator.share(shareData);
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "failed";
    }
  }

  return "failed";
}
