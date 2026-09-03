import { chatQueryParams, trackChatQuery } from "../lib/track";
import { LOCKED_OPENER, LOCKED_OPENER_EN } from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const en = chatQueryParams({
  text: "quiet work in Al Malqa",
  locale: "en",
  via: "typed",
});
assert(en, "English typed query must build params");
assert(en.query_text === "quiet work in Al Malqa", `EN text: ${en.query_text}`);
assert(en.locale === "en", "EN locale");
assert(en.via === "typed", "EN via is typed");
assert(en.text_length === "quiet work in Al Malqa".length, "EN text_length");

const ar = chatQueryParams({
  text: "  حطين شغل  ",
  locale: "ar",
  via: "typed",
});
assert(ar, "Arabic typed query must build params");
assert(ar.query_text === "حطين شغل", `AR text: ${ar.query_text}`);
assert(ar.locale === "ar", "AR locale");
assert(ar.via === "typed", "AR via is typed");

assert(chatQueryParams({ text: "", locale: "en" }) === null, "empty is not a query");
assert(chatQueryParams({ text: "   ", locale: "ar" }) === null, "whitespace is not a query");

const chipSubmitted = chatQueryParams({
  text: "Best for Work",
  locale: "en",
  via: "chip",
});
assert(chipSubmitted?.via === "chip", "chip label posted to chat is via=chip");
assert(chipSubmitted?.query_text === "Best for Work", "chip submit keeps the label");

type WindowStub = { dataLayer: Array<Record<string, unknown>> };
const previousWindow = (globalThis as { window?: unknown }).window;
const stub: WindowStub = { dataLayer: [] };
(globalThis as { window: WindowStub }).window = stub;

try {
  assert(
    trackChatQuery({ text: "quiet work in Al Malqa", locale: "en", via: "typed" }),
    "EN submit tracks",
  );
  assert(
    trackChatQuery({ text: "حطين شغل", locale: "ar", via: "typed" }),
    "AR submit tracks",
  );

  const queries = stub.dataLayer.filter((row) => row.event === "chat_query");
  assert(queries.length === 2, `expected 2 chat_query events, got ${queries.length}`);
  assert(queries[0]?.query_text === "quiet work in Al Malqa", "EN dataLayer text");
  assert(queries[0]?.locale === "en", "EN dataLayer locale");
  assert(queries[0]?.via === "typed", "EN dataLayer via");
  assert(queries[1]?.query_text === "حطين شغل", "AR dataLayer text");
  assert(queries[1]?.locale === "ar", "AR dataLayer locale");
  assert(!("reply" in (queries[0] ?? {})), "must not send reply text");
  assert(!("session" in (queries[0] ?? {})), "must not send session");

  const beforeRetry = stub.dataLayer.length;
  trackChatQuery({ text: "حطين شغل", locale: "ar", via: "typed" });
  assert(
    stub.dataLayer.length === beforeRetry,
    "same ask within 400ms must not duplicate",
  );

  assert(
    trackChatQuery({ text: "   ", locale: "en", via: "typed" }) === false,
    "whitespace submit does not track",
  );
  assert(
    stub.dataLayer.every((row) => row.query_text !== LOCKED_OPENER),
    "opener Arabic is not a chat_query",
  );
  assert(
    stub.dataLayer.every((row) => row.query_text !== LOCKED_OPENER_EN),
    "opener English is not a chat_query",
  );
} finally {
  if (previousWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window: unknown }).window = previousWindow;
  }
}

console.log("check-chat-query: ok");
