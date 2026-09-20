/**
 * Shared results-feedback master lock.
 * Soft Places stays parked. Latin brand is wain.lol — never ween.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { copy } from "../lib/copy";
import { resultsFeedbackPreset } from "../lib/results-feedback-presets";
import {
  meetHalfwayFeedbackParams,
  resultsFeedbackParams,
} from "../lib/track";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const master = read("components/results-feedback.tsx");
const halfwayWrap = read("components/meet-halfway-feedback.tsx");
const footer = read("components/meet-halfway-results-footer.tsx");
const chat = read("components/chat.tsx");
const directory = read("components/shop-directory.tsx");
const detail = read("components/cafe-detail.tsx");
const neighborhoods = read("components/neighborhoods-page.tsx");
const reveal = read("components/results-feedback-reveal.tsx");
const track = read("lib/track.ts");
const copySrc = read("lib/copy.ts");

assert(halfwayWrap.includes("ResultsFeedbackBlock"), "Halfway imports the master");
assert(halfwayWrap.includes('preset="halfway"'), "Halfway uses the halfway preset");
assert(footer.includes("MeetHalfwayFeedback"), "Halfway footer still mounts feedback");
assert(
  master.includes('className="rounded-2xl border border-line bg-foam px-3 py-3"'),
  "cream/beige card + radius + padding stay the Halfway chrome",
);
assert(master.includes("bg-vote/40"), "Yes stays the green pill");
assert(master.includes("bg-blush/70"), "No stays the blush pill");
assert(master.includes("rounded-full border border-line bg-paper"), "chips stay the Halfway pills");
assert(master.includes("👍") && master.includes("👎"), "thumb emoji stay");
assert(!master.includes("rtl:scale-x") && !master.includes("rtl:rotate"), "do not mirror thumbs");
assert(!master.includes("modal") && !master.includes("dialog"), "inline only — no modal");
assert(
  master.includes('dir={language === "ar" ? "rtl" : "ltr"}'),
  "master is true RTL on AR",
);
assert(master.includes("text-start"), "copy aligns to the start edge");
assert(master.includes("meet_halfway_feedback"), "event name stays meet_halfway_feedback");
assert(master.includes("resultsFeedbackParams"), "payload goes through resultsFeedbackParams");
assert(master.includes("awaitingNote"), "Something else stays in the tell-more flow");
assert(
  master.includes("completeNote") &&
    master.includes("data-feedback-note-done") &&
    master.includes('event.key !== "Enter"'),
  "optional text commits on Done, Enter, or blur",
);
assert(
  master.includes("awaitingNote ? null : reason ? thanksNo : null"),
  "Thanks does not paint over an open Tell us more field",
);
assert(copy.resultsFeedbackDone.en === "Done" && copy.resultsFeedbackDone.ar === "تم", "Done / تم");

assert(chat.includes("ResultsFeedbackBlock"), "chat mounts the master");
assert(chat.includes('preset="chat"') || chat.includes('"chat"'), "chat_results preset");
assert(chat.includes('preset="search"') || chat.includes('"search"'), "typed ask is search");
assert(chat.includes('preset="zero"') || chat.includes('"zero"'), "empty catalog is zero_results");
assert(chat.includes("lastCompletedResultIndex"), "one block after the completed group");
assert(chat.includes("!busy"), "not while streaming");

assert(directory.includes("ResultsFeedbackBlock"), "category pages mount the master");
assert(directory.includes("ResultsFeedbackReveal"), "category uses the not-aggressive reveal");
assert(directory.includes("isStaticDirectoryChip"), "only static category lists + popular/district");

assert(detail.includes("ResultsFeedbackBlock"), "cafe detail mounts the master");
assert(detail.includes('preset="cafe"'), "cafe_detail preset");

assert(neighborhoods.includes("ResultsFeedbackReveal"), "neighborhoods search uses reveal");
assert(neighborhoods.includes("searched"), "search feedback only after a typed query");

assert(
  reveal.includes("RESULTS_FEEDBACK_REVEAL_MS = 6000") &&
    reveal.includes("RESULTS_FEEDBACK_REVEAL_SCROLL_PX = 160"),
  "reveal is 6s or scroll past ~160px / pointer",
);

assert(copy.meetHalfwayFeedbackTitle.ar === "هل النتائج كانت مناسبة؟", "Halfway AR title stays locked");
assert(copy.meetHalfwayFeedbackYes.ar === "نعم", "Halfway AR Yes stays نعم");
assert(copy.meetHalfwayFeedbackVibe.ar === "مو جوي", "Halfway AR vibe stays مو جوي");
assert(copy.resultsFeedbackTitle.ar === "هل ناسبتك هذي النتائج؟", "shared AR title");
assert(copy.resultsFeedbackYes.ar === "إيه", "shared AR Yes is إيه");
assert(copy.resultsFeedbackVibe.ar === "مو على جوّي", "shared AR vibe");
assert(copy.resultsFeedbackCafeTitle.ar === "معلومات المقهى صحيحة؟", "cafe AR title");
assert(copy.resultsFeedbackCafeNo.ar === "فيه شيء غلط", "cafe AR no");
assert(copy.resultsFeedbackCafeThanks.ar === "شكراً — بنراجعها.", "cafe AR thanks");
assert(copy.resultsFeedbackZeroTitle.en === "Couldn't find what you need?", "zero EN title");
assert(copy.resultsFeedbackSearchTitle.en === "Did these results match what you were looking for?", "search EN title");

const chatPreset = resultsFeedbackPreset("chat", "en");
assert(chatPreset.source === "chat_results", "chat source");
assert(
  chatPreset.reasons.map((row) => row.id).join(",") ===
    "too_far,vibe,not_relevant,more_options,other",
  "chat reason ids",
);
const searchPreset = resultsFeedbackPreset("search", "en");
assert(
  searchPreset.reasons.map((row) => row.id).join(",") ===
    "too_far,not_relevant,vibe,more_options,other",
  "search reason ids",
);
const categoryPreset = resultsFeedbackPreset("category", "en");
assert(
  categoryPreset.reasons.map((row) => row.id).join(",") ===
    "too_far,not_expected,more_options,other",
  "category reason ids",
);
const cafePreset = resultsFeedbackPreset("cafe", "en");
assert(
  cafePreset.reasons.map((row) => row.id).join(",") ===
    "location,hours,seating,category,photos,other",
  "cafe reason ids",
);
const zeroPreset = resultsFeedbackPreset("zero", "ar");
assert(zeroPreset.source === "zero_results", "zero source");
assert(zeroPreset.title === copy.resultsFeedbackZeroTitle.ar, "zero AR title");

const halfwayYes = meetHalfwayFeedbackParams({
  locale: "en",
  feedback: "yes",
  source: "host",
  count: 3,
  packId: "session-token",
});
assert(halfwayYes.source === "host", "Halfway GA source stays host/guest/local");
assert(halfwayYes.feedback_source === "halfway_results", "additive feedback_source");
assert(halfwayYes.feature === "halfway", "feature=halfway");
assert(halfwayYes.language === "en", "language alias of locale");

const chatNo = resultsFeedbackParams({
  locale: "ar",
  feedback: "no",
  feedback_reason: "not_relevant",
  source: "chat_results",
  feature: "chat",
  shopIds: ["camel-step-hittin", "cafu-olaya"],
  queryText: "قهوة شغل",
});
assert(chatNo.source === "chat_results", "non-Halfway source is the placement");
assert(chatNo.feedback_source === "chat_results", "feedback_source matches");
assert(chatNo.shop_ids === "camel-step-hittin,cafu-olaya", "shop ids");
assert(chatNo.query_text === "قهوة شغل", "query context");
assert(typeof chatNo.timestamp === "string", "timestamp");
const otherNote = resultsFeedbackParams({
  locale: "en",
  feedback: "no",
  feedback_reason: "other",
  feedback_text: "Nothing exciting",
  source: "cafe_detail",
  feature: "cafe_detail",
  shopId: "camel-step-hittin",
});
assert(otherNote.feedback === "no" && otherNote.reason === "other", "other reason");
assert(otherNote.feedback_text === "Nothing exciting", "free-text rides the same event");
assert(otherNote.feedback_note == null, "primary other+text is not a note-only follow-up");
assert(
  !master.includes("fetch(") && !master.includes("/api/"),
  "free-text is not POSTed to a backend",
);

assert(track.includes("feedback_source?: ResultsFeedbackSource"), "track exports feedback_source");
assert(!/\bween\b/i.test(copySrc), "copy never romanizes وين as ween");
assert(!/\bween\b/i.test(master) && !/\bween\b/i.test(chat), "UI never says ween");
assert(!/Soft Places/i.test(master), "Soft Places parked on master");
assert(!/Soft Places/i.test(chat), "Soft Places parked on chat wire");
assert(copy.resultsFeedbackSub.ar.includes("وين"), "AR confirm names وين");
assert(!/\bween\b/i.test(copy.resultsFeedbackSub.ar), "AR confirm does not say ween");

console.log("check-results-feedback: ok");
