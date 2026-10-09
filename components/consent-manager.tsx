"use client";

import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useSyncExternalStore } from "react";
import {
  CONSENT_OPEN_EVENT,
  DATAFAST_DOMAIN,
  DATAFAST_SRC,
  DATAFAST_WEBSITE_ID,
  denyConsent,
  grantConsent,
  readConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { CONSENT_CONTACT_EMAIL, consentCopy, consentText } from "@/lib/consent-copy";
import { privacyPath } from "@/lib/product";
import type { Language } from "@/lib/types";

function documentLanguage(fallback: Language): Language {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("ar")) return "ar";
  return fallback;
}

/**
 * Cookie banner + the gated client trackers. Vercel Web Analytics and the
 * DataFast script render only after Accept; GTM is loaded by the inline
 * bootstrap in app/layout.tsx (lib/consent.ts). The banner is fixed to the
 * bottom of the viewport, so showing it never shifts the page.
 */
type ConsentSnap = { choice: ConsentChoice | null; open: boolean };
const SERVER_SNAP: ConsentSnap = { choice: null, open: false };
let snap: ConsentSnap | null = null;
const listeners = new Set<() => void>();

function getSnap(): ConsentSnap {
  if (!snap) {
    const choice = readConsent();
    snap = { choice, open: choice === null };
  }
  return snap;
}

function setSnap(next: ConsentSnap): void {
  snap = next;
  for (const listener of listeners) listener();
}

function onOpenSettings(): void {
  setSnap({ ...getSnap(), open: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener(CONSENT_OPEN_EVENT, onOpenSettings);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener(CONSENT_OPEN_EVENT, onOpenSettings);
  };
}

export function ConsentManager({ language: initialLanguage }: { language: Language }) {
  const { choice, open } = useSyncExternalStore(subscribe, getSnap, () => SERVER_SNAP);
  // Only rendered on the client (the server snapshot is closed), so the
  // document's current lang is safe to read.
  const language = open ? documentLanguage(initialLanguage) : initialLanguage;

  const accept = useCallback(() => {
    grantConsent();
    setSnap({ choice: "granted", open: false });
  }, []);

  const reject = useCallback(() => {
    denyConsent(getSnap().choice);
    setSnap({ choice: "denied", open: false });
  }, []);

  const button =
    "min-h-11 flex-1 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bean";

  return (
    <>
      {choice === "granted" ? (
        <>
          <Analytics />
          <Script
            src={DATAFAST_SRC}
            strategy="afterInteractive"
            data-website-id={DATAFAST_WEBSITE_ID}
            data-domain={DATAFAST_DOMAIN}
          />
        </>
      ) : null}
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="wain-consent-title"
          data-consent-banner=""
          dir={language === "ar" ? "rtl" : "ltr"}
          lang={language}
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-foam px-4 py-4 text-ink shadow-lg">
            <p id="wain-consent-title" className="text-sm font-semibold">
              {consentText("title", language)}
            </p>
            <p className="mt-1 text-xs leading-6">{consentText("body", language)}</p>
            <p className="mt-1 text-xs leading-6 text-ink-soft">
              <Link
                href={`${privacyPath(language)}#cookies`}
                className="underline underline-offset-2 hover:text-ink"
              >
                {consentText("details", language)}
              </Link>
              {" · "}
              <bdi dir="ltr">{CONSENT_CONTACT_EMAIL}</bdi>
            </p>
            {choice ? (
              <p className="mt-1 text-xs text-ink-soft">{consentCopy.current[language][choice]}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button type="button" className={button} onClick={accept} data-consent="accept">
                {consentText("accept", language)}
              </button>
              <button type="button" className={button} onClick={reject} data-consent="reject">
                {consentText("reject", language)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
