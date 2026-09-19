import { CITIES, type City, type Language } from "./types";

/**
 * Product city registry. Coming-soon rows are config flags, not catalog data.
 * Do not invent districts or cafés for a city that is not live.
 */
export const CITY_STATUS = ["live", "comingSoon"] as const;
export type CityStatus = (typeof CITY_STATUS)[number];

export type CityRecord = {
  id: string;
  nameEn: string;
  nameAr: string;
  status: CityStatus;
  sort: number;
};

/**
 * Locked names: الرياض / جدة / الدمام.
 * Riyadh is the only live city. Jeddah + Dammam are names only.
 */
export const CITY_REGISTRY = [
  {
    id: "riyadh",
    nameEn: "Riyadh",
    nameAr: "الرياض",
    status: "live",
    sort: 0,
  },
  {
    id: "jeddah",
    nameEn: "Jeddah",
    nameAr: "جدة",
    status: "comingSoon",
    sort: 1,
  },
  {
    id: "dammam",
    nameEn: "Dammam",
    nameAr: "الدمام",
    status: "comingSoon",
    sort: 2,
  },
] as const satisfies readonly CityRecord[];

export type CityId = (typeof CITY_REGISTRY)[number]["id"];

export const DEFAULT_LIVE_CITY: City = "riyadh";
export const DEFAULT_BROWSE_CITY = DEFAULT_LIVE_CITY;

export const CITY_LABEL: Record<CityId, Record<Language, string>> = {
  riyadh: { ar: "الرياض", en: "Riyadh" },
  jeddah: { ar: "جدة", en: "Jeddah" },
  dammam: { ar: "الدمام", en: "Dammam" },
};

const CITY_BY_ID = new Map<string, (typeof CITY_REGISTRY)[number]>(
  CITY_REGISTRY.map((row) => [row.id, row]),
);

export function listCityRegistry(): readonly (typeof CITY_REGISTRY)[number][] {
  return [...CITY_REGISTRY].sort((a, b) => a.sort - b.sort);
}

export function isCityId(value: string | null | undefined): value is CityId {
  return Boolean(value && CITY_BY_ID.has(value));
}

export function getCity(id: string): (typeof CITY_REGISTRY)[number] | null {
  return CITY_BY_ID.get(id) ?? null;
}

/** Catalog / shop.city cities — live discovery only. */
export function isCatalogCity(value: string | null | undefined): value is City {
  return Boolean(value && (CITIES as readonly string[]).includes(value));
}

export function isLiveCity(value: string | null | undefined): value is City {
  const row = value ? CITY_BY_ID.get(value) : undefined;
  return Boolean(row && row.status === "live" && isCatalogCity(row.id));
}

export function isComingSoonCity(
  value: string | null | undefined,
): value is CityId {
  const row = value ? CITY_BY_ID.get(value) : undefined;
  return Boolean(row && row.status === "comingSoon");
}

export function parseCityId(value: unknown): CityId | null {
  return typeof value === "string" && isCityId(value) ? value : null;
}

export function parseCatalogCity(value: unknown): City | null {
  const id = parseCityId(value);
  return id && isCatalogCity(id) ? id : null;
}

export function cityLabel(
  id: CityId | City,
  language: Language,
): string {
  return CITY_LABEL[id][language];
}

export function cityStatus(id: CityId): CityStatus {
  return CITY_BY_ID.get(id)?.status ?? "comingSoon";
}

/** Registry name aliases only — never district strings. */
const CITY_NAME_ALIASES: Record<CityId, readonly string[]> = {
  riyadh: ["riyadh", "الرياض", "رياض"],
  jeddah: ["jeddah", "جدة", "جده"],
  dammam: ["dammam", "الدمام", "دمام"],
};

function normalizeCityName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a city from a registry label (Riyadh / جدة / …).
 * Returns null for district names — never infer a city from a حي string.
 */
export function cityFromRegistryLabel(raw: string): CityId | null {
  const needle = normalizeCityName(raw);
  if (!needle) return null;
  for (const row of CITY_REGISTRY) {
    const aliases = [
      row.id,
      row.nameEn,
      row.nameAr,
      ...CITY_NAME_ALIASES[row.id],
    ];
    if (aliases.some((alias) => normalizeCityName(alias) === needle)) {
      return row.id;
    }
  }
  return null;
}

export function inCityPhrase(language: Language, city: CityId | City): string {
  const name = cityLabel(city, language);
  return language === "ar" ? `في ${name}` : `in ${name}`;
}

export function directoryHintForCity(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar"
    ? `قهوة نحبها في ${name}.`
    : `Cafes we like in ${name}.`;
}

export function browseNeighborhoodsHintForCity(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar"
    ? "اكتشف القهاوي حولك، حي بحي."
    : `Coffee around ${name}, neighborhood by neighborhood.`;
}

export function neighborhoodsIndexHintForCity(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar"
    ? `استكشف القهاوي في ${name}.`
    : `Explore coffee spots across ${name}.`;
}

export function neighborhoodsIndexHeadingForCity(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar" ? `أحياء ${name}` : `${name} Neighborhoods`;
}

export function mostPopularHeadingForCity(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar"
    ? `أشهر القهاوي في ${name}`
    : `Most popular coffee shops in ${name}`;
}

export function coffeeInCityPhrase(
  language: Language,
  city: CityId | City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar" ? `للقهوة في ${name}` : `coffee in ${name}`;
}

export function comingSoonHeading(
  language: Language,
  city: CityId,
): string {
  const name = cityLabel(city, language);
  return language === "ar" ? `${name} — قريبًا` : `${name} — coming soon`;
}

export function comingSoonBody(
  language: Language,
  city: CityId,
  _liveCity: City = DEFAULT_LIVE_CITY,
): string {
  const name = cityLabel(city, language);
  return language === "ar"
    ? `وين بعد ما انفتحت في ${name}. القائمة هناك لسا جاية — ما نعرض أحياء مدينة ثانية مكانها.`
    : `wain.lol isn’t in ${name} yet. The catalog there is still coming — we won’t show another city’s districts here.`;
}

export function comingSoonLiveHint(
  language: Language,
  liveCity: City = DEFAULT_LIVE_CITY,
): string {
  const live = cityLabel(liveCity, language);
  return language === "ar"
    ? `فاتحين الحين في ${live}.`
    : `We’re live in ${live}.`;
}

export function backToLiveCityLabel(
  language: Language,
  liveCity: City = DEFAULT_LIVE_CITY,
): string {
  const live = cityLabel(liveCity, language);
  return language === "ar" ? `ارجع لـ ${live}` : `Back to ${live}`;
}
