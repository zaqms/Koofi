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
  "ghirnatah",
  "al-shohda",
  "al-safa",
  "al-rawdah",
  "qurtubah",
  "an-nazhah",
  "al-hamra",
  "al-yarmouk",
  "al-nahdah",
  "al-manar",
  "al-rayyan",
  "al-rawabi",
  "al-fayha",
  "al-raqban",
  "al-munsiyah",
  "an-nada",
  "diplomatic-quarter",
  "king-fahd",
  "al-takhassusi",
  "al-aqiq",
  "al-ghadeer",
  "al-arid",
  "al-qirawan",
  "al-wadi",
  "al-mohammadiyah",
  "al-muruj",
  "al-malaz",
  "al-mathar",
  "at-taawun",
  "al-mursalat",
  "al-murabba",
  "as-salam",
  "ghubairah",
  "al-wisham",
  "badr",
  "al-aziziyah",
  "al-hazm",
  "al-andalus",
  "al-khaleej",
  "an-nasim-al-gharbi",
  "ar-rimal",
  "al-janadriyyah",
  "namar",
  "kkia",
  "al-jazirah",
  "an-nasim",
  "shubra",
  "manfuha",
  "tuwaiq",
  "as-suwaidi",
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
  "with-friends",
  "matcha",
  "drive-through",
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
  /** Baked Maps+IG popularity. Used only by the Most Popular / popular moment lock. */
  popularityIndex?: number;
  /**
   * Drive-through-lane shops are live on cafe cards + the Drive-through
   * directory only. They stay out of default specialty discovery.
   */
  catalogLane?: "drive-through";
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
  photoUrl?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  reviewSnippet?: string;
  lat?: number;
  lng?: number;
  /** 1–2 catalog vibe labels for بيننا result cards. */
  tags?: string[];
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

export type DistrictMatch = {
  district_slug: NeighborhoodId;
  locale: Language;
};

export type PickResult = {
  language: Language;
  picks: PickReason[];
  thinCatalog: boolean;
  askedNeighborhoods: NeighborhoodId[];
  avoidedNeighborhoods: NeighborhoodId[];
  askedMoments: MomentTag[];
  /** Set when the ask named a live district. All picks stay in that حي. */
  matchedDistrict?: NeighborhoodId;
};
