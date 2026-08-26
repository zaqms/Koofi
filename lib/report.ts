import { getShop } from "./catalog";
import { copy } from "./copy";
import { ENV_KEYS, readEnv } from "./env";
import { cardPath } from "./product";
import type { Language, NeighborhoodId } from "./types";

const NOTE_CAP = 280;
const RATE_WINDOW_MS = 120_000;
const CARD_PATH_RE = /^\/(?:en\/)?c\/[a-z0-9][a-z0-9-]{0,80}$/i;
const REPORT_TO = "Ajzbot73@gmail.com";
const REPORT_FROM = "Koofi Reports <onboarding@resend.dev>";
const BLOB_API = "https://vercel.com/api/blob";
const BLOB_PREFIX = "koofi-reports/";
const BLOB_API_VERSION = "11";

export const REPORT_NOTE =
  "Private listing-error pile. Primary: email to Ajzbot73@gmail.com. Secondary: Vercel Blob when BLOB_READ_WRITE_TOKEN is set. Not public.";

export const REPORT_REASONS = Object.keys(copy.reportReasons) as Array<
  keyof typeof copy.reportReasons
>;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStore = "email" | "blob";

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
  | { ok: true; stored: ReportStore[] }
  | {
      ok: false;
      error:
        | "unknown_shop"
        | "invalid_reason"
        | "invalid_locale"
        | "persist_failed";
    };

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

function rateKey(shopId: string, reason: ReportReason): string {
  return `${shopId}:${reason}`;
}

function isRateLimited(shopId: string, reason: ReportReason, now: number): boolean {
  const last = recent.get(rateKey(shopId, reason));
  return Boolean(last && now - last < RATE_WINDOW_MS);
}

function reportBody(event: ReportEvent): string {
  return [
    "Koofi listing report",
    `shop id: ${event.shopId}`,
    `nameEn: ${event.nameEn}`,
    `neighborhood: ${event.neighborhood}`,
    `locale: ${event.locale}`,
    `path: ${event.path}`,
    `reason: ${event.reason}`,
    `note: ${event.note ?? ""}`,
    `time: ${event.at}`,
  ].join("\n");
}

function blobToken(): string | undefined {
  return readEnv(ENV_KEYS.BLOB_READ_WRITE_TOKEN);
}

function blobPath(event: ReportEvent): string {
  const stamp = event.at.replace(/[:.]/g, "-");
  return `${BLOB_PREFIX}${stamp}-${event.shopId}-${event.reason}.json`;
}

async function sendReportEmail(event: ReportEvent): Promise<boolean> {
  const key = readEnv(ENV_KEYS.RESEND_API_KEY);
  if (!key) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REPORT_FROM,
        to: [REPORT_TO],
        subject: `Koofi listing report: ${event.shopId} / ${event.reason}`,
        text: reportBody(event),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.log(
        "koofi_report_skip",
        JSON.stringify({ miss: "resend_http", status: response.status }),
      );
      return false;
    }
    return true;
  } catch {
    console.log(
      "koofi_report_skip",
      JSON.stringify({ miss: "resend_error" }),
    );
    return false;
  }
}

async function persistReportBlob(event: ReportEvent): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;
  try {
    const pathname = blobPath(event);
    const response = await fetch(
      `${BLOB_API}?pathname=${encodeURIComponent(pathname)}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-api-version": BLOB_API_VERSION,
          "x-content-type": "application/json",
          "x-add-random-suffix": "0",
          "x-access": "private",
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.log(
        "koofi_report_skip",
        JSON.stringify({ miss: "blob_http", status: response.status }),
      );
      return false;
    }
    return true;
  } catch {
    console.log("koofi_report_skip", JSON.stringify({ miss: "blob_error" }));
    return false;
  }
}

async function persistDurable(event: ReportEvent): Promise<ReportStore[]> {
  const stored: ReportStore[] = [];
  if (await sendReportEmail(event)) stored.push("email");
  if (await persistReportBlob(event)) stored.push("blob");
  return stored;
}

export async function recordReport(input: ReportInput): Promise<ReportResult> {
  const shopId = typeof input.shopId === "string" ? input.shopId.trim() : "";
  const shop = shopId ? getShop(shopId) : undefined;
  if (!shop) return { ok: false, error: "unknown_shop" };

  const note = trimNote(input.note);
  const reason = isReportReason(input.reason)
    ? input.reason
    : note
      ? "other"
      : null;
  if (!reason) return { ok: false, error: "invalid_reason" };

  const locale = reportLocale(input.locale);
  if (!locale) return { ok: false, error: "invalid_locale" };

  const now = Date.now();
  if (isRateLimited(shop.id, reason, now)) {
    console.log(
      "koofi_report_skip",
      JSON.stringify({ miss: "rate_limit", shopId: shop.id, reason }),
    );
    return { ok: true, stored: [] };
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
  if (note) event.note = note;

  try {
    const stored = await persistDurable(event);
    if (stored.length === 0) {
      console.log(
        "koofi_report_skip",
        JSON.stringify({ miss: "persist_failed", shopId: shop.id, reason }),
      );
      return { ok: false, error: "persist_failed" };
    }
    recent.set(rateKey(shop.id, reason), now);
    console.log("koofi_report", JSON.stringify({ ...event, stored }));
    return { ok: true, stored };
  } catch {
    console.log("koofi_report_skip", JSON.stringify({ miss: "persist_failed" }));
    return { ok: false, error: "persist_failed" };
  }
}

export async function listReports(): Promise<ReportFile> {
  const token = blobToken();
  if (!token) {
    return { note: REPORT_NOTE, reports: [] };
  }
  try {
    const listed = await fetch(
      `${BLOB_API}?prefix=${encodeURIComponent(BLOB_PREFIX)}&limit=100`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "x-api-version": BLOB_API_VERSION,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!listed.ok) return { note: REPORT_NOTE, reports: [] };
    const payload = (await listed.json()) as {
      blobs?: Array<{ url?: string }>;
    };
    const reports: ReportEvent[] = [];
    for (const blob of payload.blobs ?? []) {
      if (!blob.url) continue;
      const row = await fetch(blob.url, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!row.ok) continue;
      const event = (await row.json()) as ReportEvent;
      if (event?.kind === "listing" && event.shopId) reports.push(event);
    }
    reports.sort((a, b) => a.at.localeCompare(b.at));
    return { note: REPORT_NOTE, reports };
  } catch {
    return { note: REPORT_NOTE, reports: [] };
  }
}
