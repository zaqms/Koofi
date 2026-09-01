import { sanitizeIdeaBody } from "../lib/feedback-types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(sanitizeIdeaBody("").ok === false, "empty string is rejected");
assert(sanitizeIdeaBody("   ").ok === false, "whitespace-only is rejected");
assert(sanitizeIdeaBody("<b>hi</b>").ok === true, "tags are stripped, not rejected");
const stripped = sanitizeIdeaBody("<b>جلسة برا</b>");
assert(stripped.ok && stripped.body === "جلسة برا", `tags left residue: ${JSON.stringify(stripped)}`);

const long = "ق".repeat(181);
const tooLong = sanitizeIdeaBody(long);
assert(tooLong.ok === false && tooLong.error === "too_long", "181 chars is too long");

const ok = sanitizeIdeaBody("  قهاوي مفتوحة بعد ١٢  ");
assert(ok.ok && ok.body === "قهاوي مفتوحة بعد ١٢", "trim + collapse");

assert(
  sanitizeIdeaBody("حي الملقا أكثر").ok,
  "real Arabic one-liners must pass",
);

console.log("check-feedback: ok");
