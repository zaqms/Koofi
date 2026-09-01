"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddShopButton } from "@/components/add-shop-button";
import { PickList, type ChatPick } from "@/components/pick-list";
import { VibeChips, type ChipPick } from "@/components/vibe-chips";
import { BrandHomeLink } from "@/components/brand-home-link";
import { useBeenIds } from "@/lib/been";
import { copy } from "@/lib/copy";
import { readLearnSession } from "@/lib/learn-session";
import { nearbyChatPicks } from "@/lib/nearby";
import { NEARBY_CHIP } from "@/lib/product";
import {
  requestVisitorLocation,
  useVisitorLocation,
} from "@/lib/visitor-location";
import type { Language } from "@/lib/types";

export type ChatRestore = {
  packId: string;
  ask: string;
  picks: ChatPick[];
  language: Language;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  language: Language;
  text: string;
  picks?: ChatPick[];
  thinCatalog?: boolean;
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
};

type PendingResult =
  | { ok: true; data: ChatResponse }
  | { ok: false; language: Language };

type PendingSend = {
  id: string;
  promise: Promise<PendingResult>;
  applied: boolean;
};

type LiveThread = {
  messages: Message[];
  composerLanguage: Language;
  awaitingMaps: boolean;
};

type ChatProps = {
  landing: Language;
  restore?: ChatRestore;
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

export function Chat({ landing, restore }: ChatProps) {
  const threadKey = restore ? `pack:${restore.packId}` : landing;
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
  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLFormElement>(null);
  const inFlightRef = useRef(Boolean(pendingSends[threadKey]));
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
        setMessages((current) => {
          const next: Message[] = [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              language: result.data.language,
              text: result.data.reply,
              picks: result.data.picks,
              thinCatalog: result.data.thinCatalog,
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

  function sendChip(chip: ChipPick) {
    if (chip.id === NEARBY_CHIP.id) {
      void sendNearby(chip.label);
      return;
    }
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
              href={landing === "ar" ? "/en" : "/"}
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
                <VibeChips
                  language={landing}
                  disabled={busy}
                  onPick={sendChip}
                />
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
                  mapsSource={
                    restore && message.id === `pack-picks-${restore.packId}`
                      ? "pack"
                      : "home"
                  }
                />
              ) : null}
              {message.thinCatalog ? (
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
