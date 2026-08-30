export const CITIES = ["riyadh"] as const;
export type City = (typeof CITIES)[number];

export const NEIGHBORHOOD_IDS = [
  "hittin",
  "al-malqa",
  "al-nakheel",
  "al-yasmin",
  "olaya",
  "sulimaniyah",
  "al-wurud",
  "al-rabwah",
  "al-rabi",
  "al-masif",
  "al-rahmaniyyah",
  "as-sahafah",
  "kafd",
  "diriyah",
  "al-narjis",
  "al-mughrizat",
] as const;
export type NeighborhoodId = (typeof NEIGHBORHOOD_IDS)[number];

export const MOMENT_TAGS = [
  "work",
  "friend",
  "qahwa",
  "roaster",
  "quiet",
  "late",
  "popular",
  "pastry",
  "study",
  "outdoor",
  "date",
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
  mapsShareUrl?: string;
  photoUrl?: string;
  logoUrl?: string;
  example: boolean;
};

export type ChatPick = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoodLabel: string;
  example: boolean;
  why: string;
  mapsHref: string;
  cardPath: string;
  matchedTags: string[];
  photoUrl?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  reviewSnippet?: string;
  lat?: number;
  lng?: number;
};

export type ShopSuggestion = {
  id: string;
  mapsUrl: string;
  resolvedName?: string;
  neighborhood?: NeighborhoodId;
  createdAt: string;
};

export type CatalogFile = {
  note: string;
  shops: Shop[];
};

export type Intent = {
  language: Language;
  neighborhoods: NeighborhoodId[];
  avoidedNeighborhoods: NeighborhoodId[];
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
  avoidedNeighborhoods: NeighborhoodId[];
  askedMoments: MomentTag[];
};
