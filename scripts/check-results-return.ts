/**
 * Café back returns to the results the visitor came from.
 * Home search and بيننا snapshots restore after a document reload.
 * The in-app back control uses that history entry; a direct card keeps Home.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import {
  chatFreshMemoryThread,
  chatMayApplyHalfwayFetch,
  clearChatResultsForNewHalfway,
  clearChatResultsForNewSearch,
  commitChatResultsSave,
  decideChatResultsRestore,
  decideChatResultsSave,
} from "../components/chat";
import { getShop } from "../lib/catalog";
import {
  expiredHalfwayShouldClear,
  halfwayFetchKeepsLongerSnapshot,
  homeSearchShouldClear,
  startNewHalfwayShouldClear,
} from "../lib/chat-results-actions";
import { officialShopCoords, placeIdentityKeys } from "../lib/place-coords";
import {
  cafeCardPathname,
  catalogCoordsForPick,
  clearCafeReturnToken,
  markCafeReturn,
  nextCafeOrigin,
  parseCafeOrigin,
  parseResultsSnapshot,
  readCafeReturnToken,
  readResultsSnapshot,
  resetResultsScroll,
  RESULTS_RESTORE_BOOTSTRAP,
  RESULTS_SCROLL_HOLD_MS,
  RESULTS_SNAPSHOT_KEY,
  RESULTS_SNAPSHOT_TTL_MS,
  resultsEntryExpired,
  resultsPickCount,
  resultsSnapshotIsFresh,
  resultsThreadRestorable,
  shouldPersistSnapshot,
  shouldRestoreResultsNavigation,
  shouldReturnInApp,
  writeResultsSnapshot,
  type ResultsMessage,
  type ResultsSnapshot,
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
assert(RESULTS_SNAPSHOT_TTL_MS === 30 * 60 * 1000, "results expire at exactly 30 minutes");
assert(
  resultsSnapshotIsFresh(savedAt - RESULTS_SNAPSHOT_TTL_MS, savedAt),
  "a snapshot exactly 30 minutes old is kept",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - RESULTS_SNAPSHOT_TTL_MS }, savedAt)?.entryKey === "search-1",
  "parsing keeps a snapshot that is exactly 30 minutes old",
);
assert(
  !resultsSnapshotIsFresh(savedAt - 31 * 60 * 1000, savedAt),
  "31 minutes is past the expiry",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - 31 * 60 * 1000 }, savedAt) === null,
  "a snapshot 31 minutes old is dropped",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - 12 * 60 * 60 * 1000 }, savedAt) === null,
  "a snapshot 12 hours old is dropped",
);
assert(
  parseResultsSnapshot({ ...snapshot, savedAt: savedAt - RESULTS_SNAPSHOT_TTL_MS - 1 }, savedAt) === null,
  "one millisecond past 30 minutes is dropped",
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
assert(
  shouldRestoreResultsNavigation({ navigationType: "navigate", activationType: "traverse" }),
  "Navigation API traverse restores when performance says navigate",
);
assert(
  shouldRestoreResultsNavigation({
    navigationType: "navigate",
    entryKey: "search-1",
    returnToken: { entryKey: "search-1", ts: savedAt },
  }),
  "Back reported as navigate after a café reload still restores",
);
assert(
  shouldRestoreResultsNavigation({
    navigationType: "reload",
    activationType: "reload",
    entryKey: "search-1",
    returnToken: { entryKey: "search-1", ts: savedAt },
  }) === false,
  "reload does not restore even with a café return token",
);
assert(
  shouldRestoreResultsNavigation({
    navigationType: "navigate",
    entryKey: "other",
    returnToken: { entryKey: "search-1", ts: savedAt },
  }) === false,
  "a café return token does not restore a different history entry",
);

const detail = read("components/cafe-detail.tsx");
const cardPage = read("components/cafe-card-page.tsx");
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
assert(capture.includes("installCafeReturn"), "return capture listens for card clicks");
assert(capture.includes("restoreResultsScroll"), "return restores scroll");
assert(directory.includes("cardPath(shop.id, language)"), "list cards still link to the café");
assert(directory.includes("min-w-0 max-w-full"), "a listing card cannot grow past its row");
assert(directory.includes('className="min-w-0 break-words"'), "the English distance line wraps inside the card");
assert(!read("lib/results-return.ts").includes("URLSearchParams"), "results return does not add a query string");

const starbucksPlace =
  "https://www.google.com/maps/place/Starbucks+Panorama/data=!4m2!3m1!1s0x3e2ee2abc123:0x99abcdef";
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
          {
            id: "person-pin-place",
            nameAr: "وودز",
            nameEn: "WOODS",
            neighborhood: "olaya",
            neighborhoodAr: "العليا",
            vibeTags: [],
            momentTags: [],
            mapsHref: `https://www.google.com/maps/place/WOODS/data=!4m2!3m1!1s0x3e2f0385060a46a1:0x8aa4df79417558b1/@${hostPin.lat},${hostPin.lng},17z`,
            cardPath: "/c/person-pin-place",
          },
          {
            id: "starbucks-panorama-al-mathar",
            nameAr: "ستاربكس",
            nameEn: "Starbucks",
            neighborhood: "al-mathar",
            neighborhoodAr: "المعذر",
            vibeTags: [],
            momentTags: [],
            isChain: true,
            branchEn: "Panorama",
            mapsHref: starbucksPlace,
            cardPath: "/c/starbucks-panorama-al-mathar",
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
  assert(!raw.includes("Starbucks al-mathar Riyadh"), "the stored session does not invent a name search");
  assert(!raw.includes("q=Starbucks"), "the stored session does not search Maps by name");
  assert(raw.includes("1s0x3e2ee2abc123:0x99abcdef"), "the stored session keeps the café place id");
  const restored = readResultsSnapshot("half-1", `halfway:${inviteId}`, `/h/${inviteId}`, now);
  assert(restored?.messages[0]?.text === "قهوة في العليا", "reading the session restores the ask");
  assert(restored?.cardCount === 6, "reading the session keeps the card count for scroll");
  const chain = restored?.messages[1]?.picks?.find((pick) => pick.id === "starbucks-panorama-al-mathar");
  assert(chain?.mapsHref === starbucksPlace, "a restored chain card keeps its place link");
  const placeId = typeof chain?.placeId === "string" ? chain.placeId : "";
  assert(placeId.length > 0 && starbucksPlace.includes(placeId), "a restored chain card keeps its place id");
  assert(placeIdentityKeys(starbucksPlace).includes(placeId), "the kept place id is the Maps place identity");
  assert(chain?.isChain === true, "a restored chain card stays a chain");
  const poisoned = restored?.messages[1]?.picks?.find((pick) => pick.id === "person-pin-place");
  assert(!poisoned?.mapsHref, "a place link that embeds a person's pin is dropped");
  assert(!raw.includes(`@${hostPin.lat}`), "the stored session does not keep a person's pin inside a place link");
  const woods = restored?.messages[1]?.picks?.find((pick) => pick.id === "woods-olaya");
  const woodsShop = getShop("woods-olaya");
  const woodsCoords = woodsShop ? officialShopCoords(woodsShop) : null;
  assert(woodsCoords != null, "the catalog has a public pin for the restored café");
  assert(
    woods?.lat === woodsCoords?.lat && woods?.lng === woodsCoords?.lng,
    "reading the session rehydrates the café pin from the catalog",
  );
  assert(
    catalogCoordsForPick({ id: "woods-olaya", placeId: typeof woods?.placeId === "string" ? woods.placeId : "" })?.lat === woodsCoords?.lat,
    "catalog lookup by place id returns the café pin",
  );
  for (const digits of [4, 5, 6]) {
    assert(!raw.includes(woodsCoords.lat.toFixed(digits)), "the stored session does not keep the café lat");
    assert(!raw.includes(woodsCoords.lng.toFixed(digits)), "the stored session does not keep the café lng");
  }
  markCafeReturn("half-1", now);
  assert(readCafeReturnToken(now)?.entryKey === "half-1", "opening a café card stamps a return token");
  clearCafeReturnToken("half-1");
  assert(readCafeReturnToken(now) === null, "clearing that results entry drops the return token");
  assert(restored?.savedAt === now, "reading the session does not move savedAt");
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
  clearChatResultsForNewHalfway();
  assert(!(storage.get(RESULTS_SNAPSHOT_KEY) ?? "").includes("بيننا"), "Start a new Halfway clears the stored results");

  const pages: ResultsMessage[] = [0, 1, 2, 3].map((page) => ({
    id: `page-${page}`,
    role: "assistant" as const,
    text: "ثلاث",
    language: "ar" as const,
    halfwayMore: true,
    picks: [0, 1, 2].map((slot) => ({
      id: `cafe-${page}-${slot}`,
      nameAr: "قهوة",
      nameEn: "Cafe",
      neighborhood: "olaya",
      neighborhoodAr: "العليا",
      vibeTags: [],
      momentTags: [],
      isChain: true,
      mapsHref: starbucksPlace,
      cardPath: `/c/cafe-${page}-${slot}`,
    })),
  }));
  const twelve: ResultsSnapshot = {
    entryKey: "half-12",
    threadKey: "halfway-local:ar",
    href: "/halfway",
    scrollY: 198,
    listScroll: 0,
    cardCount: 12,
    composerLanguage: "ar",
    awaitingMaps: false,
    savedAt: now,
    messages: pages,
  };
  writeResultsSnapshot(twelve, now);
  const firstPage = [pages[0]!];
  const back = decideChatResultsRestore({
    shouldRestoreNavigation: shouldRestoreResultsNavigation({ navigationType: "back_forward" }),
    snapshot: readResultsSnapshot("half-12", "halfway-local:ar", "/halfway", now),
    memoryMessages: firstPage,
    memorySavedAt: now,
    entryExpired: false,
    persistable: true,
    now,
  });
  assert(back.holdSnapshot, "back/forward holds the saved بيننا list");
  assert(back.apply !== null && resultsPickCount(back.apply.messages) === 12, "back/forward restores all 12 cards, not the first page");
  assert(chatMayApplyHalfwayFetch(back.holdSnapshot) === false, "the invite re-fetch does not replace a restored list");
  for (const navigationType of ["reload", "navigate"] as const) {
    const skipped = decideChatResultsRestore({
      shouldRestoreNavigation: shouldRestoreResultsNavigation({ navigationType }),
      snapshot: twelve,
      memoryMessages: pages,
      memorySavedAt: now,
      entryExpired: false,
      persistable: true,
      now,
    });
    assert(skipped.apply === null && !skipped.holdSnapshot, `${navigationType} does not restore the saved list`);
    assert(skipped.scroll === "top", `${navigationType} with no restored snapshot starts at the top`);
  }
  for (const age of [31 * 60 * 1000, 12 * 60 * 60 * 1000]) {
    const staleDecision = decideChatResultsRestore({
      shouldRestoreNavigation: shouldRestoreResultsNavigation({ navigationType: "back_forward" }),
      snapshot: { ...twelve, savedAt: now - age },
      memoryMessages: pages,
      memorySavedAt: now - age,
      entryExpired: true,
      persistable: true,
      now,
    });
    assert(staleDecision.apply === null && staleDecision.dropMemory, `back after ${age}ms does not show the old list`);
    assert(staleDecision.scroll === "top" && !staleDecision.holdSnapshot, `back after ${age}ms starts at the top`);
  }
  const heldSave = decideChatResultsSave({
    held: true,
    current: firstPage,
    prior: twelve,
    now: now + 10 * 60 * 1000,
    scrollY: 0,
    listScroll: 0,
    cardCount: 3,
    entryKey: "half-12",
    threadKey: "halfway-local:ar",
    href: "/halfway",
    composerLanguage: "ar",
    awaitingMaps: false,
  });
  const unheldShrink = decideChatResultsSave({
    held: false,
    current: firstPage,
    prior: twelve,
    now: now + 10 * 60 * 1000,
    scrollY: 0,
    listScroll: 0,
    cardCount: 3,
    entryKey: "half-12",
    threadKey: "halfway-local:ar",
    href: "/halfway",
    composerLanguage: "ar",
    awaitingMaps: false,
  });
  assert(
    unheldShrink.action === "write" && resultsPickCount(unheldShrink.snapshot.messages) === 12,
    "a re-fetched first page does not overwrite a longer fresh snapshot",
  );
  assert(heldSave.action === "write" && resultsPickCount(heldSave.snapshot.messages) === 12, "saving during restore keeps the full list");
  assert(heldSave.action === "write" && heldSave.snapshot.savedAt === now, "saving during restore keeps the original savedAt");
  assert(heldSave.action === "write" && heldSave.snapshot.cardCount === 12, "saving during restore keeps the card count for scroll");
  commitChatResultsSave({
    held: true,
    current: firstPage,
    prior: readResultsSnapshot("half-12", "halfway-local:ar", "/halfway", now),
    now: now + 10 * 60 * 1000,
    scrollY: 0,
    listScroll: 0,
    cardCount: 3,
    entryKey: "half-12",
    threadKey: "halfway-local:ar",
    href: "/halfway",
    composerLanguage: "ar",
    awaitingMaps: false,
  });
  const afterRestoreWrite = readResultsSnapshot("half-12", "halfway-local:ar", "/halfway", now + 10 * 60 * 1000);
  assert(afterRestoreWrite?.savedAt === now, "a restore write does not restart the 30 minutes");
  assert(resultsPickCount(afterRestoreWrite?.messages ?? []) === 12, "a restore write does not shrink the list to the first page");
  writeResultsSnapshot({ ...twelve, savedAt: now + 20 * 60 * 1000, messages: firstPage, cardCount: 3 }, now + 20 * 60 * 1000);
  assert(readResultsSnapshot("half-12", "halfway-local:ar", "/halfway", now + 20 * 60 * 1000)?.savedAt === now, "writing again still keeps the original savedAt");
  assert(resultsEntryExpired("half-12", now + 31 * 60 * 1000), "the original savedAt is expired after 31 minutes");
  writeResultsSnapshot({ ...twelve, savedAt: now + 31 * 60 * 1000 }, now + 31 * 60 * 1000);
  assert(readResultsSnapshot("half-12", "halfway-local:ar", "/halfway", now + 31 * 60 * 1000) === null, "a restore after 31 minutes does not revive the list");
  assert(!(storage.get(RESULTS_SNAPSHOT_KEY) ?? "").includes("cafe-0-0"), "an expired list is not written back");
  writeResultsSnapshot({ ...twelve, entryKey: "half-12h", savedAt: now - 12 * 60 * 60 * 1000 }, now);
  assert(readResultsSnapshot("half-12h", "halfway-local:ar", "/halfway", now) === null, "a 12 hour old list is never stored");
  const openerOnly: ResultsMessage[] = [{ id: "opener", role: "assistant", text: "هلا" }];
  assert(
    decideChatResultsSave({
      held: false,
      current: openerOnly,
      prior: null,
      now,
      scrollY: 0,
      listScroll: 0,
      cardCount: 0,
      entryKey: "home-1",
      threadKey: "chat:ar:popular",
      href: "/",
      composerLanguage: "ar",
      awaitingMaps: false,
    }).action === "clear",
    "a fresh home clears a stored ask",
  );
  assert(
    decideChatResultsSave({
      held: true,
      current: openerOnly,
      prior: twelve,
      now,
      scrollY: 0,
      listScroll: 0,
      cardCount: 0,
      entryKey: "half-12",
      threadKey: "halfway-local:ar",
      href: "/halfway",
      composerLanguage: "ar",
      awaitingMaps: false,
    }).action === "skip",
    "the restore paint does not clear the saved list before it is applied",
  );
  writeResultsSnapshot({
    entryKey: "home-1",
    threadKey: "chat:ar:popular",
    href: "/",
    scrollY: 40,
    listScroll: 0,
    cardCount: 3,
    composerLanguage: "ar",
    awaitingMaps: false,
    savedAt: now,
    messages: [{ id: "q", role: "user", text: "قهوة في العليا" }],
  }, now);
  clearChatResultsForNewSearch("home-1");
  assert(readResultsSnapshot("home-1", "chat:ar:popular", "/", now) === null, "starting a new home search clears that saved ask");
  assert(chatFreshMemoryThread("no-such-thread") === undefined, "a missing thread is not restored");
  assert(chatMayApplyHalfwayFetch(false) === true, "a fetch can paint results when nothing was restored");
} finally {
  globalThis.window = previousWindow;
}

assert(startNewHalfwayShouldClear(), "Start new Halfway clears the saved list");
assert(!expiredHalfwayShouldClear(false, false), "a live بيننا session keeps its saved list");
assert(expiredHalfwayShouldClear(true, false), "an expired بيننا session clears the saved list");
assert(expiredHalfwayShouldClear(false, true), "an expired invite clears the saved list");
assert(expiredHalfwayShouldClear(true, true), "both expiry flags clear the saved list");
assert(homeSearchShouldClear(true), "a new ask on the home composer clears the saved search");
assert(!homeSearchShouldClear(false), "a directory page does not clear the saved search");
const keepNow = savedAt;
assert(
  halfwayFetchKeepsLongerSnapshot({
    saved: { savedAt: keepNow, pickCount: 12 },
    incomingPickCount: 3,
    now: keepNow,
  }),
  "a longer fresh snapshot wins over the invite's first page",
);
assert(
  !halfwayFetchKeepsLongerSnapshot({
    saved: { savedAt: keepNow, pickCount: 3 },
    incomingPickCount: 3,
    now: keepNow,
  }),
  "an equal first page can paint when nothing longer is saved",
);
assert(
  !halfwayFetchKeepsLongerSnapshot({
    saved: { savedAt: keepNow - 31 * 60 * 1000, pickCount: 12 },
    incomingPickCount: 3,
    now: keepNow,
  }),
  "an expired longer snapshot does not block a fresh invite response",
);
assert(
  !halfwayFetchKeepsLongerSnapshot({
    saved: null,
    incomingPickCount: 3,
    now: keepNow,
  }),
  "no saved list does not block the invite response",
);
for (const navigationType of ["reload", "navigate"] as const) {
  assert(
    decideChatResultsRestore({
      shouldRestoreNavigation: shouldRestoreResultsNavigation({ navigationType }),
      snapshot: null,
      memoryMessages: null,
      entryExpired: false,
      persistable: true,
      now: keepNow,
    }).apply === null,
    `the restore decision returns false for ${navigationType}`,
  );
}

const chatSource = read("components/chat.tsx");
const chatFile = ts.createSourceFile(
  "components/chat.tsx",
  chatSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

function nodeCalls(node: ts.Node, name: string): boolean {
  let hit = false;
  const visit = (current: ts.Node) => {
    if (hit) return;
    if (ts.isCallExpression(current)) {
      const expr = current.expression;
      const called = ts.isIdentifier(expr) ? expr.text : expr.getText(chatFile);
      if (called === name) hit = true;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return hit;
}

function nodeReferences(node: ts.Node, name: string): boolean {
  let hit = false;
  const visit = (current: ts.Node) => {
    if (hit) return;
    if (ts.isIdentifier(current) && current.text === name) hit = true;
    ts.forEachChild(current, visit);
  };
  visit(node);
  return hit;
}

function functionNamed(name: string): ts.FunctionDeclaration | ts.FunctionExpression {
  let found: ts.FunctionDeclaration | ts.FunctionExpression | undefined;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (
      (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
      node.name?.text === name
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(chatFile);
  assert(found, `chat.tsx defines ${name}`);
  return found;
}

function assertHandlerClears(handler: ts.Node, decision: string, clear: string, label: string) {
  assert(nodeCalls(handler, decision), `${label} asks ${decision}`);
  assert(nodeCalls(handler, clear), `${label} calls ${clear}`);
}

assertHandlerClears(
  functionNamed("startNewHalfway"),
  "startNewHalfwayShouldClear",
  "clearChatResultsForNewHalfway",
  "Start new Halfway",
);
assertHandlerClears(
  functionNamed("send"),
  "homeSearchShouldClear",
  "clearChatResultsForNewSearch",
  "a new home search",
);

let expiryHandler: ts.Node | undefined;
const findExpiry = (node: ts.Node) => {
  if (ts.isCallExpression(node) && node.expression.getText(chatFile) === "useEffect") {
    const callback = node.arguments[0];
    if (
      callback &&
      nodeReferences(callback, "sessionExpired") &&
      nodeReferences(callback, "halfwayInviteExpired") &&
      !nodeReferences(callback, "selectedChipId")
    ) {
      assert(!expiryHandler, "one invite-expiry handler clears the saved list");
      expiryHandler = callback;
    }
  }
  ts.forEachChild(node, findExpiry);
};
findExpiry(chatFile);
assert(expiryHandler, "the invite-expiry handler exists");
assertHandlerClears(
  expiryHandler,
  "expiredHalfwayShouldClear",
  "clearChatResultsForNewHalfway",
  "invite expiry",
);

let restoreUsesNavigation = false;
const findRestore = (node: ts.Node) => {
  if (ts.isCallExpression(node) && node.expression.getText(chatFile) === "decideChatResultsRestore") {
    const arg = node.arguments[0];
    assert(arg && ts.isObjectLiteralExpression(arg), "the restore decision takes the navigation result");
    const prop = arg.properties.find(
      (item) => ts.isPropertyAssignment(item) && item.name.getText(chatFile) === "shouldRestoreNavigation",
    );
    assert(prop && ts.isPropertyAssignment(prop), "the restore decision receives shouldRestoreNavigation");
    const init = prop.initializer;
    restoreUsesNavigation =
      ts.isCallExpression(init) && init.expression.getText(chatFile) === "resultsNavigationShouldRestore";
  }
  ts.forEachChild(node, findRestore);
};
findRestore(chatFile);
assert(restoreUsesNavigation, "reload and a fresh visit do not force the saved list back");

const overlay = functionNamed("loadOverlay");
let overlayKeepsLonger = false;
const findKeep = (node: ts.Node) => {
  if (
    ts.isIfStatement(node) &&
    ts.isCallExpression(node.expression) &&
    node.expression.expression.getText(chatFile) === "halfwayFetchKeepsLongerSnapshot"
  ) {
    overlayKeepsLonger = true;
  }
  ts.forEachChild(node, findKeep);
};
findKeep(overlay);
assert(overlayKeepsLonger, "the invite re-fetch does not paint over a longer saved list");

const chatProps = new Set<string>();
const visitProps = (node: ts.Node) => {
  if (ts.isPropertyAccessExpression(node)) chatProps.add(node.getText(chatFile));
  ts.forEachChild(node, visitProps);
};
visitProps(chatFile);
assert(chatProps.has("decision.apply"), "the results screen applies a restored list");
assert(chatProps.has("decision.holdSnapshot"), "the results screen holds a restored list against a later fetch");
assert(chatProps.has("decision.dropMemory"), "the results screen drops an expired in-memory list");
assert(nodeCalls(chatFile, "decideChatResultsRestore"), "the results screen calls decideChatResultsRestore");
assert(nodeCalls(chatFile, "commitChatResultsSave"), "the results screen calls commitChatResultsSave");
assert(nodeCalls(chatFile, "chatMayApplyHalfwayFetch"), "the results screen calls chatMayApplyHalfwayFetch");
assert(nodeCalls(chatFile, "resetResultsScroll"), "the results screen calls resetResultsScroll");
assert(
  chatSource.includes("if (searchScreen || showHalfwayResults) return;"),
  "the auto-scroll guard matches the بيننا show-more line",
);
assert(RESULTS_SCROLL_HOLD_MS === 900, "the scroll hold matches the reset window");
assert(
  RESULTS_RESTORE_BOOTSTRAP.includes('nav.type!=="back_forward"'),
  "reload and fresh loads do not hide the page",
);
assert(
  RESULTS_RESTORE_BOOTSTRAP.includes('history.scrollRestoration="auto"'),
  "the bootstrap gives scroll restoration back",
);
assert(
  RESULTS_RESTORE_BOOTSTRAP.includes('removeEventListener("pageshow",top)'),
  "the bootstrap does not keep forcing the top after the hold",
);
assert(
  RESULTS_RESTORE_BOOTSTRAP.includes(`setTimeout(release,${RESULTS_SCROLL_HOLD_MS})`),
  "the bootstrap releases scroll restoration when the hold ends",
);

type ScrollMode = "auto" | "manual";

/** A fresh read. Direct comparisons get narrowed and then reject the later value. */
function currentMode(mode: string): ScrollMode {
  return mode === "manual" ? "manual" : "auto";
}

function installScrollHarness(initialPath: string) {
  const listeners = new Map<string, Set<(event?: { persisted?: boolean }) => void>>();
  const timeouts: { id: number; at: number; fn: () => void }[] = [];
  const rafs: Array<() => void> = [];
  let nextId = 1;
  let now = 0;
  let pathname = initialPath;
  let mode: ScrollMode = "auto";
  let scrolls = 0;
  const add = (type: string, fn: (event?: { persisted?: boolean }) => void) => {
    const set = listeners.get(type) ?? new Set();
    set.add(fn);
    listeners.set(type, set);
  };
  const remove = (type: string, fn: (event?: { persisted?: boolean }) => void) => {
    listeners.get(type)?.delete(fn);
  };
  const history = {
    get scrollRestoration() {
      return mode;
    },
    set scrollRestoration(value: ScrollMode) {
      mode = value;
    },
    state: null as unknown,
    pushState(_data: unknown, _unused: string, url?: string | URL | null) {
      if (url) pathname = new URL(String(url), "http://localhost").pathname;
    },
    replaceState(_data: unknown, _unused: string, url?: string | URL | null) {
      if (url) pathname = new URL(String(url), "http://localhost").pathname;
    },
  };
  const windowMock = {
    location: {
      get pathname() {
        return pathname;
      },
      search: "",
    },
    history,
    scrollTo() {
      scrolls += 1;
    },
    addEventListener: add,
    removeEventListener: remove,
    setTimeout(fn: () => void, delay = 0) {
      const id = nextId++;
      timeouts.push({ id, at: now + delay, fn });
      return id;
    },
    clearTimeout(id: number) {
      const index = timeouts.findIndex((timer) => timer.id === id);
      if (index >= 0) timeouts.splice(index, 1);
    },
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    HTMLElement: globalThis.HTMLElement,
  };
  globalThis.HTMLElement = class HTMLElement {} as unknown as typeof globalThis.HTMLElement;
  globalThis.window = windowMock as unknown as Window & typeof globalThis;
  globalThis.document = {
    documentElement: { scrollTop: 0 },
    body: { scrollTop: 0 },
    querySelector() {
      return null;
    },
  } as unknown as Document;
  globalThis.requestAnimationFrame = ((fn: FrameRequestCallback) => {
    rafs.push(() => fn(now));
    return rafs.length;
  }) as typeof requestAnimationFrame;
  return {
    get mode(): ScrollMode {
      return mode;
    },
    get scrolls() {
      return scrolls;
    },
    get pathname() {
      return pathname;
    },
    set pathname(value: string) {
      pathname = value;
    },
    history,
    flushRaf(limit = 12) {
      let steps = 0;
      while (rafs.length > 0 && steps < limit) {
        const batch = rafs.splice(0, rafs.length);
        for (const fn of batch) fn();
        steps += 1;
      }
    },
    runUntil(ms: number) {
      now = ms;
      const due = timeouts.filter((timer) => timer.at <= ms).sort((a, b) => a.at - b.at);
      for (const timer of due) {
        const index = timeouts.indexOf(timer);
        if (index < 0) continue;
        timeouts.splice(index, 1);
        timer.fn();
      }
    },
    fire(type: string) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn();
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
    restore() {
      globalThis.window = previous.window;
      globalThis.document = previous.document;
      globalThis.requestAnimationFrame = previous.requestAnimationFrame;
      globalThis.HTMLElement = previous.HTMLElement;
    },
  };
}

{
  const harness = installScrollHarness("/en/h/qa-invite");
  try {
    resetResultsScroll();
    assert(currentMode(harness.mode) === "manual", "a fresh invite hold pauses browser scroll restoration");
    harness.flushRaf(4);
    assert(currentMode(harness.mode) === "manual", "the hold stays manual while the invite page is current");
    harness.pathname = "/en/coffee-shops/nearby";
    harness.flushRaf(8);
    assert(currentMode(harness.mode) === "auto", "leaving the invite route gives scroll restoration back");
  } finally {
    harness.restore();
  }
}

{
  const harness = installScrollHarness("/en/h/qa-invite");
  try {
    resetResultsScroll();
    harness.runUntil(RESULTS_SCROLL_HOLD_MS);
    assert(currentMode(harness.mode) === "auto", "the invite scroll hold ends by restoring auto");
    const scrolls = harness.scrolls;
    harness.fire("pageshow");
    assert(harness.scrolls === scrolls, "a later pageshow does not force the top after the hold");
    assert(currentMode(harness.mode) === "auto", "scroll restoration stays auto after the hold");
  } finally {
    harness.restore();
  }
}

{
  const harness = installScrollHarness("/en");
  try {
    resetResultsScroll();
    harness.history.pushState({}, "", "/en/coffee-shops/most-popular");
    assert(currentMode(harness.mode) === "auto", "a history push off the results page releases the hold");
  } finally {
    harness.restore();
  }
}

function runBootstrap(input: {
  path: string;
  navType: string;
  state: unknown;
  storage?: Map<string, string>;
}) {
  const listeners = new Map<string, Set<(event?: { persisted?: boolean }) => void>>();
  const timeouts: { id: number; at: number; fn: () => void }[] = [];
  const rafs: Array<() => void> = [];
  let nextId = 1;
  let now = 0;
  let mode: ScrollMode = "auto";
  let scrolls = 0;
  const attributes = new Map<string, string>();
  const storage = input.storage ?? new Map<string, string>();
  const sandbox = {
    Date,
    JSON,
    console,
    location: { pathname: input.path },
    history: {
      get scrollRestoration() {
        return mode;
      },
      set scrollRestoration(value: ScrollMode) {
        mode = value;
      },
      state: input.state,
      pushState(_data: unknown, _unused: string, url?: string) {
        if (url) sandbox.location.pathname = new URL(url, "http://localhost").pathname;
      },
      replaceState(_data: unknown, _unused: string, url?: string) {
        if (url) sandbox.location.pathname = new URL(url, "http://localhost").pathname;
      },
    },
    document: {
      documentElement: {
        setAttribute(name: string, value: string) {
          attributes.set(name, value);
        },
      },
    },
    performance: {
      getEntriesByType() {
        return [{ type: input.navType }];
      },
    },
    sessionStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
    },
    window: {
      navigation: undefined as { activation?: { navigationType?: string }; currentEntry?: { key?: string } } | undefined,
      addEventListener(type: string, fn: (event?: { persisted?: boolean }) => void) {
        const set = listeners.get(type) ?? new Set();
        set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener(type: string, fn: (event?: { persisted?: boolean }) => void) {
        listeners.get(type)?.delete(fn);
      },
      scrollTo() {
        scrolls += 1;
      },
    },
    requestAnimationFrame(fn: () => void) {
      rafs.push(fn);
      return rafs.length;
    },
    setTimeout(fn: () => void, delay = 0) {
      const id = nextId++;
      timeouts.push({ id, at: now + delay, fn });
      return id;
    },
    clearTimeout(id: number) {
      const index = timeouts.findIndex((timer) => timer.id === id);
      if (index >= 0) timeouts.splice(index, 1);
    },
  };
  vm.runInNewContext(RESULTS_RESTORE_BOOTSTRAP, sandbox);
  return {
    get mode(): ScrollMode {
      return mode;
    },
    get scrolls() {
      return scrolls;
    },
    location: sandbox.location,
    history: sandbox.history,
    pending: () => attributes.has("data-results-pending"),
    flushRaf(limit = 12) {
      let steps = 0;
      while (rafs.length > 0 && steps < limit) {
        const batch = rafs.splice(0, rafs.length);
        for (const fn of batch) fn();
        steps += 1;
      }
    },
    runUntil(ms: number) {
      const due = timeouts.filter((timer) => timer.at <= ms).sort((a, b) => a.at - b.at);
      now = ms;
      for (const timer of due) {
        const index = timeouts.indexOf(timer);
        if (index < 0) continue;
        timeouts.splice(index, 1);
        timer.fn();
      }
    },
    fire(type: string, event?: { persisted?: boolean }) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn(event);
    },
    pageshowCount() {
      return listeners.get("pageshow")?.size ?? 0;
    },
  };
}

{
  const freshInvite = runBootstrap({
    path: "/en/h/qa-invite",
    navType: "navigate",
    state: null,
  });
  assert(currentMode(freshInvite.mode) === "auto", "a fresh invite load does not leave scroll restoration manual");
}

{
  const storage = new Map<string, string>();
  storage.set(
    RESULTS_SNAPSHOT_KEY,
    JSON.stringify({ entries: [{ entryKey: "k1", savedAt: Date.now() - 31 * 60 * 1000 }] }),
  );
  const expired = runBootstrap({
    path: "/en",
    navType: "back_forward",
    state: { wainSearch: true, wainEntry: "k1" },
    storage,
  });
  assert(currentMode(expired.mode) === "manual", "expired back holds scroll restoration while the top is applied");
  assert(expired.scrolls > 0, "expired back scrolls to the top");
  expired.runUntil(RESULTS_SCROLL_HOLD_MS);
  assert(currentMode(expired.mode) === "auto", "expired back restores auto after the hold");
  const scrolls = expired.scrolls;
  expired.fire("pageshow", { persisted: false });
  assert(expired.scrolls === scrolls, "expired back does not keep a pageshow listener that forces the top");
  assert(expired.pageshowCount() === 1, "the traversal pageshow listener stays, the scroll one does not");
}

{
  const storage = new Map<string, string>();
  storage.set(
    RESULTS_SNAPSHOT_KEY,
    JSON.stringify({ entries: [{ entryKey: "k1", savedAt: Date.now() - 31 * 60 * 1000 }] }),
  );
  const leaving = runBootstrap({
    path: "/en",
    navType: "back_forward",
    state: { wainSearch: true, wainEntry: "k1" },
    storage,
  });
  assert(currentMode(leaving.mode) === "manual", "expired back starts manual");
  leaving.location.pathname = "/en/coffee-shops/trending";
  leaving.flushRaf(8);
  assert(currentMode(leaving.mode) === "auto", "leaving the expired results route releases scroll restoration");
}

{
  const storage = new Map<string, string>();
  storage.set(
    RESULTS_SNAPSHOT_KEY,
    JSON.stringify({ entries: [{ entryKey: "k1", savedAt: Date.now() }] }),
  );
  const fresh = runBootstrap({
    path: "/en",
    navType: "back_forward",
    state: { wainSearch: true, wainEntry: "k1" },
    storage,
  });
  assert(currentMode(fresh.mode) === "manual", "a fresh snapshot holds scroll restoration until the list is applied");
  assert(fresh.pending(), "a fresh snapshot hides the server paint");
  fresh.runUntil(RESULTS_SCROLL_HOLD_MS);
  assert(currentMode(fresh.mode) === "auto", "a fresh snapshot gives scroll restoration back after the hold");
}

console.log("check-results-return: ok");
