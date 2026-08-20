"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddShopButton } from "@/components/add-shop-button";
import { PickList, type ChatPick } from "@/components/pick-list";
import { VibeChips } from "@/components/vibe-chips";
import { useBeenIds } from "@/lib/been";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME } from "@/lib/product";
import type { Language } from "@/lib/types";

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
};

const threads: Partial<Record<Language, LiveThread>> = {};
const pendingSends: Partial<Record<Language, PendingSend>> = {};

function openerMessage(landing: Language): AssistantMessage {
  return {
    id: "opener",
    role: "assistant",
    language: landing,
    text: landing === "ar" ? copy.opener : copy.openerEn,
  };
}

export function Chat({ landing }: ChatProps) {
  const opener = landing === "ar" ? copy.opener : copy.openerEn;
  const [messages, setMessages] = useState<Message[]>(
    () => threads[landing]?.messages ?? [openerMessage(landing)],
  );
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState(
    () => pendingSends[landing]?.id ?? null,
  );
  const [busy, setBusy] = useState(() => Boolean(pendingSends[landing]));
  const been = useBeenIds();
  const [composerLanguage, setComposerLanguage] = useState<Language>(
    () => threads[landing]?.composerLanguage ?? landing,
  );
  const [awaitingMaps, setAwaitingMaps] = useState(
    () => threads[landing]?.awaitingMaps ?? false,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLFormElement>(null);
  const inFlightRef = useRef(Boolean(pendingSends[landing]));

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
    threads[landing] = {
      messages,
      composerLanguage,
      awaitingMaps,
    };
  }, [landing, messages, composerLanguage, awaitingMaps]);

  useEffect(() => {
    const pending = pendingSends[landing];
    if (!pending) return;

    inFlightRef.current = true;
    let cancelled = false;

    void pending.promise.then((result) => {
      if (cancelled || pending.applied) return;
      pending.applied = true;
      if (pendingSends[landing] === pending) {
        delete pendingSends[landing];
      }
      inFlightRef.current = false;
      setBusy(false);
      setPendingId(null);

      if (result.ok) {
        setComposerLanguage(result.data.language);
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
          threads[landing] = {
            messages: next,
            composerLanguage: result.data.language,
            awaitingMaps: false,
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
        threads[landing] = {
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
  }, [landing, pendingId]);

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

  function send(text: string, options?: { suggesting?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || inFlightRef.current) return;
    const suggesting = options?.suggesting ?? awaitingMaps;

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
      threads[landing] = {
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

    pendingSends[landing] = pending;
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

  function sendChip(label: string) {
    send(label, { suggesting: false });
  }

  return (
    <div
      className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-paper"
      dir={landing === "ar" ? "rtl" : "ltr"}
      lang={landing}
    >
      <header className="shrink-0 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold">{PRODUCT_NAME}</p>
          <Link
            href={landing === "ar" ? "/en" : "/"}
            className="text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            {copy.switchLanguage[landing]}
          </Link>
        </div>
        <p className="text-xs text-ink-soft">{copy.cityOnly[landing]}</p>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-start">
              <p
                className="max-w-[90%] rounded-2xl rounded-tr-sm bg-ink px-3 py-2 text-sm leading-6 text-foam"
                dir="auto"
              >
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex justify-end">
              <div
                className="max-w-[92%] rounded-2xl rounded-tl-sm bg-paper-deep px-3 py-2 text-sm leading-6"
                dir={message.language === "ar" ? "rtl" : "ltr"}
              >
                {message.id === "opener" ? (
                  <p>{opener}</p>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                {message.id === "opener" ? (
                  <div className="mt-3">
                    <VibeChips
                      language={landing}
                      disabled={busy}
                      onPick={sendChip}
                    />
                  </div>
                ) : null}
                {message.picks?.length ? (
                  <PickList
                    picks={message.picks}
                    language={message.language}
                    beenIds={been.ids}
                    onBeen={been.mark}
                  />
                ) : null}
                {message.thinCatalog ? (
                  <p className="mt-3 text-xs leading-5 text-ink-soft">
                    {copy.thinCatalog[message.language]}
                  </p>
                ) : null}
              </div>
            </div>
          ),
        )}
        {busy ? (
          <div className="flex justify-end">
            <p className="rounded-2xl bg-paper-deep px-3 py-2 text-sm text-ink-soft">
              {copy.looking[composerLanguage]}
            </p>
          </div>
        ) : null}
        <div aria-hidden className="h-3 shrink-0" />
      </div>

      <form
        ref={footerRef}
        className="shrink-0 border-t border-line bg-paper px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        {messages.some((message) => message.role === "user") ? (
          <div className="mb-2">
            <VibeChips language={landing} disabled={busy} onPick={sendChip} />
          </div>
        ) : null}
        <label className="sr-only" htmlFor="koofi-ask">
          {awaitingMaps
            ? copy.mapsPlaceholder[landing]
            : copy.placeholder[landing]}
        </label>
        <div className="flex items-end gap-2">
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
            className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-foam px-3 py-2 text-sm outline-none focus:border-bean"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-11 rounded-2xl bg-bean px-4 text-sm text-foam disabled:opacity-50"
          >
            {copy.send[landing]}
          </button>
        </div>
        <div className="mt-2">
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
