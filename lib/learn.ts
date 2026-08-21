import { timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { getShop } from "./catalog";
import { ENV_KEYS, readEnv } from "./env";
import { VIBE_CHIPS, vibeChipLabel } from "./product";
import type { Language } from "./types";

const TMP_PATH = "/tmp/koofi-learn.json";
const MAX_EVENTS = 400;
const SESSION_RE = /^[a-f0-9]{12}$/;

export const LEARN_NOTE =
  "Quiet first-party learning pile. Ask + three shop ids, and Maps taps. Not a ranker. Not public analytics.";

export type LearnAskEvent = {
  kind: "ask";
  at: string;
  session: string;
  landing: Language;
  via: "typed" | "chip";
  text: string;
  shopIds: string[];
};

export type LearnMapsEvent = {
  kind: "maps";
  at: string;
  session: string;
  shopId: string;
  pickIndex: number;
};

export type LearnEvent = LearnAskEvent | LearnMapsEvent;

export type LearnFile = {
  note: string;
  events: LearnEvent[];
};

const memory: LearnEvent[] = [];

export function isLearnSession(value: unknown): value is string {
  return typeof value === "string" && SESSION_RE.test(value);
}

export function landingLanguage(value: unknown): Language {
  return value === "en" ? "en" : "ar";
}

export function askVia(value: unknown, text: string, landing: Language): "typed" | "chip" {
  if (value === "chip" || value === "typed") return value;
  const chip = VIBE_CHIPS.some(
    (row) => vibeChipLabel(row, landing) === text,
  );
  return chip ? "chip" : "typed";
}

function knownShopIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const unique: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !getShop(id) || unique.includes(id)) continue;
    unique.push(id);
  }
  return unique;
}

function readTmp(): LearnEvent[] {
  try {
    const parsed = JSON.parse(readFileSync(TMP_PATH, "utf8")) as LearnFile;
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function writeTmp(events: LearnEvent[]): void {
  try {
    const payload: LearnFile = { note: LEARN_NOTE, events };
    writeFileSync(TMP_PATH, `${JSON.stringify(payload)}\n`);
  } catch {
    // /tmp may be missing; memory + Vercel logs still hold the row.
  }
}

function append(event: LearnEvent): void {
  memory.push(event);
  if (memory.length > MAX_EVENTS) memory.splice(0, memory.length - MAX_EVENTS);
  const merged = listLearnEvents().events;
  writeTmp(merged.slice(-MAX_EVENTS));
  console.log("koofi_learn", JSON.stringify(event));
}

export function recordLearnAsk(input: {
  text: string;
  landing: Language;
  via: unknown;
  session: unknown;
  shopIds: string[];
}): void {
  try {
    const text = input.text.trim();
    const shopIds = knownShopIds(input.shopIds);
    if (!text || shopIds.length !== 3) return;
    append({
      kind: "ask",
      at: new Date().toISOString(),
      session: isLearnSession(input.session) ? input.session : "anon",
      landing: input.landing,
      via: askVia(input.via, text, input.landing),
      text,
      shopIds,
    });
  } catch {
    // Logging must never break the chat.
  }
}

export function recordLearnMaps(input: {
  shopId: unknown;
  pickIndex: unknown;
  session: unknown;
}): boolean {
  try {
    const shopId = typeof input.shopId === "string" ? input.shopId : "";
    const pickIndex =
      typeof input.pickIndex === "number" ? input.pickIndex : Number(input.pickIndex);
    if (!getShop(shopId)) return false;
    if (!Number.isInteger(pickIndex) || pickIndex < 0 || pickIndex > 2) {
      return false;
    }
    append({
      kind: "maps",
      at: new Date().toISOString(),
      session: isLearnSession(input.session) ? input.session : "anon",
      shopId,
      pickIndex,
    });
    return true;
  } catch {
    return false;
  }
}

export function listLearnEvents(): LearnFile {
  const seen = new Set<string>();
  const events: LearnEvent[] = [];
  for (const event of [...readTmp(), ...memory]) {
    const key = `${event.kind}:${event.at}:${event.session}:${
      event.kind === "ask" ? event.shopIds.join(",") : `${event.shopId}:${event.pickIndex}`
    }`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(event);
  }
  events.sort((a, b) => a.at.localeCompare(b.at));
  return { note: LEARN_NOTE, events: events.slice(-MAX_EVENTS) };
}

export function canReadLearn(request: Request): boolean {
  const expected = readEnv(ENV_KEYS.LEARNING_READ_TOKEN);
  if (!expected) return false;
  const header = request.headers.get("authorization");
  const given = header?.startsWith("Bearer ")
    ? header.slice(7).trim()
    : request.headers.get("x-learning-token")?.trim();
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
