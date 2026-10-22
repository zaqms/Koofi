/**
 * Café back returns to the results the visitor came from.
 * Home search and بيننا snapshots restore after a document reload.
 * The in-app back control uses that history entry; a direct card keeps Home.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cafeCardPathname,
  clearHalfwayResultsSnapshots,
  nextCafeOrigin,
  parseCafeOrigin,
  parseResultsSnapshot,
  readResultsSnapshot,
  RESULTS_SNAPSHOT_KEY,
  RESULTS_SNAPSHOT_TTL_MS,
  resultsThreadRestorable,
  shouldPersistSnapshot,
  shouldRestoreResultsNavigation,
  shouldReturnInApp,
  writeResultsSnapshot,
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
}, savedAt);
assert(snapshot?.messages.length === 3, "snapshot keeps the ask and the picks");
assert(snapshot?.messages[2]?.picks?.[0]?.id === "woods-olaya", "snapshot keeps the café id");
assert(snapshot?.scrollY === 240, "snapshot keeps scroll");
assert(parseResultsSnapshot({ ...snapshot, messages: [opener] }, savedAt) === null, "opener snapshot is dropped");
assert(
  parseResultsSnapshot({
    entryKey: "bad",
    threadKey: "chat:ar:home",
    href: "/",
    messages: [{ id: "a", role: "assistant", text: "x", picks: [{ id: 1 }] }],
    composerLanguage: "ar",
    savedAt,
  }, savedAt)?.messages[0]?.picks === undefined,
  "a pick without a card path is dropped",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - RESULTS_SNAPSHOT_TTL_MS - 1000 }, savedAt) === null,
  "a snapshot older than 30 minutes is dropped",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - RESULTS_SNAPSHOT_TTL_MS + 1000 }, savedAt)?.entryKey === "search-1",
  "a snapshot inside 30 minutes is kept",
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
    cafePath: "/c/idmi-olaya",
    origin,
    previous: { key: "cafe-a", url: "http://localhost:3000/c/woods-olaya" },
    now: savedAt + 1000,
  }),
  "an in-app previous café steps back through the chain",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin,
    previous: { key: "other", url: "http://localhost:3000/coffee-shops/olaya" },
    now: savedAt + 1000,
  }),
  "an in-app district entry steps back to that list",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin: null,
    previous: null,
    now: savedAt + 1000,
  }) === false,
  "a direct card with no previous entry keeps the home fallback",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin,
    previous: { url: "https://news.example/story" },
    now: savedAt + 1000,
  }) === false,
  "an external previous entry does not leave the site",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin: null,
    previous: { url: "https://news.example/story" },
    now: savedAt + 1000,
  }) === false,
  "an external previous entry with no chain keeps the home fallback",
);
assert(
  shouldReturnInApp({
    cafePath: "/c/woods-olaya",
    origin: { entryKey: "", href: "/coffee-shops/olaya", cafePath: "/c/woods-olaya", trail: ["/c/woods-olaya"], scrollY: 0, listScroll: 0, ts: savedAt },
    previous: { url: "https://wain.lol/coffee-shops/olaya" },
    now: savedAt + 1000,
  }),
  "a district entry on wain.lol is in-app",
);

const second = nextCafeOrigin({
  existing: origin,
  currentPath: "/c/woods-olaya",
  destinationPath: "/c/idmi-olaya",
  entryKey: "cafe-page",
  href: "/c/woods-olaya",
  scrollY: 0,
  listScroll: 0,
  now: savedAt + 2000,
});
const third = nextCafeOrigin({
  existing: second,
  currentPath: "/c/idmi-olaya",
  destinationPath: "/c/drip-olaya",
  entryKey: "cafe-page-2",
  href: "/c/idmi-olaya",
  scrollY: 12,
  listScroll: 0,
  now: savedAt + 3000,
});
assert(third.entryKey === "search-1", "a café chain keeps the original results entry");
assert(third.scrollY === 240 && third.listScroll === 80, "a café chain keeps the results scroll");
assert(third.href === "/", "a café chain keeps the results URL");
assert(third.cafePath === "/c/drip-olaya", "the chain remembers the latest card");
assert(third.trail.includes("/c/woods-olaya") && third.trail.includes("/c/idmi-olaya"), "the chain remembers every card");

assert(shouldRestoreResultsNavigation({ navigationType: "reload" }) === false, "reload does not restore results");
assert(shouldRestoreResultsNavigation({ navigationType: "navigate" }) === false, "a fresh navigation does not restore results");
assert(shouldRestoreResultsNavigation({ navigationType: "back_forward" }), "browser back restores results");
assert(shouldRestoreResultsNavigation({ navigationType: "reload", traversed: true }), "an in-app back after load still restores");

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
assert(layout.includes("RESULTS_RESTORE_BOOTSTRAP"), "back/forward can hide the server paint until the snapshot restores");
assert(read("lib/results-return.ts").includes('nav.type!=="back_forward"'), "reload and fresh loads do not hide the page");
assert(read("app/globals.css").includes("data-results-pending"), "the pending results paint stays hidden");
assert(chat.includes("revealResultsRestore"), "chat reveals the page after restoring results");
assert(capture.includes("installCafeReturn"), "return capture listens for card clicks");
assert(capture.includes("restoreResultsScroll"), "return restores scroll");
assert(chat.includes("readResultsSnapshot"), "chat restores a results snapshot");
assert(chat.includes("writeResultsSnapshot"), "chat stores a results snapshot");
assert(chat.includes("shouldPersistSnapshot"), "home search is not stored on the bare homepage");
assert(chat.includes("resultsNavigationShouldRestore"), "chat restores only after back or forward");
assert(chat.includes("clearHalfwayResultsSnapshots"), "starting over clears the بيننا snapshot");
assert(chat.includes("clearResultsSnapshot"), "a new home search clears the stored ask");
assert(directory.includes("cardPath(shop.id, language)"), "list cards still link to the café");
assert(!read("lib/results-return.ts").includes("URLSearchParams"), "results return does not add a query string");

const inviteId = "AbcdEfghijkLmnopqrST12";
const hostPin = { lat: 24.713551, lng: 46.675292 };
const guestPin = { lat: 24.812345, lng: 46.619876 };
const storage = new Map<string, string>();
const previousWindow = globalThis.window;
globalThis.window = {
  sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  },
} as unknown as Window & typeof globalThis;
try {
  const now = savedAt;
  writeResultsSnapshot({
    entryKey: "half-1",
    threadKey: `halfway:${inviteId}`,
    href: `/h/${inviteId}`,
    scrollY: 400,
    listScroll: 120,
    cardCount: 6,
    composerLanguage: "ar",
    awaitingMaps: false,
    savedAt: now,
    messages: [
      { id: "q", role: "user", text: "قهوة في العليا" },
      {
        id: `halfway-picks-${inviteId}`,
        role: "assistant",
        text: "ثلاث قهاوي",
        language: "ar",
        halfwayMore: true,
        halfwayLocations: [
          { lat: hostPin.lat, lng: hostPin.lng },
          { lat: guestPin.lat, lng: guestPin.lng },
        ],
        picks: [
          {
            id: "woods-olaya",
            nameAr: "وودز",
            nameEn: "WOODS",
            neighborhood: "olaya",
            neighborhoodAr: "العليا",
            vibeTags: [],
            momentTags: [],
            mapsHref: `https://maps.google.com/?q=${hostPin.lat},${hostPin.lng}`,
            cardPath: "/c/woods-olaya",
            lat: hostPin.lat,
            lng: hostPin.lng,
          },
        ],
      },
    ] as ResultsMessage[],
  }, now);
  const raw = storage.get(RESULTS_SNAPSHOT_KEY) ?? "";
  assert(raw.includes("قهوة في العليا"), "the stored session keeps the ask text");
  assert(raw.includes("woods-olaya"), "the stored session keeps the café id");
  assert(!raw.includes(inviteId), "the stored session has no invite id");
  for (const pin of [hostPin, guestPin]) {
    for (const digits of [4, 5, 6]) {
      assert(!raw.includes(pin.lat.toFixed(digits)), `stored session has no lat ${pin.lat.toFixed(digits)}`);
      assert(!raw.includes(pin.lng.toFixed(digits)), `stored session has no lng ${pin.lng.toFixed(digits)}`);
    }
  }
  assert(!raw.includes("halfwayLocations"), "the stored session has no pin list");
  assert(!raw.includes("halfwayWaiting"), "the stored session has no waiting pin");
  const restored = readResultsSnapshot("half-1", `halfway:${inviteId}`, `/h/${inviteId}`, now);
  assert(restored?.messages[0]?.text === "قهوة في العليا", "reading the session restores the ask");
  assert(restored?.cardCount === 6, "reading the session keeps the card count for scroll");
  const stale = JSON.parse(raw) as { entries: Array<{ savedAt: number }> };
  stale.entries[0].savedAt = now - RESULTS_SNAPSHOT_TTL_MS - 1000;
  storage.set(RESULTS_SNAPSHOT_KEY, JSON.stringify(stale));
  assert(readResultsSnapshot("half-1", `halfway:${inviteId}`, `/h/${inviteId}`, now) === null, "a stored session older than 30 minutes is discarded");
  assert(!(storage.get(RESULTS_SNAPSHOT_KEY) ?? "").includes("woods-olaya"), "discarding a stale session removes it from storage");
  writeResultsSnapshot({
    entryKey: "half-2",
    threadKey: "halfway-local:ar",
    href: "/halfway",
    scrollY: 0,
    listScroll: 0,
    cardCount: 3,
    composerLanguage: "ar",
    awaitingMaps: false,
    savedAt: now,
    messages: [{ id: "q", role: "user", text: "بيننا" }],
  }, now);
  clearHalfwayResultsSnapshots();
  assert(!(storage.get(RESULTS_SNAPSHOT_KEY) ?? "").includes("بيننا"), "Start a new Halfway clears the stored results");
} finally {
  globalThis.window = previousWindow;
}

console.log("check-results-return: ok");
