/**
 * Café back returns to the results the visitor came from.
 * Home search and بيننا snapshots restore after a document reload.
 * The in-app back control uses that history entry; a direct card keeps Home.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cafeCardPathname,
  parseCafeOrigin,
  parseResultsSnapshot,
  resultsThreadRestorable,
  shouldPersistSnapshot,
  shouldReturnInApp,
  type ResultsMessage,
} from "../lib/results-return";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(cafeCardPathname("/c/woods-olaya") === "/c/woods-olaya", "AR card path");
assert(cafeCardPathname("/en/c/woods-olaya") === "/en/c/woods-olaya", "EN card path");
assert(cafeCardPathname("/c/woods-olaya?from=wa") === "/c/woods-olaya", "card query is not part of the path");
assert(cafeCardPathname("/en/c/woods-olaya/") === "/en/c/woods-olaya", "trailing slash still a card");
assert(cafeCardPathname("/c/woods-olaya/opengraph-image") === null, "OG image is not a card");
assert(cafeCardPathname("/c/woods-olaya/tonight") === null, "tonight mint is not a card");
assert(cafeCardPathname("/coffee-shops/olaya") === null, "district is not a card");
assert(cafeCardPathname("https://wain.lol/en/c/woods-olaya") === "/en/c/woods-olaya", "absolute card URL");
assert(cafeCardPathname("javascript:alert(1)") === null, "script URL is not a card");

assert(shouldPersistSnapshot("/", { wainSearch: true }), "home search entry is persisted");
assert(!shouldPersistSnapshot("/", null), "bare home is not persisted");
assert(!shouldPersistSnapshot("/en", { wainSearch: false }), "EN home without the flag is not persisted");
assert(shouldPersistSnapshot("/en", { wainSearch: true }), "EN search entry is persisted");
assert(shouldPersistSnapshot("/halfway", null), "بيننا landing is persisted");
assert(shouldPersistSnapshot("/en/halfway", null), "EN بيننا landing is persisted");
assert(shouldPersistSnapshot("/h/abc123", null), "invite session is persisted");
assert(shouldPersistSnapshot("/en/h/abc123", null), "EN invite session is persisted");
assert(!shouldPersistSnapshot("/coffee-shops/olaya", { wainSearch: true }), "district list is the URL, not a snapshot");
assert(!shouldPersistSnapshot("/en/coffee-shops/most-popular", null), "fixed list is the URL, not a snapshot");

const opener: ResultsMessage = { id: "opener", role: "assistant", text: "هلا", language: "ar" };
assert(!resultsThreadRestorable([opener]), "opener alone is not a result");

const searchMessages: ResultsMessage[] = [
  opener,
  { id: "q", role: "user", text: "قهوة في العليا" },
  {
    id: "a",
    role: "assistant",
    language: "ar",
    text: "ثلاث قهاوي",
    picks: [
      {
        id: "woods-olaya",
        nameAr: "وودز",
        nameEn: "WOODS",
        neighborhood: "olaya",
        neighborhoodAr: "العليا",
        vibeTags: [],
        momentTags: [],
        mapsHref: "https://maps.example/woods",
        cardPath: "/c/woods-olaya",
      },
    ],
    resultVia: "typed",
  },
];
assert(resultsThreadRestorable(searchMessages), "search thread is restorable");

const savedAt = Date.parse("2026-10-22T12:00:00Z");
const snapshot = parseResultsSnapshot({
  entryKey: "search-1",
  threadKey: "chat:ar:home",
  href: "/",
  scrollY: 240,
  listScroll: 0,
  messages: searchMessages,
  composerLanguage: "ar",
  awaitingMaps: false,
  halfwayWaitingId: null,
  halfwayWaitingMe: null,
  savedAt,
});
assert(snapshot?.messages.length === 3, "snapshot keeps the ask and the picks");
assert(snapshot?.messages[2]?.picks?.[0]?.id === "woods-olaya", "snapshot keeps the café id");
assert(snapshot?.scrollY === 240, "snapshot keeps scroll");
assert(parseResultsSnapshot({ ...snapshot, messages: [opener] }) === null, "opener snapshot is dropped");
assert(
  parseResultsSnapshot({
    entryKey: "bad",
    threadKey: "chat:ar:home",
    href: "/",
    messages: [{ id: "a", role: "assistant", text: "x", picks: [{ id: 1 }] }],
    composerLanguage: "ar",
    savedAt,
  })?.messages[0]?.picks === undefined,
  "a pick without a card path is dropped",
);

const origin = parseCafeOrigin(
  {
    entryKey: "search-1",
    href: "/",
    cafePath: "/c/woods-olaya",
    scrollY: 240,
    listScroll: 80,
    ts: savedAt,
  },
  savedAt + 1000,
);
assert(origin?.cafePath === "/c/woods-olaya", "origin keeps the card");
assert(origin?.listScroll === 80, "origin keeps the بيننا list scroll");
assert(
  parseCafeOrigin(
    { entryKey: "search-1", href: "/", cafePath: "/c/woods-olaya", ts: savedAt },
    savedAt + 13 * 60 * 60 * 1000,
  ) === null,
  "a stale origin is dropped",
);

assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin,
    previous: { key: "search-1", url: "http://localhost:3000/" },
    now: savedAt + 1000,
  }),
  "back returns when the previous entry is the results entry",
);
assert(
  shouldReturnInApp({
    cafePath: "/en/c/woods-olaya",
    origin: origin ? { ...origin, cafePath: "/en/c/woods-olaya" } : null,
    previous: { key: "search-en", url: "http://localhost:3000/en" },
    now: savedAt + 1000,
  }) === false,
  "EN card does not consume an AR results entry key",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin,
    previous: { key: "other", url: "http://localhost:3000/coffee-shops/olaya" },
    now: savedAt + 1000,
  }) === false,
  "a different history entry does not hijack back",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin,
    previous: null,
    now: savedAt + 1000,
  }) === false,
  "a direct card with no previous entry keeps the home fallback",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/idmi-olaya",
    origin,
    previous: { key: "search-1", url: "http://localhost:3000/" },
    now: savedAt + 1000,
  }) === false,
  "a different card does not use this origin",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin: { entryKey: "", href: "/coffee-shops/olaya", cafePath: "/c/woods-olaya", scrollY: 0, listScroll: 0, ts: savedAt },
    previous: { url: "https://wain.lol/coffee-shops/olaya" },
    now: savedAt + 1000,
  }),
  "without an entry key, the previous URL can still match the district",
);

const detail = read("components/cafe-detail.tsx");
const cardPage = read("components/cafe-card-page.tsx");
const chat = read("components/chat.tsx");
const layout = read("app/layout.tsx");
const capture = read("components/cafe-return.tsx");
const directory = read("components/directory-card.tsx");

assert(detail.includes("onClick={onCafeBackClick}"), "card back asks the results helper first");
assert(detail.includes("href={backHref}"), "card back keeps a real href for direct visits");
assert(cardPage.includes("backHref={home}"), "direct visits still fall back to home");
assert(layout.includes("<CafeReturn"), "café links are remembered from the root layout");
assert(layout.includes("RESULTS_RESTORE_BOOTSTRAP"), "a reload hides the server paint until the snapshot restores");
assert(read("app/globals.css").includes("data-results-pending"), "the pending results paint stays hidden");
assert(chat.includes("revealResultsRestore"), "chat reveals the page after restoring results");
assert(capture.includes("installCafeReturn"), "return capture listens for card clicks");
assert(capture.includes("restoreResultsScroll"), "return restores scroll");
assert(chat.includes("readResultsSnapshot"), "chat restores a results snapshot");
assert(chat.includes("writeResultsSnapshot"), "chat stores a results snapshot");
assert(chat.includes("shouldPersistSnapshot"), "home search is not stored on the bare homepage");
assert(directory.includes("cardPath(shop.id, language)"), "list cards still link to the café");
assert(!read("lib/results-return.ts").includes("URLSearchParams"), "results return does not add a query string");

console.log("check-results-return: ok");
