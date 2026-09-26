/** Catalog / shop.city field. Coming-soon cities live in `lib/cities.ts`. */
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
  "an-nasim-ash-sharqi",
  "an-nasim",
  "shubra",
  "manfuha",
  "tuwaiq",
  "as-suwaidi",
  "al-falah",
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

/** Google Places weekday: 0 = Sunday. Baked catalog hours only. */
export type OpeningHoursPoint = {
  day: number;
  hour: number;
  minute: number;
};

export type OpeningHoursPeriod = {
  open: OpeningHoursPoint;
  close?: OpeningHoursPoint;
};

export type OpeningHours = {
  weekdayDescriptions?: string[];
  periods?: OpeningHoursPeriod[];
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
  /** Baked Places regularOpeningHours. Detail Status reads periods only. */
  openingHours?: OpeningHours;
  mapsShareUrl?: string;
  photoUrl?: string;
  logoUrl?: string;
  /**
   * Sort key for Most Popular and district rank. Load time sets this to the
   * baked Maps+IG index plus the TikTok bonus. Not shown. Shops with no
   * baked index stay unranked.
   */
  popularityIndex?: number;
  /**
   * Drive-through-lane shops are live on cafe cards + the Drive-through
   * directory only. They stay out of default specialty discovery.
   */
  catalogLane?: "drive-through";
  /**
   * Dine-in for بيننا. Scout verdict wins over Places.
   * `null` / missing = unresolved — fail-closed. Not a Soft Places vibe.
   */
  dineIn?: boolean | null;
  /**
   * Outdoor seating. Scout wins over Places. Sit-down for بيننا when
   * `true`, even if `dineIn` is false.
   */
  outdoorSeating?: boolean | null;
  /**
   * Scout pickup-only. Always excludes from بيننا, even if `dineIn` is true.
   * `null` / missing = not asserted (drive-through tags still exclude).
   */
  pickupOnly?: boolean | null;
  /**
   * Scout `baynana_eligible` when a manual verdict exists.
   * `true` / `false` after the drive-through / pickup-only gate.
   * `null` / missing = fall through to dine-in / outdoor (fail-closed).
   */
  baynanaEligible?: boolean | null;
  /** Google Places id (`ChIJ…`). Scout `correct_place_id` wins on rematch. */
  placeId?: string;
  example: boolean;
};

export type ChatPick = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhood: NeighborhoodId;
  neighborhoodAr: string;
  neighborhoodLabel: string;
  vibeTags: string[];
  momentTags: MomentTag[];
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
  /** 1–2 catalog vibe labels. Listing cards recompute via listingCardTags. */
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
