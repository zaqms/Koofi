import { readFileSync, writeFileSync } from "node:fs";
import { getShop } from "./catalog";
import { copy } from "./copy";
import { cardPath } from "./product";
import type { Language, NeighborhoodId } from "./types";

const TMP_PATH = "/tmp/koofi-report.json";
const MAX_EVENTS = 400;
const NOTE_CAP = 280;
const RATE_WINDOW_MS = 120_000;
const CARD_PATH_RE = /^\/(?:en\/)?c\/[a-z0-9][a-z0-9-]{0,80}$/i;

export const REPORT_NOTE =
  "Private listing-error pile. Ajz reads these. Not public. Not a comments wall.";

export const REPORT_REASONS = Object.keys(copy.reportReasons) as Array<
  keyof typeof copy.reportReasons
>;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportEvent = {
  kind: "listing";
  at: string;
  shopId: string;
  nameEn: string;
  neighborhood: NeighborhoodId;
  locale: Language;
  path: string;
  reason: ReportReason;
  note?: string;
};

export type ReportFile = {
  note: string;
  reports: ReportEvent[];
};

export type ReportInput = {
  shopId?: unknown;
  nameEn?: unknown;
  neighborhood?: unknown;
  locale?: unknown;
  path?: unknown;
  reason?: unknown;
  note?: unknown;
};

export type ReportResult =
  | { ok: true }
  | { ok: false; error: "unknown_shop" | "invalid_reason" | "invalid_locale" };

const memory: ReportEvent[] = [];
const recent = new Map<string, number>();

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === "string" &&
    (REPORT_REASONS as readonly string[]).includes(value)
  );
}

export function reportLocale(value: unknown): Language | null {
  return value === "ar" || value === "en" ? value : null;
}

function trimNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const note = value.trim().slice(0, NOTE_CAP);
  return note || undefined;
}

function reportPath(value: unknown, shopId: string, locale: Language): string {
  if (typeof value === "string") {
    const path = value.trim();
    if (CARD_PATH_RE.test(path)) return path;
  }
  return cardPath(shopId, locale);
}

function readTmp(): ReportEvent[] {
  try {
    const parsed = JSON.parse(readFileSync(TMP_PATH, "utf8")) as ReportFile;
    return Array.isArray(parsed.reports) ? parsed.reports : [];
  } catch {
    return [];
  }
}

function writeTmp(reports: ReportEvent[]): void {
  try {
    const payload: ReportFile = { note: REPORT_NOTE, reports };
    writeFileSync(TMP_PATH, `${JSON.stringify(payload)}\n`);
  } catch {
    // /tmp may be missing; memory + Vercel logs still hold the row.
  }
}

function rateKey(shopId: string, reason: ReportReason): string {
  return `${shopId}:${reason}`;
}

function isRateLimited(shopId: string, reason: ReportReason, now: number): boolean {
  const key = rateKey(shopId, reason);
  const last = recent.get(key);
  if (last && now - last < RATE_WINDOW_MS) return true;
  const cutoff = new Date(now - RATE_WINDOW_MS).toISOString();
  return listReports().reports.some(
    (event) =>
      event.shopId === shopId && event.reason === reason && event.at >= cutoff,
  );
}

function append(event: ReportEvent): void {
  memory.push(event);
  if (memory.length > MAX_EVENTS) memory.splice(0, memory.length - MAX_EVENTS);
  const merged = listReports().reports;
  writeTmp(merged.slice(-MAX_EVENTS));
  console.log("koofi_report", JSON.stringify(event));
}

export function recordReport(input: ReportInput): ReportResult {
  try {
    const shopId = typeof input.shopId === "string" ? input.shopId.trim() : "";
    const shop = shopId ? getShop(shopId) : undefined;
    if (!shop) return { ok: false, error: "unknown_shop" };

    const reason = input.reason;
    if (!isReportReason(reason)) return { ok: false, error: "invalid_reason" };

    const locale = reportLocale(input.locale);
    if (!locale) return { ok: false, error: "invalid_locale" };

    const now = Date.now();
    if (isRateLimited(shop.id, reason, now)) {
      console.log(
        "koofi_report_skip",
        JSON.stringify({ miss: "rate_limit", shopId: shop.id, reason }),
      );
      return { ok: true };
    }

    const event: ReportEvent = {
      kind: "listing",
      at: new Date(now).toISOString(),
      shopId: shop.id,
      nameEn: shop.nameEn,
      neighborhood: shop.neighborhood,
      locale,
      path: reportPath(input.path, shop.id, locale),
      reason,
    };
    const note = trimNote(input.note);
    if (note) event.note = note;

    append(event);
    recent.set(rateKey(shop.id, reason), now);
    return { ok: true };
  } catch {
    console.log("koofi_report_skip", JSON.stringify({ miss: "log_failure" }));
    return { ok: true };
  }
}

export function listReports(): ReportFile {
  const seen = new Set<string>();
  const reports: ReportEvent[] = [];
  for (const event of [...readTmp(), ...memory]) {
    const key = `${event.at}:${event.shopId}:${event.reason}:${event.note ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reports.push(event);
  }
  reports.sort((a, b) => a.at.localeCompare(b.at));
  return { note: REPORT_NOTE, reports: reports.slice(-MAX_EVENTS) };
}
