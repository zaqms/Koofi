import { readFileSync, writeFileSync } from "node:fs";
import { copy } from "./copy";
import { ENV_KEYS, readEnv } from "./env";
import {
  extractMapsUrl,
  isAllowedMapsHost,
  isMapsUrl,
  parseHttpUrl,
} from "./maps-url";
import { NEIGHBORHOODS } from "./neighborhoods";
import type { NeighborhoodId, ShopSuggestion } from "./types";

const TMP_PATH = "/tmp/koofi-pending.json";
const GITHUB_REPO = "zaqms/Koofi";
const MAX_REDIRECTS = 5;
const FETCH_LIMIT = 48_000;

export type PendingFile = {
  note: string;
  suggestions: ShopSuggestion[];
};

export const PENDING_NOTE =
  "Crowdsourced Maps suggestions. Not the live catalog. Amjad curates before anything is added.";

const memory: ShopSuggestion[] = [];

function guessNeighborhood(text: string): NeighborhoodId | undefined {
  const haystack = text.toLowerCase();
  for (const place of Object.values(NEIGHBORHOODS)) {
    if (
      place.aliases.some((alias) => haystack.includes(alias.toLowerCase()))
    ) {
      return place.id;
    }
  }
  return undefined;
}

function nameFromMapsLocation(url: string): string | undefined {
  const parsed = parseHttpUrl(url);
  if (!parsed) return undefined;
  const match = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " ")).trim() || undefined;
  } catch {
    return match[1].replace(/\+/g, " ").trim() || undefined;
  }
}

function titleFromHtml(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match?.[1]) return undefined;
  const cleaned = match[1]
    .replace(/\s*[-\u2013\u2014]\s*Google Maps.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /^google maps$/i.test(cleaned)) return undefined;
  return cleaned;
}

async function fetchMapsHop(url: string): Promise<Response> {
  return fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { Accept: "text/html" },
    signal: AbortSignal.timeout(8000),
  });
}

async function resolveMapsLink(mapsUrl: string): Promise<{
  resolvedName?: string;
  neighborhood?: NeighborhoodId;
  finalUrl: string;
}> {
  let current = mapsUrl;
  let resolvedName = nameFromMapsLocation(current);
  const seen = new Set<string>();

  for (let i = 0; i < MAX_REDIRECTS; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);

    const parsed = parseHttpUrl(current);
    if (!parsed || !isAllowedMapsHost(parsed.host)) break;

    let response: Response;
    try {
      response = await fetchMapsHop(current);
    } catch {
      break;
    }

    const location = response.headers.get("location");
    if (location) {
      try {
        const next = new URL(location, current).toString();
        const nextHost = new URL(next).host;
        if (!isAllowedMapsHost(nextHost)) break;
        current = next;
        resolvedName = nameFromMapsLocation(current) ?? resolvedName;
        continue;
      } catch {
        break;
      }
    }

    if (response.ok && !resolvedName) {
      const raw = await response.text();
      resolvedName = titleFromHtml(raw.slice(0, FETCH_LIMIT));
    }
    break;
  }

  const neighborhood = guessNeighborhood(
    `${resolvedName ?? ""} ${current}`,
  );

  return { resolvedName, neighborhood, finalUrl: current };
}

function readTmp(): ShopSuggestion[] {
  try {
    const raw = readFileSync(TMP_PATH, "utf8");
    const parsed = JSON.parse(raw) as PendingFile;
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  } catch {
    return [];
  }
}

function writeTmp(suggestions: ShopSuggestion[]): void {
  try {
    const payload: PendingFile = { note: PENDING_NOTE, suggestions };
    writeFileSync(TMP_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  } catch {
    // /tmp may be missing in some runtimes; memory still holds the row.
  }
}

async function openGithubIssue(suggestion: ShopSuggestion): Promise<void> {
  const token = readEnv(ENV_KEYS.GITHUB_TOKEN);
  if (!token) return;

  const name = suggestion.resolvedName ?? "unknown place";
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "koofi",
      },
      body: JSON.stringify({
        title: `Shop suggestion: ${name}`,
        body: [
          `mapsUrl: ${suggestion.mapsUrl}`,
          `resolvedName: ${suggestion.resolvedName ?? ""}`,
          `neighborhood: ${suggestion.neighborhood ?? ""}`,
          `createdAt: ${suggestion.createdAt}`,
          "",
          "Not in the live catalog.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    console.error("koofi_suggest_github_failed", response.status);
  }
}

export function bilingual(table: { ar: string; en: string }): string {
  return `${table.ar}\n${table.en}`;
}

export function listSuggestions(): PendingFile {
  const byId = new Map<string, ShopSuggestion>();
  for (const row of [...readTmp(), ...memory]) {
    byId.set(row.id, row);
  }
  return {
    note: PENDING_NOTE,
    suggestions: [...byId.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
  };
}

export async function recordSuggestion(raw: string): Promise<{
  ok: boolean;
  reason: "saved" | "bad_url";
  suggestion?: ShopSuggestion;
  reply: string;
}> {
  const mapsUrl = extractMapsUrl(raw);
  if (!mapsUrl || !isMapsUrl(mapsUrl)) {
    return { ok: false, reason: "bad_url", reply: bilingual(copy.suggestBad) };
  }

  const resolved = await resolveMapsLink(mapsUrl);
  const suggestion: ShopSuggestion = {
    id: crypto.randomUUID(),
    mapsUrl,
    resolvedName: resolved.resolvedName,
    neighborhood: resolved.neighborhood,
    createdAt: new Date().toISOString(),
  };

  memory.push(suggestion);
  writeTmp(listSuggestions().suggestions);
  console.log("koofi_suggest", JSON.stringify(suggestion));

  try {
    await openGithubIssue(suggestion);
  } catch (error) {
    console.error("koofi_suggest_github_error", error);
  }

  return {
    ok: true,
    reason: "saved",
    suggestion,
    reply: bilingual(copy.suggestThanks),
  };
}
