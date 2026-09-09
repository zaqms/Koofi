"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddShopButton } from "@/components/add-shop-button";
import { MeetHalfwayPicker } from "@/components/meet-halfway-picker";
import { MeetHalfwayResultsFooter } from "@/components/meet-halfway-results-footer";
import { PickList, type ChatPick } from "@/components/pick-list";
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
  encodeHalfwayInviteId,
  halfwayInviteSharePath,
  halfwayInviteShareText,
} from "@/lib/halfway-invite";
import {
  halfwayResultsFooterKind,
  meetHalfwayAskLabel,
  type HalfwayPinInput,
} from "@/lib/meet-halfway";
import { nearbyChatPicks } from "@/lib/nearby";
import { MEET_HALFWAY_CHIP, NEARBY_CHIP, districtPath } from "@/lib/product";
import { sharePackPacket } from "@/lib/share-pack";
import { trackChatQuery, trackDistrictMatch, trackEvent } from "@/lib/track";
import {
  requestVisitorLocation,
  useVisitorLocation,
} from "@/lib/visitor-location";
import type { DistrictMatch, Language } from "@/lib/types";

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
  const threadKey = halfwayInvite
    ? `halfway:${halfwayInvite.id}`
    : restore
      ? `pack:${restore.packId}`
      : landing;
  const opener = landing === "ar" ? copy.opener : copy.openerEn;
  const [messages, setMessages] = useState<Message[]>(
    () =>
      threads[threadKey]?.messages ??
      (restore ? restoreMessages(restore, landing) : [openerMessage(landing)]),
  );
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
  const [pickedChipId, setPickedChipId] = useState<string | null>(
    () => (halfwayInvite ? MEET_HALFWAY_CHIP.id : null),
  );
  const [meetHalfwayOpen, setMeetHalfwayOpen] = useState(
    () => Boolean(halfwayInvite) && !halfwayInviteExpired,
  );
  const [halfwayWaitingId, setHalfwayWaitingId] = useState<string | null>(null);
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
  useVisitorLocation();

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
    };
  }, [threadKey, messages, composerLanguage, awaitingMaps]);

  useEffect(() => {
    if (!halfwayWaitingId) return;
    let cancelled = false;

    async function tick() {
      if (!halfwayWaitingId || cancelled || inFlightRef.current) return;
      try {
        const response = await fetch(
          `/api/halfway/invite?id=${encodeURIComponent(halfwayWaitingId)}`,
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          locations?: HalfwayPinInput[];
        };
        const locations = Array.isArray(data.locations) ? data.locations : [];
        if (locations.length >= 2 && !cancelled) {
          sendMeetHalfway(locations);
        }
      } catch {
        // URL invite still works for the friend without this overlay.
      }
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [halfwayWaitingId]);

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
  }, [messages, busy]);

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

  async function inviteHalfwayFriend(me: HalfwayPinInput) {
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
        const data = (await response.json()) as { id?: string };
        id = typeof data.id === "string" ? data.id : null;
      } catch {
        return;
      }
    } else {
      void fetch("/api/halfway/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, seed: true }),
      }).catch(() => undefined);
    }
    if (!id) return;
    const origin = window.location.origin.replace(/\/$/, "");
    const url = `${origin}${halfwayInviteSharePath(id)}`;
    setHalfwayWaitingId(id);
    void sharePackPacket(halfwayInviteShareText({ language: landing, url }));
  }

  function joinHalfwayInvite(row: HalfwayPinInput | undefined) {
    if (!halfwayInvite || !row) return;
    void fetch("/api/halfway/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: halfwayInvite.id,
        lat: row.lat,
        lng: row.lng,
        text: row.text,
      }),
    }).catch(() => undefined);
    sendMeetHalfway([...halfwayInvite.locations, row]);
  }

  function sendMeetHalfway(
    locations: HalfwayPinInput[],
    options?: { more?: boolean },
  ) {
    if (inFlightRef.current) return;
    const more = Boolean(options?.more);
    setHalfwayWaitingId(null);
    if (!more) {
      halfwayLocationsRef.current = locations;
      halfwayShownRef.current = [];
    }

    const ask = more
      ? copy.meetHalfwayMore[landing]
      : meetHalfwayAskLabel(landing);
    trackChatQuery({ text: ask, locale: landing, via: "chip" });

    inFlightRef.current = true;
    setMeetHalfwayOpen(false);
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
      halfway: { locations, more },
      promise: (async (): Promise<PendingResult> => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: ask,
              halfway: { locations },
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

  return (
    <div
      className={
        hasThread
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
          {restore ? null : (
            <Link
              href={localeHref ?? (landing === "ar" ? "/en" : "/")}
              className="text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              {copy.switchLanguage[landing]}
            </Link>
          )}
        </div>
        <p className="text-xs text-ink-soft">{copy.cityOnly[landing]}</p>
      </header>

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
                  {meetHalfwayOpen ? (
                    <MeetHalfwayPicker
                      language={landing}
                      disabled={busy}
                      mode={halfwayInvite ? "guest" : "pair"}
                      waiting={Boolean(halfwayWaitingId)}
                      onSubmit={(rows) => {
                        if (halfwayInvite) {
                          void joinHalfwayInvite(rows[0]);
                          return;
                        }
                        sendMeetHalfway(rows);
                      }}
                      onInvite={halfwayInvite ? undefined : inviteHalfwayFriend}
                    />
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
    </div>
  );
}
