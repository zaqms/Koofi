export const IDEA_MAX_CHARS = 180;

export type FeedbackIdea = {
  id: number;
  body: string;
  votes: number;
  createdAt: string;
};

export type FeedbackError =
  | "empty"
  | "too_long"
  | "rate_limited"
  | "no_storage"
  | "already_voted"
  | "not_found";

export type FeedbackSnapshot = {
  ideas: FeedbackIdea[];
  votedIds: number[];
  storage: "ready" | "missing";
};

export function sanitizeIdeaBody(
  raw: unknown,
): { ok: true; body: string } | { ok: false; error: "empty" | "too_long" } {
  if (typeof raw !== "string") return { ok: false, error: "empty" };
  let text = raw.normalize("NFC");
  text = text.replace(/<[^>]*>/g, " ");
  text = text.replace(/[\u0000-\u001F\u007F]/g, "");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, error: "empty" };
  if (text.length > IDEA_MAX_CHARS) return { ok: false, error: "too_long" };
  return { ok: true, body: text };
}
