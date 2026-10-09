"use client";

import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import {
  CONSENT_ACTION_EVENT,
  type ConsentAction,
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
/** Height of a visible fixed bar pinned to the viewport bottom (0 if none). */
function fixedBottomBarHeight(banner: HTMLElement): number {
  let height = 0;
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("form, nav, footer, [role=toolbar]"))) {
    if (banner.contains(el)) continue;
    const style = window.getComputedStyle(el);
    if (style.position !== "fixed" || style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && rect.height < window.innerHeight / 3 && Math.abs(rect.bottom - window.innerHeight) <= 1) {
      height = Math.max(height, Math.round(rect.height));
    }
  }
  return height;
}

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

/** Accept / Reject / Cookie settings, re-emitted by the bootstrap guard. */
function onConsentAction(event: Event): void {
  const action = (event as CustomEvent<ConsentAction>).detail;
  if (action === "accept") {
    grantConsent();
    setSnap({ choice: "granted", open: false });
  } else if (action === "reject") {
    denyConsent(getSnap().choice);
    setSnap({ choice: "denied", open: false });
  } else if (action === "settings") {
    setSnap({ ...getSnap(), open: true });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener(CONSENT_ACTION_EVENT, onConsentAction);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener(CONSENT_ACTION_EVENT, onConsentAction);
  };
}

export function ConsentManager({ language: initialLanguage }: { language: Language }) {
  const { choice, open } = useSyncExternalStore(subscribe, getSnap, () => SERVER_SNAP);
  // Only rendered on the client (the server snapshot is closed), so the
  // document's current lang is safe to read.
  const language = open ? documentLanguage(initialLanguage) : initialLanguage;

  // Sit above a fixed bottom bar (home chat composer) instead of covering
  // it. Measured once when the banner opens, before paint: no later move,
  // so no layout shift.
  const bannerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const banner = bannerRef.current;
    if (!open || !banner) return;
    banner.style.bottom = `${fixedBottomBarHeight(banner)}px`;
  }, [open]);

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
          ref={bannerRef}
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
              <button type="button" className={button} data-consent="accept">
                {consentText("accept", language)}
              </button>
              <button type="button" className={button} data-consent="reject">
                {consentText("reject", language)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
