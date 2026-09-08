/**
 * Env key contract. README, .env.example, and webhook code must use these
 * exact names. None are required for the three pick cards. DATABASE_URL is
 * only for the public /feedback board, directory-list upvotes, and owner claims.
 * BLOB_READ_WRITE_TOKEN is only for owner Passport photo upload (Vercel Blob).
 */
export const ENV_KEYS = {
  KOOFI_PUBLIC_URL: "KOOFI_PUBLIC_URL",
  WHATSAPP_VERIFY_TOKEN: "WHATSAPP_VERIFY_TOKEN",
  WHATSAPP_ACCESS_TOKEN: "WHATSAPP_ACCESS_TOKEN",
  WHATSAPP_PHONE_NUMBER_ID: "WHATSAPP_PHONE_NUMBER_ID",
  GOOGLE_PLACES_API_KEY: "GOOGLE_PLACES_API_KEY",
  GITHUB_TOKEN: "GITHUB_TOKEN",
  XAI_API_KEY: "XAI_API_KEY",
  LEARNING_READ_TOKEN: "LEARNING_READ_TOKEN",
  DATABASE_URL: "DATABASE_URL",
  CLAIM_ALERT_TO: "CLAIM_ALERT_TO",
  CLAIM_APPROVE_TOKEN: "CLAIM_APPROVE_TOKEN",
  BLOB_READ_WRITE_TOKEN: "BLOB_READ_WRITE_TOKEN",
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

export function readEnv(key: EnvKey): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}
