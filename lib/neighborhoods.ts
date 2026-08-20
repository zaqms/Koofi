import type { NeighborhoodId } from "./types";

export const NEIGHBORHOODS: Record<
  NeighborhoodId,
  { id: NeighborhoodId; ar: string; en: string; aliases: string[] }
> = {
  hittin: {
    id: "hittin",
    ar: "هيتين",
    en: "Hittin",
    aliases: ["هيتين", "حطين", "هتين", "hittin", "hitteen", "hateen"],
  },
  "al-malqa": {
    id: "al-malqa",
    ar: "الملقا",
    en: "Al Malqa",
    aliases: ["الملقا", "ملقا", "المالقا", "malqa", "al malqa", "al-malqa"],
  },
  "al-nakheel": {
    id: "al-nakheel",
    ar: "النخيل",
    en: "Al Nakheel",
    aliases: ["النخيل", "نخیل", "nakheel", "nakhil", "al nakheel", "al-nakheel"],
  },
  "al-yasmin": {
    id: "al-yasmin",
    ar: "الياسمين",
    en: "Al Yasmin",
    aliases: ["الياسمين", "ياسمين", "yasmin", "yasmeen", "al yasmin", "al-yasmin"],
  },
  olaya: {
    id: "olaya",
    ar: "العليا",
    en: "Olaya",
    aliases: ["العليا", "عليا", "olaya", "ulayya", "olaia"],
  },
};

export function neighborhoodLabel(
  id: NeighborhoodId,
  language: "ar" | "en",
): string {
  return language === "ar" ? NEIGHBORHOODS[id].ar : NEIGHBORHOODS[id].en;
}
