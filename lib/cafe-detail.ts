import cafeHeroesFile from "../data/cafe-heroes.json";
import { copy } from "./copy";
import type {
  Language,
  OpeningHoursPeriod,
  OpeningHoursPoint,
  Shop,
} from "./types";

export type CafeDetailHeroAttribution = {
  displayName: string;
  uri?: string;
};

export type CafeDetailHeroPhoto = {
  src: string;
  attribution?: CafeDetailHeroAttribution;
};

const CAFE_HEROES = cafeHeroesFile as Record<string, CafeDetailHeroPhoto[]>;

/**
 * Cached cafe-heroes for Rahmaniyyah Camel Step. Other baked shops
 * resolve from data/cafe-heroes.json — never logos, never live Places photos.
 */
export const CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS = (
  CAFE_HEROES["camel-step-al-rahmaniyyah"] ?? []
).map((photo) => photo.src);

export function cafeDetailHeroPhotos(
  shop: Pick<Shop, "id" | "photoUrl">,
): CafeDetailHeroPhoto[] {
  const baked = shop.id ? CAFE_HEROES[shop.id] : undefined;
  if (baked && baked.length > 0) return baked.slice(0, 4);
  const photo = shop.photoUrl?.trim();
  return photo ? [{ src: photo }] : [];
}

/** Quiet Google credit when baked Places photos carry author attributions. */
export function cafeDetailHeroNeedsGoogleCredit(
  photos: readonly CafeDetailHeroPhoto[],
): boolean {
  return photos.some((photo) => Boolean(photo.attribution?.displayName?.trim()));
}

/**
 * Short identity line. Catalog has no verified description field —
 * return null rather than SEO filler or AI copy.
 */
export function cafeDetailDescription(
  shop: Pick<Shop, "id">,
): string | null {
  void shop;
  return null;
}

export type CafeDetailHoursStatus =
  | { kind: "open"; label: string }
  | { kind: "closed"; label: string }
  | { kind: "opens"; label: string };

const RIYADH_TZ = "Asia/Riyadh";
const WEEK_MINUTES = 7 * 24 * 60;
const WEEKDAY_TO_DAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function validPoint(value: OpeningHoursPoint | undefined): value is OpeningHoursPoint {
  if (!value) return false;
  return (
    Number.isInteger(value.day) &&
    value.day >= 0 &&
    value.day <= 6 &&
    Number.isInteger(value.hour) &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    Number.isInteger(value.minute) &&
    value.minute >= 0 &&
    value.minute <= 59
  );
}

function pointMinutes(point: OpeningHoursPoint): number {
  return (point.day * 24 + point.hour) * 60 + point.minute;
}

function riyadhClock(
  now: Date,
): { day: number; hour: number; minute: number } | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RIYADH_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = WEEKDAY_TO_DAY[weekday];
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  if (day == null || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  return { day, hour, minute };
}

function toArabicDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] ?? digit);
}

function formatClock(hour: number, minute: number, language: Language): string {
  const meridiem = hour < 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, "0");
  if (language === "ar") {
    return `${toArabicDigits(String(hour12))}:${toArabicDigits(mm)} ${meridiem ? "ص" : "م"}`;
  }
  return `${hour12}:${mm} ${meridiem ? "AM" : "PM"}`;
}

function periodIntervals(periods: OpeningHoursPeriod[]): number[][] | "always" {
  const intervals: number[][] = [];
  for (const period of periods) {
    if (!validPoint(period.open)) continue;
    if (!period.close) return "always";
    if (!validPoint(period.close)) continue;
    const start = pointMinutes(period.open);
    let end = pointMinutes(period.close);
    if (end <= start) end += WEEK_MINUTES;
    intervals.push([start, end]);
  }
  return intervals;
}

function containsNow(nowMin: number, start: number, end: number): boolean {
  return (
    (nowMin >= start && nowMin < end) ||
    (nowMin + WEEK_MINUTES >= start && nowMin + WEEK_MINUTES < end)
  );
}

function nextOpenStart(nowMin: number, intervals: number[][]): number | null {
  let next: number | null = null;
  for (const [start] of intervals) {
    for (const candidate of [start, start + WEEK_MINUTES]) {
      if (candidate <= nowMin) continue;
      if (next == null || candidate < next) next = candidate;
    }
  }
  return next;
}

/**
 * Open / Closed / Opens at… from baked catalog periods in Asia/Riyadh.
 * `hours` strings and live Place Details lookups are not used.
 */
export function cafeDetailHoursStatus(
  shop: Pick<Shop, "id" | "hours" | "openingHours">,
  language: Language,
  now: Date = new Date(),
): CafeDetailHoursStatus | null {
  void shop.id;
  void shop.hours;
  const periods = shop.openingHours?.periods;
  if (!periods || periods.length === 0) return null;

  const intervals = periodIntervals(periods);
  if (intervals === "always") {
    return { kind: "open", label: copy.detailOpenNow[language] };
  }
  if (intervals.length === 0) return null;

  const clock = riyadhClock(now);
  if (!clock) return null;
  const nowMin = pointMinutes(clock);
  const open = intervals.some(([start, end]) => containsNow(nowMin, start, end));
  if (open) {
    return { kind: "open", label: copy.detailOpenNow[language] };
  }

  const nextStart = nextOpenStart(nowMin, intervals);
  if (nextStart == null) {
    return { kind: "closed", label: copy.detailClosedNow[language] };
  }

  const nextDay = Math.floor((nextStart % WEEK_MINUTES) / (24 * 60));
  if (nextDay !== clock.day) {
    return { kind: "closed", label: copy.detailClosedNow[language] };
  }

  const minuteOfDay = nextStart % (24 * 60);
  return {
    kind: "opens",
    label: `${copy.detailOpensAt[language]} ${formatClock(
      Math.floor(minuteOfDay / 60),
      minuteOfDay % 60,
      language,
    )}`,
  };
}

export type CafeDetailWeeklyHoursLine = {
  day: string;
  hours: string;
};

/** Google day index. Monday-first matches baked weekdayDescriptions. */
const DAY_NAME: Record<Language, readonly string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};
const WEEK_DISPLAY = [1, 2, 3, 4, 5, 6, 0] as const;

function formatSpan(
  open: OpeningHoursPoint,
  close: OpeningHoursPoint,
  language: Language,
): string {
  return `${formatClock(open.hour, open.minute, language)} – ${formatClock(close.hour, close.minute, language)}`;
}

/**
 * Weekly schedule from baked catalog periods in Asia/Riyadh.
 * Shops without periods stay blank — hours are not invented.
 * A period with no close means open 24 hours, same as Status.
 */
export function cafeDetailWeeklyHours(
  shop: Pick<Shop, "openingHours">,
  language: Language,
): CafeDetailWeeklyHoursLine[] | null {
  const periods = shop.openingHours?.periods;
  if (!periods || periods.length === 0) return null;

  const usable = periods.filter(
    (period) =>
      validPoint(period.open) && (period.close == null || validPoint(period.close)),
  );
  if (usable.length === 0) return null;

  if (usable.some((period) => period.close == null)) {
    return WEEK_DISPLAY.map((day) => ({
      day: DAY_NAME[language][day] ?? "",
      hours: copy.detailHoursAllDay[language],
    }));
  }

  return WEEK_DISPLAY.map((day) => {
    const todays = usable
      .filter((period) => period.open.day === day)
      .sort((a, b) => pointMinutes(a.open) - pointMinutes(b.open));
    const hours =
      todays.length === 0
        ? copy.detailClosedNow[language]
        : todays
            .map((period) =>
              formatSpan(period.open, period.close as OpeningHoursPoint, language),
            )
            .join(" · ");
    return { day: DAY_NAME[language][day] ?? "", hours };
  });
}

/** `{Neighborhood} cafés` / `قهاوي {الحي}` — catalog district name only. */
export function neighborhoodCafesHeading(
  neighborhood: string,
  language: Language,
): string {
  const name = neighborhood.trim();
  if (!name) return "";
  return language === "ar" ? `قهاوي ${name}` : `${name} cafés`;
}
