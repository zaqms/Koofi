import { shopDisplayName } from "./product";
import type { ChatPick, Language } from "./types";

const MAPS_HOST = /maps\.(google|app)|google\.com\/maps|maps\.app\.goo/i;

export function formatSharePacket(input: {
  ask: string;
  picks: ChatPick[];
  language: Language;
  restoreUrl: string;
}): string {
  const ask = input.ask.trim();
  const lines: string[] = [];
  if (ask) lines.push(`asked: ${ask}`, "");

  input.picks.forEach((pick, index) => {
    const name = shopDisplayName(pick, input.language);
    lines.push(`${index + 1}) ${name} — ${pick.why}`);
  });

  lines.push("", input.restoreUrl);
  const text = lines.join("\n");
  if (MAPS_HOST.test(text)) {
    return text
      .split("\n")
      .filter((line) => !MAPS_HOST.test(line))
      .join("\n");
  }
  return text;
}

export function packetHasMapsUrl(text: string): boolean {
  return MAPS_HOST.test(text);
}
