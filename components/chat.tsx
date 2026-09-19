"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AddShopButton } from "@/components/add-shop-button";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MeetHalfwayPicker } from "@/components/meet-halfway-picker";
import { MeetHalfwayResultCards } from "@/components/meet-halfway-result-cards";
import { MeetHalfwayResultsFooter } from "@/components/meet-halfway-results-footer";
import { PickList, type ChatPick } from "@/components/pick-list";
import {
  formatHalfwayLocationLine,
  pinFromHalfwayInput,
} from "@/lib/halfway-place";
import { pinsMidpoint } from "@/lib/halfway-results-payload";
import { HomeHero } from "@/components/home-hero";
import { MeetHalfwayCard } from "@/components/meet-halfway-card";
import { VibeChips, type ChipPick } from "@/components/vibe-chips";
import type { ChipOpenRestore } from "@/lib/chip-open";
import { BrandHomeLink } from "@/components/brand-home-link";
import { useBeenIds } from "@/lib/been";
import { copy } from "@/lib/copy";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
} from "@/lib/directory-category";
import { readLearnSession } from "@/lib/learn-session";
import {
  decodeHalfwayInviteId,
  encodeHalfwayInviteId,
  guestPinFromLocations,
  halfwayInviteHasGuest,
  halfwayInvitePath,
  halfwayInviteSharePath,
  halfwayInviteShareText,
  halfwayResultsShareText,
} from "@/lib/halfway-invite";
import {
  clearHalfwayWaiting,
  consumeHalfwayFresh,
  markHalfwayFresh,
  readHalfwayWaiting,
  writeHalfwayWaiting,
} from "@/lib/halfway-waiting";
import {
  halfwayPinFailCopy,
  halfwayResultsFooterKind,
  meetHalfwayAskLabel,
  type HalfwayPinInput,
} from "@/lib/meet-halfway";
import { nearbyChatPicks } from "@/lib/nearby";
import {
  MEET_HALFWAY_CHIP,
  NEARBY_CHIP,
  VIBE_CHIPS,
  districtPath,
  homePath,
  isOffHomeChipId,
  isStaticDirectoryChip,
  vibeChipLabel,
} from "@/lib/product";
import { copyShareText, sharePackPacket } from "@/lib/share-pack";
import {
  meetHalfwayResultsParams,
  trackChatQuery,
  trackDistrictMatch,
  trackEvent,
  type MeetHalfwayResultSource,
  type MeetHalfwayStartSource,
} from "@/lib/track";
import {
  requestVisitorLocation,
  useVisitorLocation,
} from "@/lib/visitor-location";
import type { DistrictMatch, Language, Pin } from "@/lib/types";

export type ChatRestore = {
  packId: string;
  ask: string;
  picks: ChatPick[];
  language: Language;
};

export type HalfwayInviteRestore = {
  id: string;
  locations: HalfwayPinInput[];
  language: Language;
  shopIds?: string[];
  picks?: ChatPick[];
  halfwayMore?: boolean;
  joined?: boolean;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  language: Language;
  text: string;
  picks?: ChatPick[];
  thinCatalog?: boolean;
  districtMatch?: DistrictMatch;
  halfwayMore?: boolean;
  halfwayLocations?: HalfwayPinInput[];
  halfwayPaged?: boolean;
  halfwayJoined?: boolean;
};

type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

type Message = AssistantMessage | UserMessage;

type ChatResponse = {
  language: Language;
  reply: string;
  thinCatalog: boolean;
  picks: ChatPick[];
  awaitingMaps?: boolean;
  districtMatch?: DistrictMatch;
  halfwayMore?: boolean;
  halfwayError?: "bad_pin";
};

type PendingResult =
  | { ok: true; data: ChatResponse }
  | { ok: false; language: Language };

type PendingSend = {
  id: string;
  promise: Promise<PendingResult>;
  applied: boolean;
  halfway?: {
    locations: HalfwayPinInput[];
    more: boolean;
    joined?: boolean;
    source?: MeetHalfwayResultSource;
  };
};

function shownHalfwayPickIds(messages: readonly Message[]): string[] {
  const ids: string[] = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    if (typeof message.halfwayMore !== "boolean") continue;
    for (const pick of message.picks ?? []) {
      if (pick.id) ids.push(pick.id);
    }
  }
  return ids;
}

function sessionHostWait(
  halfwayInvite?: HalfwayInviteRestore,
): ReturnType<typeof readHalfwayWaiting> {
  const saved = readHalfwayWaiting();
  if (!saved) return null;
  if (halfwayInvite && saved.id !== halfwayInvite.id) return null;
  if (!decodeHalfwayInviteId(saved.id)) {
    clearHalfwayWaiting();
    return null;
  }
  return saved;
}

type HalfwayOverlayResponse = {
  locations?: HalfwayPinInput[];
  joined?: boolean;
  shop_ids?: string[];
  picks?: ChatPick[];
  halfwayMore?: boolean;
};

function overlayPins(rows: HalfwayPinInput[] | undefined): HalfwayPinInput[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(
    (row) =>
      typeof row.lat === "number" &&
      typeof row.lng === "number" &&
      Number.isFinite(row.lat) &&
      Number.isFinite(row.lng),
  );
}

function halfwayIdFromPath(): string | undefined {
  const match = window.location.pathname.match(/\/h\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function halfwayResultsMidpoint(
  rows: HalfwayPinInput[] | undefined,
): Pin | null {
  return pinsMidpoint((rows ?? []).map((row) => pinFromHalfwayInput(row)));
}

function trackMeetHalfwayResults(input: {
  locale: Language;
  source: MeetHalfwayResultSource;
  picks: ChatPick[];
  packId?: string;
  locations?: HalfwayPinInput[];
}): void {
  trackEvent(
    "meet_halfway_results",
    meetHalfwayResultsParams({
      locale: input.locale,
      source: input.source,
      picks: input.picks,
      packId: input.packId,
      midpoint: halfwayResultsMidpoint(input.locations),
    }),
    {
      dedupeKey: `meet_halfway_results:${input.source}:${input.picks
        .map((pick) => pick.id)
        .join(",")}`,
    },
  );
}

function trackHalfwayRestore(input: {
  id?: string;
  count: number;
  locale: Language;
  seenRef: { current: boolean };
}): void {
  if (input.seenRef.current) return;
  input.seenRef.current = true;
  trackEvent(
    "meet_halfway_restore",
    {
      locale: input.locale,
      count: input.count,
      source: "invite",
      ...(input.id ? { pack_id: input.id } : {}),
    },
    { dedupeKey: `meet_halfway_restore:${input.id ?? input.locale}` },
  );
}

function restoreHalfwayResultMessage(
  invite: HalfwayInviteRestore,
): AssistantMessage | null {
  if (!invite.picks?.length) return null;
  return {
    id: `halfway-picks-${invite.id}`,
    role: "assistant",
    language: invite.language,
    text: copy.meetHalfwayThree[invite.language],
    picks: invite.picks,
    halfwayMore: invite.halfwayMore !== false,
    halfwayLocations: invite.locations,
  };
}

function lastHalfwayResult(
  messages: readonly Message[],
): AssistantMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.role === "assistant" &&
      typeof message.halfwayMore === "boolean" &&
      (message.picks?.length ?? 0) > 0
    ) {
      return message;
    }
  }
  return null;
}

function lastHalfwayLocations(
  messages: readonly Message[],
): HalfwayPinInput[] | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.role === "assistant" &&
      message.halfwayLocations &&
      message.halfwayLocations.length >= 2
    ) {
      return message.halfwayLocations;
    }
  }
  return null;
}

function markLastHalfwayExhausted(
  messages: readonly Message[],
  locations?: HalfwayPinInput[],
): Message[] {
  const next = [...messages];
  for (let index = next.length - 1; index >= 0; index -= 1) {
    const message = next[index];
    if (
      message?.role === "assistant" &&
      typeof message.halfwayMore === "boolean"
    ) {
      next[index] = {
        ...message,
        halfwayMore: false,
        halfwayPaged: true,
        halfwayLocations: locations ?? message.halfwayLocations,
      };
      break;
    }
  }
  return next;
}

type LiveThread = {
  messages: Message[];
  composerLanguage: Language;
  awaitingMaps: boolean;
  halfwayWaitingId?: string | null;
  halfwayWaitingMe?: Pin;
};

type ChatProps = {
  landing: Language;
  restore?: ChatRestore;
  halfwayInvite?: HalfwayInviteRestore;
  halfwayInviteExpired?: boolean;
  localeHref?: string;
  selectedChipId?: string | null;
  /** Off-home share URLs serve three picks on the server. Not a home tile. */
  chipOpen?: ChipOpenRestore | null;
};

const threads: Partial<Record<string, LiveThread>> = {};
const pendingSends: Partial<Record<string, PendingSend>> = {};

function openerMessage(landing: Language): AssistantMessage {
  return {
    id: "opener",
    role: "assistant",
    language: landing,
    text: landing === "ar" ? copy.opener : copy.openerEn,
  };
}

function restoreMessages(restore: ChatRestore, landing: Language): Message[] {
  const messages: Message[] = [openerMessage(landing)];
  if (restore.ask.trim()) {
    messages.push({
      id: `pack-ask-${restore.packId}`,
      role: "user",
      text: restore.ask,
    });
  }
  messages.push({
    id: `pack-picks-${restore.packId}`,
    role: "assistant",
    language: restore.language,
    text: copy.threePicks[restore.language],
    picks: restore.picks,
  });
  return messages;
}

function chipOpenMessages(open: ChipOpenRestore, landing: Language): Message[] {
  return [
    openerMessage(landing),
    {
      id: `chip-ask-${open.chipId}`,
      role: "user",
      text: open.ask,
    },
    {
      id: `chip-picks-${open.chipId}`,
      role: "assistant",
      language: open.language,
      text: open.reply,
      picks: open.picks,
    },
  ];
}

function liveChipLabel(chipId: string, language: Language): string | null {
  if (chipId === NEARBY_CHIP.id) return vibeChipLabel(NEARBY_CHIP, language);
  if (chipId === MEET_HALFWAY_CHIP.id) {
    return vibeChipLabel(MEET_HALFWAY_CHIP, language);
  }
  const vibe = VIBE_CHIPS.find((chip) => chip.id === chipId);
  return vibe ? vibeChipLabel(vibe, language) : null;
}

function askBeforePicks(messages: Message[], index: number): string {
  for (let i = index - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "user") return message.text;
  }
  return "";
}

export function Chat({
  landing,
  restore,
  halfwayInvite,
  halfwayInviteExpired = false,
  localeHref,
  selectedChipId,
  chipOpen,
}: ChatProps) {
  const router = useRouter();
  // Home / directory / district must not inherit a leftover بيننا thread.
  // Results chrome is invited (`/h/{id}`) or local `/halfway` only.
  const threadKey = halfwayInvite
    ? `halfway:${halfwayInvite.id}`
    : restore
      ? `pack:${restore.packId}`
      : chipOpen
        ? `chip:${landing}:${chipOpen.chipId}`
        : selectedChipId === MEET_HALFWAY_CHIP.id
          ? `halfway-local:${landing}`
          : `chat:${landing}:${selectedChipId ?? "home"}`;
  const halfwaySurface =
    Boolean(halfwayInvite) || selectedChipId === MEET_HALFWAY_CHIP.id;
  const opener = landing === "ar" ? copy.opener : copy.openerEn;
  const [startFresh] = useState(() => consumeHalfwayFresh());
  const [sessionExpired, setSessionExpired] = useState(halfwayInviteExpired);
  const [messages, setMessages] = useState<Message[]>(() => {
    const restoredHalfway = halfwayInvite
      ? restoreHalfwayResultMessage(halfwayInvite)
      : null;
    return (
      threads[threadKey]?.messages ??
      (restoredHalfway
        ? [openerMessage(landing), restoredHalfway]
        : restore
          ? restoreMessages(restore, landing)
          : chipOpen?.picks.length
            ? chipOpenMessages(chipOpen, landing)
            : [openerMessage(landing)])
    );
  });
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState(
    () => pendingSends[threadKey]?.id ?? null,
  );
  const [busy, setBusy] = useState(() => Boolean(pendingSends[threadKey]));
  const been = useBeenIds();
  const [composerLanguage, setComposerLanguage] = useState<Language>(
    () => threads[threadKey]?.composerLanguage ?? landing,
  );
  const [awaitingMaps, setAwaitingMaps] = useState(
    () => threads[threadKey]?.awaitingMaps ?? false,
  );
  const [pickedChipId, setPickedChipId] = useState<string | null>(() => {
    if (halfwayInvite) return MEET_HALFWAY_CHIP.id;
    if (selectedChipId) return selectedChipId;
    if (
      halfwaySurface &&
      (threads[threadKey]?.halfwayWaitingId || sessionHostWait())
    ) {
      return MEET_HALFWAY_CHIP.id;
    }
    return null;
  });
  const [meetHalfwayOpen, setMeetHalfwayOpen] = useState(
    () =>
      startFresh ||
      (Boolean(halfwayInvite) && !halfwayInviteExpired) ||
      (halfwaySurface && Boolean(threads[threadKey]?.halfwayWaitingId)) ||
      (halfwaySurface && Boolean(sessionHostWait(halfwayInvite))) ||
      (selectedChipId === MEET_HALFWAY_CHIP.id && !halfwayInviteExpired),
  );
  const [halfwayWaitingId, setHalfwayWaitingId] = useState<string | null>(
    () => {
      if (halfwayInvite?.picks?.length) return null;
      if (!halfwaySurface) return null;
      return (
        threads[threadKey]?.halfwayWaitingId ??
        sessionHostWait(halfwayInvite)?.id ??
        null
      );
    },
  );
  const [halfwayWaitingMe, setHalfwayWaitingMe] = useState<Pin | null>(
    () =>
      halfwaySurface
        ? (threads[threadKey]?.halfwayWaitingMe ??
          sessionHostWait(halfwayInvite)?.me ??
          null)
        : null,
  );
  const [halfwayFriendPin, setHalfwayFriendPin] = useState<Pin | null>(null);
  const [halfwayJoined, setHalfwayJoined] = useState(
    () => Boolean(halfwayInvite?.joined || halfwayInvite?.picks?.length),
  );
  const [halfwayWaitingUi, setHalfwayWaitingUi] = useState(() => {
    if (!halfwaySurface) return false;
    if (halfwayInvite?.picks?.length || halfwayInviteExpired) return false;
    if (threads[threadKey]?.halfwayWaitingId) return true;
    return Boolean(sessionHostWait(halfwayInvite));
  });
  const [halfwayPinError, setHalfwayPinError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLFormElement>(null);
  const inFlightRef = useRef(Boolean(pendingSends[threadKey]));
  const halfwayLocationsRef = useRef<HalfwayPinInput[] | null>(
    pendingSends[threadKey]?.halfway?.locations ??
      lastHalfwayLocations(threads[threadKey]?.messages ?? []) ??
      null,
  );
  const halfwayShownRef = useRef<string[]>(
    shownHalfwayPickIds(threads[threadKey]?.messages ?? []),
  );
  const halfwayPageRef = useRef(1);
  const sendMeetHalfwayRef = useRef<
    (
      locations: HalfwayPinInput[],
      options?: {
        more?: boolean;
        reroll?: boolean;
        joined?: boolean;
        source?: MeetHalfwayResultSource;
      },
    ) => void
  >(() => undefined);
  const applyFrozenHalfwayRef = useRef<
    (input: {
      locations: HalfwayPinInput[];
      picks: ChatPick[];
      shopIds?: string[];
      halfwayMore?: boolean;
      reason?: "restore" | "live";
    }) => void
  >(() => undefined);
  const halfwayJoinSeenRef = useRef(false);
  const halfwayRestoreSeenRef = useRef(false);
  const routedChipOpenedRef = useRef<string | null>(
    chipOpen?.picks.length ? chipOpen.chipId : null,
  );
  const openRoutedChipRef = useRef<(chipId: string) => void>(() => undefined);
  useVisitorLocation({ auto: !halfwayInvite && !meetHalfwayOpen });

  useEffect(() => {
    if (!halfwayInvite) return;
    trackEvent(
      "meet_halfway_invite_open",
      { locale: landing, pack_id: halfwayInvite.id, source: "invite" },
      { dedupeKey: `meet_halfway_invite_open:${halfwayInvite.id}` },
    );
  }, [halfwayInvite, landing]);

  useEffect(() => {
    if (!sessionExpired) return;
    const packId = halfwayInvite?.id ?? halfwayIdFromPath();
    trackEvent(
      "meet_halfway_expired",
      {
        locale: landing,
        ...(packId ? { pack_id: packId } : {}),
      },
      { dedupeKey: `meet_halfway_expired:${packId ?? landing}` },
    );
  }, [sessionExpired, landing, halfwayInvite]);

  useEffect(() => {
    if (!halfwayInvite?.picks?.length) return;
    trackHalfwayRestore({
      id: halfwayInvite.id,
      count: halfwayInvite.picks.length,
      locale: landing,
      seenRef: halfwayRestoreSeenRef,
    });
  }, [halfwayInvite, landing]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousLang = html.lang;
    const previousDir = html.dir;
    html.lang = landing;
    html.dir = landing === "ar" ? "rtl" : "ltr";
    return () => {
      html.lang = previousLang;
      html.dir = previousDir;
    };
  }, [landing]);

  useEffect(() => {
    threads[threadKey] = {
      messages,
      composerLanguage,
      awaitingMaps,
      halfwayWaitingId,
      halfwayWaitingMe: halfwayWaitingMe ?? undefined,
    };
  }, [
    threadKey,
    messages,
    composerLanguage,
    awaitingMaps,
    halfwayWaitingId,
    halfwayWaitingMe,
  ]);

  useEffect(() => {
    if (!halfwayInvite || sessionExpired) return;
    let cancelled = false;

    async function loadOverlay() {
      if (!halfwayInvite) return;
      try {
        const response = await fetch(
          `/api/halfway/invite?id=${encodeURIComponent(halfwayInvite.id)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (response.status === 410) {
          setSessionExpired(true);
          setMeetHalfwayOpen(false);
          return;
        }
        if (!response.ok) return;
        const data = (await response.json()) as HalfwayOverlayResponse;
        const locations = overlayPins(data.locations);
        const picks = Array.isArray(data.picks) ? data.picks : [];
        const shopIds = Array.isArray(data.shop_ids) ? data.shop_ids : [];
        if (picks.length > 0) {
          applyFrozenHalfwayRef.current({
            locations,
            picks,
            shopIds,
            halfwayMore: data.halfwayMore,
            reason: "restore",
          });
          return;
        }
        if (locations.length >= 2) {
          sendMeetHalfwayRef.current(locations, { source: "invite" });
        }
      } catch {
        // Token seed still paints Invite / Waiting until overlay is reachable.
      }
    }

    void loadOverlay();
    return () => {
      cancelled = true;
    };
  }, [halfwayInvite, sessionExpired]);

  useEffect(() => {
    if (!halfwayWaitingId) return;
    let cancelled = false;
    let showTimer = 0;
    halfwayJoinSeenRef.current = false;

    async function tick() {
      if (
        !halfwayWaitingId ||
        cancelled ||
        inFlightRef.current ||
        halfwayJoinSeenRef.current
      ) {
        return;
      }
      try {
        const response = await fetch(
          `/api/halfway/invite?id=${encodeURIComponent(halfwayWaitingId)}`,
          { cache: "no-store" },
        );
        if (response.status === 410) {
          if (!cancelled) {
            setSessionExpired(true);
            setMeetHalfwayOpen(false);
          }
          return;
        }
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as HalfwayOverlayResponse;
        const locations = overlayPins(data.locations);
        const host = halfwayWaitingMe ? [halfwayWaitingMe] : [];
        const pins = locations.flatMap((row) => {
          if (
            typeof row.lat !== "number" ||
            typeof row.lng !== "number" ||
            !Number.isFinite(row.lat) ||
            !Number.isFinite(row.lng)
          ) {
            return [];
          }
          return [{ lat: row.lat, lng: row.lng }];
        });
        const picks = Array.isArray(data.picks) ? data.picks : [];
        const shopIds = Array.isArray(data.shop_ids) ? data.shop_ids : [];
        if (picks.length > 0) {
          applyFrozenHalfwayRef.current({
            locations,
            picks,
            shopIds,
            halfwayMore: data.halfwayMore,
            reason: "live",
          });
          setHalfwayWaitingId(null);
          return;
        }
        const joined =
          data.joined === true || halfwayInviteHasGuest(host, pins);
        if (!joined || cancelled) return;
        const friend = guestPinFromLocations(host, pins);
        halfwayJoinSeenRef.current = true;
        if (friend) setHalfwayFriendPin(friend);
        setHalfwayJoined(true);
        trackEvent(
          "meet_halfway_invite_joined",
          { locale: landing, pack_id: halfwayWaitingId, source: "invite" },
          { dedupeKey: `meet_halfway_invite_joined:${halfwayWaitingId}` },
        );
        showTimer = window.setTimeout(() => {
          sendMeetHalfwayRef.current(locations, {
            joined: true,
            source: "invite",
          });
        }, 700);
        setHalfwayWaitingId(null);
      } catch {
        // URL invite still works for the friend without this overlay.
      }
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 2500);

    function onVisible() {
      if (document.visibilityState === "visible") void tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (!halfwayJoinSeenRef.current) window.clearTimeout(showTimer);
    };
  }, [halfwayWaitingId, halfwayWaitingMe, landing]);

  useEffect(() => {
    const pending = pendingSends[threadKey];
    if (!pending) return;

    inFlightRef.current = true;
    let cancelled = false;

    void pending.promise.then((result) => {
      if (cancelled || pending.applied) return;
      pending.applied = true;
      if (pendingSends[threadKey] === pending) {
        delete pendingSends[threadKey];
      }
      inFlightRef.current = false;
      setBusy(false);
      setPendingId(null);

      if (result.ok) {
        const waitForMaps = Boolean(result.data.awaitingMaps);
        setComposerLanguage(result.data.language);
        setAwaitingMaps(waitForMaps);
        if (result.data.districtMatch) {
          trackDistrictMatch(result.data.districtMatch);
        }
        const halfway = pending.halfway;
        if (halfway) {
          halfwayLocationsRef.current = halfway.locations;
        }
        if (result.data.picks?.length) {
          halfwayShownRef.current = [
            ...halfwayShownRef.current,
            ...result.data.picks.map((pick) => pick.id),
          ];
        }
        if (result.data.halfwayError === "bad_pin") {
          setMeetHalfwayOpen(true);
          setHalfwayPinError(result.data.reply || null);
        } else if (typeof result.data.halfwayMore === "boolean") {
          setMeetHalfwayOpen(true);
          setHalfwayPinError(null);
        }
        if (typeof result.data.halfwayMore === "boolean") {
          const source =
            halfway?.source ?? (halfwayInvite ? "invite" : "local");
          if (result.data.picks.length > 0) {
            trackMeetHalfwayResults({
              locale: result.data.language,
              source,
              picks: result.data.picks,
              packId: halfwayInvite?.id ?? halfwayWaitingId ?? undefined,
              locations: halfway?.locations,
            });
          } else {
            trackEvent(
              "meet_halfway_empty",
              { locale: result.data.language, source },
              { dedupeKey: `meet_halfway_empty:${source}:${landing}` },
            );
          }
        }
        setMessages((current) => {
          const locations = halfway?.locations;
          const paged = Boolean(halfway?.more);
          const exhaustedAfterPage =
            paged &&
            typeof result.data.halfwayMore === "boolean" &&
            !result.data.halfwayMore &&
            !result.data.picks?.length;

          if (exhaustedAfterPage) {
            const withLastHalfway = markLastHalfwayExhausted(
              current,
              locations,
            );
            threads[threadKey] = {
              messages: withLastHalfway,
              composerLanguage: result.data.language,
              awaitingMaps: waitForMaps,
            };
            return withLastHalfway;
          }

          const next: Message[] = [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              language: result.data.language,
              text: result.data.reply,
              picks: result.data.picks,
              thinCatalog: result.data.thinCatalog,
              districtMatch: result.data.districtMatch,
              halfwayMore: result.data.halfwayMore,
              halfwayLocations: locations,
              halfwayPaged: paged || undefined,
              halfwayJoined: halfway?.joined || undefined,
            },
          ];
          threads[threadKey] = {
            messages: next,
            composerLanguage: result.data.language,
            awaitingMaps: waitForMaps,
          };
          return next;
        });
        return;
      }

      setMessages((current) => {
        const next: Message[] = [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            language: result.language,
            text: copy.error[result.language],
          },
        ];
        threads[threadKey] = {
          messages: next,
          composerLanguage: result.language,
          awaitingMaps: false,
        };
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [threadKey, pendingId]);

  useEffect(() => {
    const list = listRef.current;
    const footer = footerRef.current;
    if (!list) return;
    const el = list;

    function pinToEnd() {
      el.scrollTop = el.scrollHeight;
    }

    function nearEnd() {
      return el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    }

    pinToEnd();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (busy || nearEnd()) pinToEnd();
    });
    observer.observe(el);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, [messages, busy, meetHalfwayOpen]);

  function send(
    text: string,
    options?: { suggesting?: boolean; via?: "typed" | "chip" },
  ) {
    const trimmed = text.trim();
    if (!trimmed || inFlightRef.current) return;
    const suggesting = options?.suggesting ?? awaitingMaps;
    const via = options?.via ?? "typed";
    trackChatQuery({ text: trimmed, locale: landing, via });

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    inFlightRef.current = true;
    setDraft("");
    setAwaitingMaps(false);
    setBusy(true);
    setMessages((current) => {
      const next = [...current, userMessage];
      threads[threadKey] = {
        messages: next,
        composerLanguage,
        awaitingMaps: false,
      };
      return next;
    });

    const pending: PendingSend = {
      id: crypto.randomUUID(),
      applied: false,
      promise: (async (): Promise<PendingResult> => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: trimmed,
              beenIds: been.ids,
              suggesting,
              landing,
              via,
              session: readLearnSession(),
            }),
          });

          if (!response.ok) {
            throw new Error("chat_failed");
          }

          const data = (await response.json()) as ChatResponse;
          return { ok: true, data };
        } catch {
          return { ok: false, language: composerLanguage };
        }
      })(),
    };

    pendingSends[threadKey] = pending;
    setPendingId(pending.id);
  }

  function askForShop() {
    if (busy || inFlightRef.current) return;
    setAwaitingMaps(true);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        language: landing,
        text: copy.askMaps[landing],
      },
    ]);
  }

  function applyAssistant(message: AssistantMessage) {
    setMessages((current) => {
      const next: Message[] = [...current, message];
      threads[threadKey] = {
        messages: next,
        composerLanguage,
        awaitingMaps: false,
      };
      return next;
    });
  }

  async function sendNearby(label: string) {
    if (inFlightRef.current) return;

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: label,
    };

    inFlightRef.current = true;
    setAwaitingMaps(false);
    setBusy(true);
    setMessages((current) => {
      const next = [...current, userMessage];
      threads[threadKey] = {
        messages: next,
        composerLanguage,
        awaitingMaps: false,
      };
      return next;
    });

    const visitor = await requestVisitorLocation({ retry: true });
    inFlightRef.current = false;
    setBusy(false);

    if (visitor.status !== "ready") {
      applyAssistant({
        id: crypto.randomUUID(),
        role: "assistant",
        language: landing,
        text: copy.nearbyNeedsLocation[landing],
      });
      return;
    }

    const picks = nearbyChatPicks({
      origin: { lat: visitor.lat, lng: visitor.lng },
      beenIds: been.ids,
      language: landing,
    });

    const text =
      picks.length === 0
        ? copy.emptyCatalog[landing]
        : picks.length === 3
          ? copy.threePicks[landing]
          : copy.fewerPicks[landing];

    applyAssistant({
      id: crypto.randomUUID(),
      role: "assistant",
      language: landing,
      text,
      picks,
    });
  }

  function pinFromInput(
    row: HalfwayPinInput | undefined,
  ): { lat: number; lng: number } | null {
    if (
      row &&
      typeof row.lat === "number" &&
      typeof row.lng === "number" &&
      Number.isFinite(row.lat) &&
      Number.isFinite(row.lng)
    ) {
      return { lat: row.lat, lng: row.lng };
    }
    return null;
  }

  function showHalfwayPinFail(rows: HalfwayPinInput[], reply?: string) {
    const text = reply?.trim() || halfwayPinFailCopy(landing, rows);
    setMeetHalfwayOpen(true);
    setHalfwayPinError(text);
    applyAssistant({
      id: crypto.randomUUID(),
      role: "assistant",
      language: landing,
      text,
    });
  }

  async function ensureHalfwayInvite(
    me: HalfwayPinInput,
  ): Promise<{ id: string; url: string } | null> {
    if (halfwayWaitingId) {
      const origin = window.location.origin.replace(/\/$/, "");
      return {
        id: halfwayWaitingId,
        url: `${origin}${halfwayInviteSharePath(halfwayWaitingId)}`,
      };
    }
    const pin = pinFromInput(me);
    let id = encodeHalfwayInviteId({
      locale: landing,
      locations: pin ? [pin] : [],
    });
    if (!id) {
      try {
        const response = await fetch("/api/halfway/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale: landing,
            lat: me.lat,
            lng: me.lng,
            text: me.text,
            seed: true,
          }),
        });
        const data = (await response.json()) as {
          id?: string;
          reply?: string;
        };
        id = typeof data.id === "string" ? data.id : null;
        if (!id) {
          showHalfwayPinFail(
            [me],
            typeof data.reply === "string" ? data.reply : undefined,
          );
          return null;
        }
      } catch {
        showHalfwayPinFail([me]);
        return null;
      }
    } else {
      try {
        await fetch("/api/halfway/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, seed: true }),
        });
      } catch {
        // Overlay write is best-effort; the /h/{id} URL still has A's pin.
      }
    }
    if (!id) {
      showHalfwayPinFail([me]);
      return null;
    }
    const origin = window.location.origin.replace(/\/$/, "");
    const url = `${origin}${halfwayInviteSharePath(id)}`;
    if (pin) {
      writeHalfwayWaiting({ id, locale: landing, me: pin });
      setHalfwayWaitingMe(pin);
    }
    setHalfwayJoined(false);
    setHalfwayFriendPin(null);
    halfwayJoinSeenRef.current = false;
    setHalfwayWaitingId(id);
    setHalfwayPinError(null);
    trackEvent(
      "meet_halfway_invite_share",
      { locale: landing, pack_id: id },
      { dedupeKey: `meet_halfway_invite_share:${id}` },
    );
    return { id, url };
  }

  async function inviteHalfwayFriend(me: HalfwayPinInput) {
    const created = await ensureHalfwayInvite(me);
    if (!created) return;
    setHalfwayWaitingUi(true);
    await sharePackPacket(
      halfwayInviteShareText({ language: landing, url: created.url }),
    );
    if (window.location.pathname !== halfwayInvitePath(created.id, landing)) {
      router.replace(halfwayInvitePath(created.id, landing));
    }
  }

  async function copyHalfwayInvite(me: HalfwayPinInput): Promise<boolean> {
    const created = await ensureHalfwayInvite(me);
    if (!created) return false;
    return copyShareText(
      halfwayInviteShareText({ language: landing, url: created.url }),
    );
  }

  async function joinHalfwayInvite(row: HalfwayPinInput | undefined) {
    if (!halfwayInvite || !row) return;
    try {
      await fetch("/api/halfway/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: halfwayInvite.id,
          lat: row.lat,
          lng: row.lng,
          text: row.text,
        }),
      });
    } catch {
      // Guest still sees local results from the URL pin + their pin.
    }
    sendMeetHalfway([...halfwayInvite.locations, row], { source: "invite" });
  }

  function sendMeetHalfway(
    locations: HalfwayPinInput[],
    options?: {
      more?: boolean;
      reroll?: boolean;
      joined?: boolean;
      source?: MeetHalfwayResultSource;
    },
  ) {
    if (inFlightRef.current) return;
    const more = Boolean(options?.more);
    const reroll = Boolean(options?.reroll);
    const paging = more && !reroll;
    setHalfwayWaitingId(null);
    clearHalfwayWaiting();
    sendMeetHalfwayRef.current = sendMeetHalfway;
    if (reroll) {
      halfwayLocationsRef.current = locations;
      halfwayShownRef.current = [];
      halfwayPageRef.current += 1;
      trackEvent(
        "meet_halfway_refresh",
        { locale: landing, page: halfwayPageRef.current },
        { dedupeKey: `meet_halfway_refresh:${halfwayPageRef.current}` },
      );
    } else if (!more) {
      halfwayLocationsRef.current = locations;
      halfwayShownRef.current = [];
      halfwayPageRef.current = 1;
    } else {
      halfwayPageRef.current += 1;
      trackEvent(
        "meet_halfway_refresh",
        { locale: landing, page: halfwayPageRef.current },
        { dedupeKey: `meet_halfway_refresh:${halfwayPageRef.current}` },
      );
    }

    const ask =
      more || reroll
        ? copy.meetHalfwayMoreTitle[landing]
        : meetHalfwayAskLabel(landing);
    trackChatQuery({ text: ask, locale: landing, via: "chip" });

    inFlightRef.current = true;
    setAwaitingMaps(false);
    setBusy(true);
    if (!more && !reroll) {
      const userMessage: UserMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: ask,
      };
      setMessages((current) => {
        const next = [...current, userMessage];
        threads[threadKey] = {
          messages: next,
          composerLanguage,
          awaitingMaps: false,
        };
        return next;
      });
    }

    const shownIds = paging
      ? Array.from(
          new Set([
            ...halfwayShownRef.current,
            ...shownHalfwayPickIds(threads[threadKey]?.messages ?? messages),
          ]),
        )
      : [];

    const pending: PendingSend = {
      id: crypto.randomUUID(),
      applied: false,
      halfway: {
        locations,
        more: more || reroll,
        joined: options?.joined,
        source: options?.source,
      },
      promise: (async (): Promise<PendingResult> => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: ask,
              halfway: {
                locations,
                id: halfwayInvite?.id ?? halfwayWaitingId ?? undefined,
              },
              halfwayMore: paging || undefined,
              beenIds: paging
                ? Array.from(new Set([...shownIds, ...been.ids]))
                : been.ids,
              landing,
              via: "chip",
              session: readLearnSession(),
            }),
          });

          if (!response.ok) {
            throw new Error("chat_failed");
          }

          const data = (await response.json()) as ChatResponse;
          return { ok: true, data };
        } catch {
          return { ok: false, language: composerLanguage };
        }
      })(),
    };

    pendingSends[threadKey] = pending;
    setPendingId(pending.id);
  }
  sendMeetHalfwayRef.current = sendMeetHalfway;

  function applyFrozenHalfway(input: {
    locations: HalfwayPinInput[];
    picks: ChatPick[];
    shopIds?: string[];
    halfwayMore?: boolean;
    reason?: "restore" | "live";
  }) {
    const picks = input.picks;
    if (picks.length === 0) return;
    const packId = halfwayInvite?.id ?? halfwayWaitingId ?? undefined;
    if (input.reason === "live") {
      if (!halfwayJoinSeenRef.current && packId) {
        halfwayJoinSeenRef.current = true;
        trackEvent(
          "meet_halfway_invite_joined",
          { locale: landing, pack_id: packId, source: "invite" },
          { dedupeKey: `meet_halfway_invite_joined:${packId}` },
        );
      }
      halfwayJoinSeenRef.current = true;
      trackMeetHalfwayResults({
        locale: landing,
        source: "invite",
        picks,
        packId,
        locations: input.locations,
      });
    } else {
      trackHalfwayRestore({
        id: packId,
        count: picks.length,
        locale: landing,
        seenRef: halfwayRestoreSeenRef,
      });
    }
    setSessionExpired(false);
    setMeetHalfwayOpen(true);
    setHalfwayWaitingUi(false);
    setHalfwayWaitingId(null);
    clearHalfwayWaiting();
    setHalfwayJoined(true);
    halfwayLocationsRef.current = input.locations;
    halfwayShownRef.current = picks.map((pick) => pick.id);
    const host = halfwayWaitingMe
      ? [halfwayWaitingMe]
      : (halfwayInvite?.locations.flatMap((row) => {
          const pin = pinFromInput(row);
          return pin ? [pin] : [];
        }) ?? []);
    const pins = input.locations.flatMap((row) => {
      const pin = pinFromInput(row);
      return pin ? [pin] : [];
    });
    const friend = guestPinFromLocations(host, pins);
    if (friend) setHalfwayFriendPin(friend);
    setMessages((current) => {
      if (lastHalfwayResult(current)) return current;
      const result: AssistantMessage = {
        id: `halfway-picks-${halfwayInvite?.id ?? "session"}`,
        role: "assistant",
        language: landing,
        text: copy.meetHalfwayThree[landing],
        picks,
        halfwayMore: input.halfwayMore !== false,
        halfwayLocations: input.locations,
      };
      return [openerMessage(landing), result];
    });
  }
  applyFrozenHalfwayRef.current = applyFrozenHalfway;

  function shareHalfwayResults() {
    const id = halfwayInvite?.id ?? halfwayWaitingId;
    if (!id) return;
    trackEvent(
      "meet_halfway_results_share",
      { locale: landing, pack_id: id },
      { dedupeKey: `meet_halfway_results_share:${id}` },
    );
    const origin = window.location.origin.replace(/\/$/, "");
    const url = `${origin}${halfwayInviteSharePath(id)}`;
    void sharePackPacket(
      halfwayResultsShareText({ language: landing, url }),
    );
  }

  function startNewHalfway(source: MeetHalfwayStartSource = "results") {
    const packId = halfwayInvite?.id ?? halfwayWaitingId ?? halfwayIdFromPath();
    trackEvent(
      "meet_halfway_start_new",
      {
        locale: landing,
        source,
        ...(packId ? { pack_id: packId } : {}),
      },
      { dedupeKey: `meet_halfway_start_new:${source}:${packId ?? landing}` },
    );
    clearHalfwayWaiting();
    markHalfwayFresh();
    router.replace(homePath(landing));
  }

  function openRoutedChip(chipId: string) {
    if (isStaticDirectoryChip(chipId)) {
      setMeetHalfwayOpen(false);
      return;
    }
    const label = liveChipLabel(chipId, landing);
    if (chipId === MEET_HALFWAY_CHIP.id) {
      setMeetHalfwayOpen(true);
      setHalfwayPinError(null);
      trackEvent(
        "meet_halfway_open",
        {
          locale: landing,
          chip_id: chipId,
          chip_label: label ?? MEET_HALFWAY_CHIP.ar,
        },
        { dedupeKey: `meet_halfway_open:${landing}` },
      );
      return;
    }
    if (
      label &&
      (pendingSends[threadKey] ||
        messages.some(
          (message) => message.role === "user" && message.text === label,
        ))
    ) {
      return;
    }
    if (chipId === NEARBY_CHIP.id) {
      setMeetHalfwayOpen(false);
      if (label) void sendNearby(label);
      return;
    }
    if (!label) return;
    setMeetHalfwayOpen(false);
    send(label, { suggesting: false, via: "chip" });
  }
  openRoutedChipRef.current = openRoutedChip;

  function sendChip(chip: ChipPick) {
    setPickedChipId(chip.id);
    routedChipOpenedRef.current = chip.id;
    trackEvent(
      "chip_tap",
      { chip_id: chip.id, chip_label: chip.label, locale: landing },
      { dedupeKey: `chip_tap:${chip.id}` },
    );
    openRoutedChip(chip.id);
  }

  useEffect(() => {
    if (halfwayInvite || halfwayInviteExpired) return;
    if (!selectedChipId || isStaticDirectoryChip(selectedChipId)) return;
    if (chipOpen?.chipId === selectedChipId && chipOpen.picks.length > 0) {
      routedChipOpenedRef.current = selectedChipId;
      return;
    }
    if (routedChipOpenedRef.current === selectedChipId) return;
    routedChipOpenedRef.current = selectedChipId;
    openRoutedChipRef.current(selectedChipId);
  }, [selectedChipId, halfwayInvite, halfwayInviteExpired, chipOpen]);

  function startOver() {
    delete pendingSends[threadKey];
    inFlightRef.current = false;
    const openerOnly = [openerMessage(landing)];
    threads[threadKey] = {
      messages: openerOnly,
      composerLanguage: landing,
      awaitingMaps: false,
    };
    setMessages(openerOnly);
    setDraft("");
    setBusy(false);
    setPendingId(null);
    setComposerLanguage(landing);
    setAwaitingMaps(false);
    setPickedChipId(null);
    routedChipOpenedRef.current = null;
    setMeetHalfwayOpen(false);
    setHalfwayWaitingId(null);
    setHalfwayWaitingMe(null);
    setHalfwayWaitingUi(false);
    setHalfwayPinError(null);
    setHalfwayFriendPin(null);
    setHalfwayJoined(false);
    halfwayJoinSeenRef.current = false;
    clearHalfwayWaiting();
    halfwayLocationsRef.current = null;
    halfwayShownRef.current = [];
  }

  const hasThread =
    busy ||
    messages.some(
      (message) =>
        message.role === "user" ||
        (message.role === "assistant" && message.id !== "opener"),
    );
  const halfwayResult = lastHalfwayResult(messages);
  // بيننا first-class screens (invite / waiting / results). Ask composer +
  // أضف قهوة come back on close.
  const showAskComposer = !meetHalfwayOpen && !sessionExpired;
  const isHalfwayHost = Boolean(sessionHostWait(halfwayInvite));
  const halfwayGuest = Boolean(halfwayInvite) && !isHalfwayHost;
  const halfwayPicker = meetHalfwayOpen && !sessionExpired ? (
    <MeetHalfwayPicker
      language={landing}
      disabled={busy}
      mode={halfwayGuest ? "guest" : "pair"}
      waiting={halfwayWaitingUi || halfwayJoined}
      joined={halfwayJoined}
      initialMe={halfwayGuest ? null : halfwayWaitingMe}
      friendPin={halfwayFriendPin}
      error={halfwayPinError}
      onSubmit={(rows) => {
        if (halfwayGuest) {
          void joinHalfwayInvite(rows[0]);
          return;
        }
        sendMeetHalfway(rows);
      }}
      onInvite={halfwayGuest ? undefined : inviteHalfwayFriend}
      onCopyLink={halfwayGuest ? undefined : copyHalfwayInvite}
      onPin={(input) => {
        trackEvent(
          "meet_halfway_pin",
          {
            locale: landing,
            which: input.which,
            method: input.method,
          },
          {
            dedupeKey: `meet_halfway_pin:${input.which}:${input.method}`,
          },
        );
      }}
    />
  ) : null;
  const showHalfwayResults =
    meetHalfwayOpen &&
    !sessionExpired &&
    Boolean(halfwayResult?.picks?.length);
  const showHalfwaySetup = Boolean(halfwayPicker) && !showHalfwayResults;
  const resultLocations =
    halfwayResult?.halfwayLocations ?? halfwayLocationsRef.current;
  const resultMe =
    pinFromHalfwayInput(resultLocations?.[0]) ?? halfwayWaitingMe;
  const resultFriend =
    pinFromHalfwayInput(resultLocations?.[1]) ?? halfwayFriendPin;
  const resultOrigin = pinsMidpoint([resultMe, resultFriend]);
  const resultLocationLine = formatHalfwayLocationLine(
    resultMe,
    resultFriend,
    landing,
  );

  return (
    <div
      className={
        hasThread || meetHalfwayOpen
          ? "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper"
          : "mx-auto flex w-full max-w-lg flex-col bg-paper"
      }
      dir={landing === "ar" ? "rtl" : "ltr"}
      lang={landing}
    >
      <header className="shrink-0 px-4 py-3">
        {showHalfwayResults ? (
          <div className="flex items-center justify-between gap-3" dir="ltr">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMeetHalfwayOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
                aria-label={copy.meetHalfwayClose[landing]}
              >
                <span aria-hidden className="text-lg leading-none">
                  ×
                </span>
              </button>
              <Link
                href={localeHref ?? (landing === "ar" ? "/en" : "/")}
                className="px-1 text-xs text-ink-soft underline-offset-2 hover:underline"
              >
                {copy.switchLanguage[landing]}
              </Link>
            </div>
            <BrandHomeLink
              language={landing}
              className="items-end text-lg font-semibold"
              onClick={startOver}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <BrandHomeLink
              language={landing}
              className="text-lg font-semibold"
              onClick={startOver}
            />
            <div className="flex items-center gap-3">
              {restore && !meetHalfwayOpen ? null : (
                <Link
                  href={localeHref ?? (landing === "ar" ? "/en" : "/")}
                  className="text-xs text-ink-soft underline-offset-2 hover:underline"
                >
                  {copy.switchLanguage[landing]}
                </Link>
              )}
              {meetHalfwayOpen ? (
                <button
                  type="button"
                  onClick={() => setMeetHalfwayOpen(false)}
                  className="flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
                  aria-label={copy.meetHalfwayClose[landing]}
                >
                  <span aria-hidden className="text-lg leading-none">
                    ×
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {showHalfwayResults && halfwayResult?.picks ? (
        <div
          ref={listRef}
          data-halfway-results=""
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          <div className="space-y-1.5 text-center">
            <h1 className="text-[1.65rem] font-semibold tracking-tight text-ink">
              {copy.meetHalfwayThree[landing]}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">
              {copy.meetHalfwayFairSub[landing]}
            </p>
            {resultLocationLine ? (
              <p className="inline-flex items-center justify-center gap-1 text-[11px] leading-4 text-ink-soft">
                <MapPinIcon className="size-3.5 shrink-0" />
                <span>{resultLocationLine}</span>
              </p>
            ) : null}
          </div>
          <MeetHalfwayResultCards
            picks={halfwayResult.picks}
            language={landing}
            origin={resultOrigin}
          />
          {!busy ? (
            <MeetHalfwayResultsFooter
              language={landing}
              surface="screen"
              kind={halfwayResultsFooterKind({
                halfwayMore: halfwayResult.halfwayMore,
                paged: halfwayResult.halfwayPaged,
              })}
              resetKey={halfwayResult.picks.map((pick) => pick.id).join(",")}
              packId={halfwayInvite?.id ?? halfwayWaitingId ?? undefined}
              feedbackSource={
                halfwayInvite?.id || halfwayWaitingId
                  ? halfwayGuest
                    ? "guest"
                    : "host"
                  : "local"
              }
              cafeCount={halfwayResult.picks.length}
              onMore={() => {
                const locations =
                  halfwayResult.halfwayLocations ?? halfwayLocationsRef.current;
                if (!locations) return;
                if (halfwayResult.halfwayMore !== false) {
                  sendMeetHalfway(locations, { more: true });
                  return;
                }
                sendMeetHalfway(locations, { reroll: true });
              }}
              onShareResults={
                halfwayInvite?.id || halfwayWaitingId
                  ? shareHalfwayResults
                  : undefined
              }
              onStartNew={() => startNewHalfway("results")}
            />
          ) : (
            <p className="text-sm text-ink-soft">{copy.looking[composerLanguage]}</p>
          )}
        </div>
      ) : sessionExpired ? (
        <div
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-8"
          aria-live="polite"
        >
          <p className="text-center text-sm leading-6 text-ink-soft">
            {copy.meetHalfwayInviteExpired[landing]}
          </p>
          <button
            type="button"
            onClick={() => startNewHalfway("expired")}
            className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full border border-line bg-foam text-sm text-ink"
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            {copy.meetHalfwayStartNew[landing]}
          </button>
        </div>
      ) : showHalfwaySetup ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          aria-live="polite"
        >
          {halfwayPicker}
          {busy ? (
            <p className="mt-3 text-center text-sm text-ink-soft">
              {copy.looking[composerLanguage]}
            </p>
          ) : null}
        </div>
      ) : (
      <div
        ref={listRef}
        className={
          hasThread
            ? "min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            : "shrink-0 space-y-2 px-4 pt-6 pb-1"
        }
        aria-live="polite"
      >
        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p
                className="max-w-[90%] rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-sm leading-6 text-foam"
                dir="auto"
              >
                {message.text}
              </p>
            </div>
          ) : (
            <div
              key={message.id}
              className="space-y-2"
              dir={message.language === "ar" ? "rtl" : "ltr"}
            >
              {message.halfwayJoined ? (
                <p
                  className="rounded-xl bg-bean/10 px-2.5 py-2 text-xs leading-5 text-ink"
                  role="status"
                >
                  {copy.meetHalfwayInviteJoined[landing]}
                </p>
              ) : null}
              {message.id === "opener" &&
              !hasThread &&
              !isOffHomeChipId(selectedChipId ?? "") ? (
                <div className="space-y-5">
                  <HomeHero language={landing} />
                  <MeetHalfwayCard
                    language={landing}
                    disabled={busy}
                    selected={
                      (selectedChipId === undefined
                        ? pickedChipId
                        : selectedChipId) === MEET_HALFWAY_CHIP.id
                    }
                    onPick={sendChip}
                  />
                  {selectedChipId !== null ? (
                    <VibeChips
                      language={landing}
                      disabled={busy}
                      selectedId={
                        selectedChipId === undefined
                          ? (pickedChipId ?? "popular")
                          : selectedChipId
                      }
                      onPick={sendChip}
                    />
                  ) : null}
                  {halfwayInviteExpired ? (
                    <p className="text-xs leading-5 text-ink-soft">
                      {copy.meetHalfwayInviteExpired[landing]}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex justify-start">
                  <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-paper-deep px-3 py-2 text-sm leading-6 whitespace-pre-wrap">
                    {message.id === "opener" ? opener : message.text}
                  </p>
                </div>
              )}
              {message.picks?.length ? (
                <PickList
                  picks={message.picks}
                  language={message.language}
                  uiLanguage={landing}
                  beenIds={been.ids}
                  onBeen={been.mark}
                  ask={
                    restore && message.id === `pack-picks-${restore.packId}`
                      ? restore.ask
                      : askBeforePicks(messages, index)
                  }
                  packId={
                    restore && message.id === `pack-picks-${restore.packId}`
                      ? restore.packId
                      : undefined
                  }
                  mapsSource="pack"
                />
              ) : null}
              {index === messages.length - 1 &&
              !busy &&
              typeof message.halfwayMore === "boolean" &&
              !showHalfwayResults ? (
                <MeetHalfwayResultsFooter
                  language={landing}
                  surface="thread"
                  kind={halfwayResultsFooterKind({
                    halfwayMore: message.halfwayMore,
                    paged: message.halfwayPaged,
                  })}
                  onMore={() => {
                    const locations =
                      message.halfwayLocations ?? halfwayLocationsRef.current;
                    if (!locations) return;
                    if (message.halfwayMore !== false) {
                      sendMeetHalfway(locations, { more: true });
                      return;
                    }
                    sendMeetHalfway(locations, { reroll: true });
                  }}
                />
              ) : null}
              {message.districtMatch ? (
                <Link
                  href={districtPath(message.districtMatch.district_slug, landing)}
                  className="inline-flex rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep"
                >
                  {categoryDistrictHeading(
                    COFFEE_SHOPS_CATEGORY,
                    message.districtMatch.district_slug,
                    landing,
                  )}
                </Link>
              ) : null}
              {message.thinCatalog &&
              typeof message.halfwayMore !== "boolean" ? (
                <p className="text-xs leading-5 text-ink-soft">
                  {copy.thinCatalog[message.language]}
                </p>
              ) : null}
            </div>
          ),
        )}
        {busy ? (
          <div className="flex justify-start">
            <p className="rounded-2xl bg-paper-deep px-3 py-2 text-sm text-ink-soft">
              {copy.looking[composerLanguage]}
            </p>
          </div>
        ) : null}
        {hasThread ? <div aria-hidden className="h-3 shrink-0" /> : null}
      </div>
      )}

      {showAskComposer ? (
        <form
          ref={footerRef}
          className={
            hasThread
              ? "sticky bottom-0 z-10 shrink-0 border-t border-line bg-paper px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              : "shrink-0 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          }
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <label className="sr-only" htmlFor="koofi-ask">
            {awaitingMaps
              ? copy.mapsPlaceholder[landing]
              : copy.placeholder[landing]}
          </label>
          <div className="flex items-center gap-2">
            <textarea
              id="koofi-ask"
              value={draft}
              rows={1}
              dir={landing === "ar" ? "rtl" : "ltr"}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              placeholder={
                awaitingMaps
                  ? copy.mapsPlaceholder[landing]
                  : copy.placeholder[landing]
              }
              className="min-h-14 flex-1 resize-none overflow-visible rounded-2xl border border-line bg-foam px-3 py-2.5 text-start text-sm leading-5 outline-none focus:border-bean"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="h-14 rounded-2xl bg-bean px-4 text-sm text-foam disabled:opacity-50"
            >
              {copy.send[landing]}
            </button>
          </div>
          <div className="mt-2 text-start">
            <AddShopButton
              language={landing}
              disabled={busy}
              onAdd={askForShop}
            />
          </div>
        </form>
      ) : null}
    </div>
  );
}
