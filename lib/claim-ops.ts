import { timingSafeEqual } from "node:crypto";
import { ENV_KEYS, readEnv } from "./env";

export const CLAIM_APPROVE_COOKIE = "wain_claim_ops";
export const CLAIM_APPROVE_HEADER = "x-claim-approve-token";
export const CLAIM_APPROVE_COOKIE_MAX_AGE = 12 * 60 * 60;

export function approveTokenConfigured(): boolean {
  return Boolean(readEnv(ENV_KEYS.CLAIM_APPROVE_TOKEN));
}

export function tokenEquals(given: string | undefined): boolean {
  const expected = readEnv(ENV_KEYS.CLAIM_APPROVE_TOKEN);
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function readCookieValue(
  header: string | null,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export function readApproveToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const custom = request.headers.get(CLAIM_APPROVE_HEADER)?.trim();
  if (custom) return custom;
  return readCookieValue(request.headers.get("cookie"), CLAIM_APPROVE_COOKIE);
}

/** Fail closed. Missing or wrong token is the same as not found. */
export function canApproveClaims(request: Request): boolean {
  return tokenEquals(readApproveToken(request));
}

export function approveCookieHeader(token: string, maxAgeSec = CLAIM_APPROVE_COOKIE_MAX_AGE): string {
  const parts = [
    `${CLAIM_APPROVE_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearApproveCookieHeader(): string {
  const parts = [
    `${CLAIM_APPROVE_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}
