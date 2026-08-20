export const CITIES = ["riyadh"] as const;
export type City = (typeof CITIES)[number];

export const NEIGHBORHOOD_IDS = [
  "hittin",
  "al-malqa",
  "al-nakheel",
  "al-yasmin",
  "olaya",
] as const;
export type NeighborhoodId = (typeof NEIGHBORHOOD_IDS)[number];

export const MOMENT_TAGS = [
  "work",
  "friend",
  "qahwa",
  "roaster",
  "quiet",
  "late",
] as const;
export type MomentTag = (typeof MOMENT_TAGS)[number];

export type Language = "ar" | "en";

export type Pin = {
  lat: number;
  lng: number;
};

export type Shop = {
  id: string;
  nameAr: string;
  nameEn: string;
  city: City;
  neighborhood: NeighborhoodId;
  neighborhoodAr: string;
  vibeTags: string[];
  momentTags: MomentTag[];
  officialSite?: string;
  pin?: Pin;
  hours?: string;
  example: boolean;
};

export type CatalogFile = {
  note: string;
  shops: Shop[];
};

export type Intent = {
  language: Language;
  neighborhoods: NeighborhoodId[];
  moments: MomentTag[];
  raw: string;
};

export type PickReason = {
  shop: Shop;
  why: string;
};

export type PickResult = {
  language: Language;
  picks: PickReason[];
  thinCatalog: boolean;
  askedNeighborhoods: NeighborhoodId[];
  askedMoments: MomentTag[];
};
