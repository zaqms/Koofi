/**
 * Café back returns to the results the visitor came from.
 * Home search and بيننا snapshots restore after a document reload.
 * The in-app back control uses that history entry; a direct card keeps Home.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

const chatSource = read("components/chat.tsx");
const chatFile = ts.createSourceFile(
  "components/chat.tsx",
  chatSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const chatCalls = new Set<string>();
const chatProps = new Set<string>();
const visitChat = (node: ts.Node) => {
  if (ts.isCallExpression(node)) chatCalls.add(node.expression.getText(chatFile));
  if (ts.isPropertyAccessExpression(node)) chatProps.add(node.getText(chatFile));
  ts.forEachChild(node, visitChat);
};
visitChat(chatFile);
for (const name of [
  "decideChatResultsRestore",
  "commitChatResultsSave",
  "clearChatResultsForNewSearch",
  "clearChatResultsForNewHalfway",
  "chatMayApplyHalfwayFetch",
  "resetResultsScroll",
] as const) {
  assert(chatCalls.has(name), `the results screen calls ${name}`);
}
assert(chatProps.has("decision.apply"), "the results screen applies a restored list");
assert(chatProps.has("decision.holdSnapshot"), "the results screen holds a restored list against a later fetch");
assert(chatProps.has("decision.dropMemory"), "the results screen drops an expired in-memory list");
assert(
  chatSource.includes("if (searchScreen || showHalfwayResults) return;"),
  "the auto-scroll guard matches the بيننا show-more line",
);
assert(
  chatSource.includes("resultsPickCount(savedList.messages) > picks.length"),
  "the invite re-fetch does not paint over a longer saved list",
);

console.log("check-results-return: ok");
