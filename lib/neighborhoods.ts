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
  sulimaniyah: {
    id: "sulimaniyah",
    ar: "السليمانية",
    en: "Sulimaniyah",
    aliases: [
      "السليمانية",
      "سليمانية",
      "sulimaniyah",
      "sulaymaniyah",
      "sulaymaniyya",
    ],
  },
  "al-wurud": {
    id: "al-wurud",
    ar: "الورود",
    en: "Al Wurud",
    aliases: [
      "الورود",
      "ورود",
      "wurud",
      "al wurud",
      "al-wurud",
      "al-woroud",
      "woroud",
    ],
  },
  "al-rabwah": {
    id: "al-rabwah",
    ar: "الربوة",
    en: "Al Rabwah",
    aliases: [
      "الربوة",
      "ربوة",
      "rabwah",
      "al rabwah",
      "ar rabwah",
      "al-rabwah",
      "ar-rabwah",
    ],
  },
  "al-rabi": {
    id: "al-rabi",
    ar: "الربيع",
    en: "Al Rabi",
    aliases: [
      "الربيع",
      "ربيع",
      "rabi",
      "ar rabi",
      "al rabi",
      "al-rabi",
      "ar-rabi",
    ],
  },
  "al-masif": {
    id: "al-masif",
    ar: "المصيف",
    en: "Al Masif",
    aliases: [
      "المصيف",
      "مصيف",
      "masif",
      "massif",
      "al masif",
      "al-masif",
      "al massif",
      "al-massif",
    ],
  },
  "al-rahmaniyyah": {
    id: "al-rahmaniyyah",
    ar: "الرحمانية",
    en: "Al Rahmaniyyah",
    aliases: [
      "الرحمانية",
      "رحمانية",
      "rahmaniyyah",
      "rahmaniyah",
      "ar rahmaniyyah",
      "al rahmaniyyah",
      "al-rahmaniyyah",
      "ar-rahmaniyyah",
    ],
  },
  "as-sahafah": {
    id: "as-sahafah",
    ar: "الصحافة",
    en: "Al Sahafah",
    aliases: [
      "الصحافة",
      "صحافة",
      "sahafah",
      "al sahafah",
      "as sahafah",
      "al-sahafah",
      "as-sahafah",
    ],
  },
  kafd: {
    id: "kafd",
    ar: "كافد",
    en: "KAFD",
    aliases: ["كافد", "kafd", "king abdullah financial district"],
  },
  diriyah: {
    id: "diriyah",
    ar: "الدرعية",
    en: "Diriyah",
    aliases: [
      "الدرعية",
      "درعية",
      "diriyah",
      "al diriyah",
      "ad diriyah",
      "al-diriyah",
      "ad-diriyah",
    ],
  },
  "al-narjis": {
    id: "al-narjis",
    ar: "النرجس",
    en: "Al Narjis",
    aliases: [
      "النرجس",
      "نرجس",
      "narjis",
      "an narjis",
      "al narjis",
      "al-narjis",
      "an-narjis",
    ],
  },
};

export function neighborhoodLabel(
  id: NeighborhoodId,
  language: "ar" | "en",
): string {
  return language === "ar" ? NEIGHBORHOODS[id].ar : NEIGHBORHOODS[id].en;
}
