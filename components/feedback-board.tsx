"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import { LightbulbTile, ThumbsUpTile } from "@/components/feedback-icons";
import { copy } from "@/lib/copy";
import { CONTACT_WHATSAPP_HREF, feedbackPath } from "@/lib/product";
import {
  IDEA_MAX_CHARS,
  type FeedbackError,
  type FeedbackIdea,
  type FeedbackSnapshot,
} from "@/lib/feedback-types";
import { trackEvent } from "@/lib/track";
import type { Language } from "@/lib/types";

type FeedbackBoardProps = {
  language: Language;
  snapshot: FeedbackSnapshot;
};

type ApiPayload = {
  ok?: boolean;
  error?: FeedbackError;
  ideas?: FeedbackIdea[];
  votedIds?: number[];
  storage?: FeedbackSnapshot["storage"];
};

function applySnapshot(
  current: FeedbackSnapshot,
  payload: ApiPayload,
): FeedbackSnapshot {
  return {
    ideas: payload.ideas ?? current.ideas,
    votedIds: payload.votedIds ?? current.votedIds,
    storage: payload.storage ?? current.storage,
  };
}

function errorCopy(language: Language, error: FeedbackError | undefined): string {
  switch (error) {
    case "empty":
      return copy.feedbackEmptyInput[language];
    case "too_long":
      return copy.feedbackTooLong[language];
    case "rate_limited":
      return copy.feedbackRateLimited[language];
    case "no_storage":
      return copy.feedbackNoStorage[language];
    default:
      return copy.error[language];
  }
}

export function FeedbackBoard({ language, snapshot: initial }: FeedbackBoardProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const [snapshot, setSnapshot] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const voted = new Set(snapshot.votedIds);

  async function addIdea(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const payload = (await response.json()) as ApiPayload;
      if (!payload.ok) {
        setMessage(errorCopy(language, payload.error));
        if (payload.ideas) setSnapshot((current) => applySnapshot(current, payload));
        return;
      }
      setDraft("");
      setSnapshot((current) => applySnapshot(current, payload));
      trackEvent("feedback_add", { locale: language });
    } catch {
      setMessage(copy.error[language]);
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: number) {
    if (votingId !== null || voted.has(id)) return;
    setVotingId(id);
    setMessage(null);
    try {
      const response = await fetch("/api/feedback/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json()) as ApiPayload;
      if (!payload.ok && payload.error && payload.error !== "already_voted") {
        setMessage(errorCopy(language, payload.error));
      } else {
        trackEvent("feedback_vote", { locale: language });
      }
      setSnapshot((current) => applySnapshot(current, payload));
    } catch {
      setMessage(copy.error[language]);
    } finally {
      setVotingId(null);
    }
  }

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="flex items-center justify-between gap-3">
        <BrandHomeLink language={language} className="text-lg font-semibold" />
        <Link
          href={feedbackPath(other)}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>

      <section className="mt-10 text-center">
        <div className="flex justify-center">
          <LightbulbTile size={48} glyph={24} />
        </div>
        <h1 className="mt-5 text-[2rem] font-bold leading-none tracking-tight">
          {copy.feedbackTitle[language]}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {copy.feedbackSubtitle[language]}
        </p>
      </section>

      <section className="mt-8 flex-1 space-y-3">
        {snapshot.ideas.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-foam px-4 py-10 text-center">
            <LightbulbTile size={56} glyph={28} />
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              {copy.feedbackEmpty[language]}
            </p>
          </div>
        ) : (
          snapshot.ideas.map((idea) => {
            const hasVoted = voted.has(idea.id);
            return (
              <article
                key={idea.id}
                className="flex items-center gap-3 rounded-2xl bg-foam px-4 py-3"
              >
                <p className="min-w-0 flex-1 text-[15px] leading-7">{idea.body}</p>
                <button
                  type="button"
                  onClick={() => vote(idea.id)}
                  disabled={hasVoted || votingId === idea.id}
                  dir="ltr"
                  className="flex shrink-0 items-center gap-1.5 text-ink-soft disabled:opacity-100"
                  aria-pressed={hasVoted}
                  aria-label={
                    hasVoted
                      ? copy.feedbackVoted[language]
                      : copy.feedbackVote[language]
                  }
                >
                  <span className="text-sm tabular-nums">{idea.votes}</span>
                  <ThumbsUpTile
                    size={36}
                    voted={hasVoted}
                    label={
                      hasVoted
                        ? copy.feedbackVoted[language]
                        : copy.feedbackVote[language]
                    }
                  />
                </button>
              </article>
            );
          })
        )}
      </section>

      <form className="mt-6 flex items-stretch gap-2" onSubmit={addIdea}>
        <label className="sr-only" htmlFor="feedback-idea">
          {copy.feedbackPlaceholder[language]}
        </label>
        <input
          id="feedback-idea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={IDEA_MAX_CHARS}
          placeholder={copy.feedbackPlaceholder[language]}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-foam px-4 text-sm outline-none placeholder:text-ink-soft/70 focus:border-ink-soft"
          autoComplete="off"
          enterKeyHint="send"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-2xl bg-bean px-4 text-sm text-foam hover:bg-bean-deep disabled:opacity-70"
        >
          {copy.feedbackAdd[language]}
        </button>
      </form>

      {message ? (
        <p className="mt-3 text-sm text-ink-soft" role="status">
          {message}
        </p>
      ) : null}

      <p className="mt-8 pb-2 text-center">
        <a
          href={CONTACT_WHATSAPP_HREF}
          className="inline-flex items-center justify-center gap-2 text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          <WhatsAppGlyph />
          {copy.feedbackMapFooter[language]}
        </a>
      </p>
    </main>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="text-ink-soft">
      <path
        fill="currentColor"
        d="M12.04 2.1c-5.4 0-9.8 4.36-9.8 9.73 0 1.72.46 3.4 1.32 4.87L2 22l5.45-1.42a9.9 9.9 0 0 0 4.59 1.13h.01c5.4 0 9.8-4.36 9.8-9.73 0-2.6-1.02-5.04-2.87-6.88A9.86 9.86 0 0 0 12.04 2.1Zm0 17.8h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.23.84.86-3.14-.2-.32a8.05 8.05 0 0 1-1.24-4.32c0-4.48 3.68-8.12 8.21-8.12 2.19 0 4.25.85 5.8 2.38a8.06 8.06 0 0 1 2.41 5.75c0 4.48-3.68 8.12-8.12 8.25Zm4.5-6.08c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.96-.15.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.65-1.23-1.45-1.37-1.7-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.16 1.75 2.67 4.24 3.74 1.49.64 2.08.7 2.82.59.43-.07 1.46-.6 1.66-1.17.21-.57.21-1.06.14-1.17-.06-.1-.23-.16-.48-.28Z"
      />
    </svg>
  );
}
