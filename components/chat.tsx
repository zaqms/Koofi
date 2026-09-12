"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddShopButton } from "@/components/add-shop-button";
import { MeetHalfwayPicker } from "@/components/meet-halfway-picker";
import { MeetHalfwayResultsFooter } from "@/components/meet-halfway-results-footer";
import { PickList, type ChatPick } from "@/components/pick-list";
import {
  formatHalfwayPlaceLabel,
  pinFromHalfwayInput,
} from "@/lib/halfway-place";
import { VibeChips, type ChipPick } from "@/components/vibe-chips";
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
  districtPath,
  homePath,
} from "@/lib/product";
import { copyShareText, sharePackPacket } from "@/lib/share-pack";
import {
  trackChatQuery,
  trackDistrictMatch,
  trackEvent,
  type MeetHalfwayResultSource,
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
  selectedChipId = null,
}: ChatProps) {
  const router = useRouter();
  const threadKey = halfwayInvite
    ? `halfway:${halfwayInvite.id}`
    : restore
      ? `pack:${restore.packId}`
      : landing;
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
    if (threads[threadKey]?.halfwayWaitingId || sessionHostWait()) {
      return MEET_HALFWAY_CHIP.id;
    }
    return null;
  });
  const [meetHalfwayOpen, setMeetHalfwayOpen] = useState(
    () =>
      startFresh ||
      (Boolean(halfwayInvite) && !halfwayInviteExpired) ||
      Boolean(threads[threadKey]?.halfwayWaitingId) ||
      Boolean(sessionHostWait(halfwayInvite)),
  );
  const [halfwayWaitingId, setHalfwayWaitingId] = useState<string | null>(
    () => {
      if (halfwayInvite?.picks?.length) return null;
      return (
        threads[threadKey]?.halfwayWaitingId ??
        sessionHostWait(halfwayInvite)?.id ??
        null
      );
    },
  );
  const [halfwayWaitingMe, setHalfwayWaitingMe] = useState<Pin | null>(
    () =>
      threads[threadKey]?.halfwayWaitingMe ??
      sessionHostWait(halfwayInvite)?.me ??
      null,
  );
  const [halfwayFriendPin, setHalfwayFriendPin] = useState<Pin | null>(null);
  const [halfwayJoined, setHalfwayJoined] = useState(
    () => Boolean(halfwayInvite?.joined || halfwayInvite?.picks?.length),
  );
  const [halfwayWaitingUi, setHalfwayWaitingUi] = useState(() => {
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
    }) => void
  >(() => undefined);
  const halfwayJoinSeenRef = useRef(false);
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
          halfwayJoinSeenRef.current = true;
          applyFrozenHalfwayRef.current({
            locations,
            picks,
            shopIds,
            halfwayMore: data.halfwayMore,
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
            trackEvent(
              "meet_halfway_results",
              {
                locale: result.data.language,
                count: result.data.picks.length,
                source,
              },
              {
                dedupeKey: `meet_halfway_results:${source}:${result.data.picks
                  .map((pick) => pick.id)
                  .join(",")}`,
              },
            );
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
    if (window.location.pathname !== halfwayInvitePath(created.id)) {
      router.replace(halfwayInvitePath(created.id));
    }
  }

  async function copyHalfwayInvite(me: HalfwayPinInput): Promise<boolean> {
    const created = await ensureHalfwayInvite(me);
    if (!created) return false;
    return copyShareText(created.url);
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
      joined?: boolean;
      source?: MeetHalfwayResultSource;
    },
  ) {
    if (inFlightRef.current) return;
    const more = Boolean(options?.more);
    setHalfwayWaitingId(null);
    clearHalfwayWaiting();
    sendMeetHalfwayRef.current = sendMeetHalfway;
    if (!more) {
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

    const ask = more
      ? copy.meetHalfwayMore[landing]
      : meetHalfwayAskLabel(landing);
    trackChatQuery({ text: ask, locale: landing, via: "chip" });

    inFlightRef.current = true;
    setAwaitingMaps(false);
    setBusy(true);
    if (!more) {
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

    const shownIds = more
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
        more,
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
              halfwayMore: more || undefined,
              beenIds: more
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
  }) {
    const picks = input.picks;
    if (picks.length === 0) return;
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
    const origin = window.location.origin.replace(/\/$/, "");
    const url = `${origin}${halfwayInviteSharePath(id)}`;
    void sharePackPacket(
      halfwayResultsShareText({ language: landing, url }),
    );
  }

  function startNewHalfway() {
    clearHalfwayWaiting();
    markHalfwayFresh();
    router.replace(homePath(landing));
  }

  function sendChip(chip: ChipPick) {
    setPickedChipId(chip.id);
    trackEvent(
      "chip_tap",
      { chip_id: chip.id, chip_label: chip.label, locale: landing },
      { dedupeKey: `chip_tap:${chip.id}` },
    );
    if (chip.id === "popular") {
      setMeetHalfwayOpen(false);
      return;
    }
    if (chip.id === NEARBY_CHIP.id) {
      setMeetHalfwayOpen(false);
      void sendNearby(chip.label);
      return;
    }
    if (chip.id === MEET_HALFWAY_CHIP.id) {
      setMeetHalfwayOpen(true);
      setHalfwayPinError(null);
      trackEvent(
        "meet_halfway_open",
        {
          locale: landing,
          chip_id: chip.id,
          chip_label: chip.label,
        },
        { dedupeKey: `meet_halfway_open:${landing}` },
      );
      return;
    }
    setMeetHalfwayOpen(false);
    send(chip.label, { suggesting: false, via: "chip" });
  }

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
    Boolean(halfwayPicker) && Boolean(halfwayResult?.picks?.length);
  const showHalfwaySetup = Boolean(halfwayPicker) && !showHalfwayResults;
  const resultLocations =
    halfwayResult?.halfwayLocations ?? halfwayLocationsRef.current;
  const resultMe =
    pinFromHalfwayInput(resultLocations?.[0]) ?? halfwayWaitingMe;
  const resultFriend =
    pinFromHalfwayInput(resultLocations?.[1]) ?? halfwayFriendPin;

  return (
    <div
      className={
        hasThread || meetHalfwayOpen
          ? "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper"
          : "mx-auto flex w-full max-w-md flex-col bg-paper"
      }
      dir={landing === "ar" ? "rtl" : "ltr"}
      lang={landing}
    >
      <header className="shrink-0 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <BrandHomeLink
            language={landing}
            className="text-lg font-semibold"
            onClick={startOver}
          />
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
          ) : restore ? null : (
            <Link
              href={localeHref ?? (landing === "ar" ? "/en" : "/")}
              className="text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              {copy.switchLanguage[landing]}
            </Link>
          )}
        </div>
        {meetHalfwayOpen ? null : (
          <p className="text-xs text-ink-soft">{copy.cityOnly[landing]}</p>
        )}
      </header>

      {showHalfwayResults && halfwayResult?.picks ? (
        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          <div className="space-y-1.5 text-start">
            <h1 className="text-xl font-semibold leading-7 text-ink">
              {copy.meetHalfwayThree[landing]}
            </h1>
            <p className="text-xs leading-5 text-ink-soft">
              {copy.meetHalfwayFairSub[landing]}
            </p>
            <p className="text-[11px] leading-4 text-ink-soft">
              {[
                formatHalfwayPlaceLabel(resultMe, landing),
                formatHalfwayPlaceLabel(resultFriend, landing),
              ]
                .filter((label, index, rows) => rows.indexOf(label) === index)
                .join(landing === "ar" ? " · " : " · ")}
            </p>
          </div>
          <PickList
            picks={halfwayResult.picks}
            language={halfwayResult.language}
            uiLanguage={landing}
            beenIds={been.ids}
            onBeen={been.mark}
            ask={meetHalfwayAskLabel(landing)}
            mapsSource="pack"
            halfway={{ me: resultMe, friend: resultFriend }}
          />
          {!busy ? (
            <MeetHalfwayResultsFooter
              language={landing}
              kind={halfwayResultsFooterKind({
                halfwayMore: halfwayResult.halfwayMore,
                paged: halfwayResult.halfwayPaged,
              })}
              onMore={() => {
                const locations =
                  halfwayResult.halfwayLocations ?? halfwayLocationsRef.current;
                if (locations) sendMeetHalfway(locations, { more: true });
              }}
              onShareResults={
                halfwayInvite?.id || halfwayWaitingId
                  ? shareHalfwayResults
                  : undefined
              }
              onStartNew={startNewHalfway}
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
            onClick={startNewHalfway}
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
            : "shrink-0 space-y-2 px-4 pt-4 pb-1"
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
              {message.id === "opener" && !hasThread ? (
                <p className="text-start text-sm leading-6 whitespace-pre-wrap">
                  {opener}
                </p>
              ) : (
                <div className="flex justify-start">
                  <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-paper-deep px-3 py-2 text-sm leading-6 whitespace-pre-wrap">
                    {message.id === "opener" ? opener : message.text}
                  </p>
                </div>
              )}
              {message.id === "opener" && !hasThread ? (
                <>
                  <VibeChips
                    language={landing}
                    disabled={busy}
                    selectedId={selectedChipId ?? pickedChipId}
                    onPick={sendChip}
                  />
                  {halfwayInviteExpired ? (
                    <p className="text-xs leading-5 text-ink-soft">
                      {copy.meetHalfwayInviteExpired[landing]}
                    </p>
                  ) : null}
                </>
              ) : null}
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
              {index === messages.length - 1 && !busy ? (
                <MeetHalfwayResultsFooter
                  language={landing}
                  kind={halfwayResultsFooterKind({
                    halfwayMore: message.halfwayMore,
                    paged: message.halfwayPaged,
                  })}
                  onMore={() => {
                    const locations =
                      message.halfwayLocations ?? halfwayLocationsRef.current;
                    if (locations) sendMeetHalfway(locations, { more: true });
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
