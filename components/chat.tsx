"use client";

import { useEffect, useRef, useState } from "react";
import { PickList, type ChatPick } from "@/components/pick-list";
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

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "opener",
      role: "assistant",
      language: "ar",
      text: copy.opener,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const been = useBeenIds();
  const [composerLanguage, setComposerLanguage] = useState<Language>("ar");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, beenIds: been.ids }),
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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <p className="text-lg font-semibold">{PRODUCT_NAME}</p>
        <p className="text-xs text-ink-soft">{copy.cityOnly.ar} · {copy.cityOnly.en}</p>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
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
                <p className="whitespace-pre-wrap">
                  {message.picks?.length ? null : message.text}
                  {message.picks?.length
                    ? message.language === "ar"
                      ? message.picks.length === 3
                        ? copy.threePicks.ar
                        : copy.fewerPicks.ar
                      : message.picks.length === 3
                        ? copy.threePicks.en
                        : copy.fewerPicks.en
                    : null}
                </p>
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
      </div>

      <form
        className="sticky bottom-0 border-t border-line bg-paper px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="koofi-ask">
          {copy.placeholder[composerLanguage]}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="koofi-ask"
            value={draft}
            rows={1}
            dir="auto"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            placeholder={copy.placeholder[composerLanguage]}
            className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-foam px-3 py-2 text-sm outline-none focus:border-bean"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-11 rounded-2xl bg-bean px-4 text-sm text-foam disabled:opacity-50"
          >
            {copy.send[composerLanguage]}
          </button>
        </div>
      </form>
    </div>
  );
}
