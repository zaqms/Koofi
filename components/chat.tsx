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

type ChatProps = {
  landing: Language;
};

export function Chat({ landing }: ChatProps) {
  const opener = landing === "ar" ? copy.opener : copy.openerEn;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "opener",
      role: "assistant",
      language: landing,
      text: opener,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const been = useBeenIds();
  const [composerLanguage, setComposerLanguage] = useState<Language>(landing);
  const [awaitingMaps, setAwaitingMaps] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLFormElement>(null);

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
    const list = listRef.current;
    const footer = footerRef.current;
    if (!list) return;

    function scrollToEnd() {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }

    scrollToEnd();
    if (!footer || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      scrollToEnd();
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [messages, busy]);

  async function send(text: string, options?: { suggesting?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const suggesting = options?.suggesting ?? awaitingMaps;

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setAwaitingMaps(false);
    setBusy(true);

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
      setComposerLanguage(data.language);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          language: data.language,
          text: data.reply,
          picks: data.picks,
          thinCatalog: data.thinCatalog,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          language: composerLanguage,
          text: copy.error[composerLanguage],
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function askForShop() {
    if (busy) return;
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
    void send(label, { suggesting: false });
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
                  <p className="whitespace-pre-wrap">
                    {message.picks?.length
                      ? message.picks.length === 3
                        ? copy.threePicks[message.language]
                        : copy.fewerPicks[message.language]
                      : message.text}
                  </p>
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
          void send(draft);
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
                void send(draft);
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
