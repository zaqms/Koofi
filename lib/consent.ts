/**
 * Cookie consent (AR/EN banner + Google Consent Mode v2).
 *
 * Nothing third-party loads before the visitor taps Accept: Google Tag
 * Manager (and through it GA4, Google Ads, the X pixel and the OpenAI
 * pixel), Vercel Web Analytics and the DataFast browser script. Reject
 * keeps them off. The choice is stored in localStorage under
 * CONSENT_STORAGE_KEY; "Cookie settings" in the footer reopens the banner.
 *
 * The bootstrap below runs inline in <head> before anything else:
 * 1. Consent Mode v2 defaults: every storage type denied (security only
 *    granted), before GTM could ever load.
 * 2. window.__wainLoadGtm() loads GTM after Accept (or, for a stored
 *    "granted", from CONSENT_AUTOLOAD_SCRIPT). It first empties the
 *    dataLayer so events queued before consent are never sent.
 * 3. #252 (lib/analytics-redact.ts): GTM loads only where trackers are
 *    allowed. __wainLoadGtm is a no-op unless the redaction bootstrap set
 *    window.__wainTrackers === true (clean URL, not /h/*, /owner/edit or
 *    /ops; the layout renders it only when the proxy says trackers are on).
 *    After the dataLayer reset it re-applies the redaction's
 *    page_location / page_path / page_referrer (window.__wainRedactSet),
 *    so GA4 still sees /h/[invite] and no stray query, then loads GTM.
 *
 * scripts/check-legal.ts asserts the layout never loads a tracker outside
 * this gate. The server-side DataFast AI-crawler call in proxy.ts is not a
 * browser tracker: it only reports known AI crawler user agents.
 */
import { ANALYTICS_REDACT_BOOTSTRAP } from "./analytics-redact";

export const CONSENT_STORAGE_KEY = "wain_consent";
export const CONSENT_VERSION = 1;
export type ConsentChoice = "granted" | "denied";

/**
 * Banner + footer buttons carry data-consent="accept" | "reject" |
 * "settings". The bootstrap's window capture-phase guard (registered before
 * GTM can load, so it runs before any tag's listener) stops the event and
 * re-emits it as this CustomEvent. Tags (e.g. X's automatic button-click
 * capture) never see a consent click, so withdrawing sends no final hit.
 */
export const CONSENT_ACTION_EVENT = "wain:consent-action";
export type ConsentAction = "accept" | "reject" | "settings";
/** Events the guard swallows on [data-consent] elements. */
export const CONSENT_GUARDED_EVENTS = [
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "touchstart",
  "touchend",
  "click",
  "auxclick",
  "contextmenu",
] as const;

/**
 * Page-exit events. While withdrawing (window.__wainStop), the bootstrap's
 * window capture listener (registered before any tag) swallows them, so no
 * tag sends a last unload / pagehide beacon during the withdraw reload.
 */
export const CONSENT_UNLOAD_EVENTS = ["pagehide", "beforeunload", "visibilitychange", "freeze"] as const;

/** Google tag IDs in GTM-W3TM4552 (public, in the page). Disabled on withdraw. */
export const GOOGLE_TAG_IDS = ["G-EFZZET02TT", "AW-18418378883"] as const;

export const GTM_ID = "GTM-W3TM4552";
export const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
export const DATAFAST_SRC = "https://datafa.st/js/script.js";
export const DATAFAST_WEBSITE_ID = "dfid_qZyLQNdTVNdYA3lB44WTe";
export const DATAFAST_DOMAIN = "wain.lol";

/** Consent Mode v2 types. Defaults are all denied. */
export const CONSENT_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
} as const;

export const CONSENT_GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

/** First-party cookies the gated tools set on wain.lol (deleted on withdraw). */
export const TRACKER_COOKIE_PATTERN = /^(_ga|_gid|_gat|_gcl_|_twpid|_twsid|__obref|datafast_)/;
/** localStorage keys the gated tools write (deleted on withdraw). */
export const TRACKER_STORAGE_PATTERN = /^(_gcl_|oaiq_|_tw|datafast)/;

export function consentBootstrapScript(): string {
  const key = JSON.stringify(CONSENT_STORAGE_KEY);
  return `(function(w,d){if(w.__wainBoot)return;w.__wainBoot=1;w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments);}
var D=${JSON.stringify({ ...CONSENT_DENIED, wait_for_update: 500 })},G=${JSON.stringify(CONSENT_GRANTED)};
g('consent','default',D);g('set','ads_data_redaction',true);
var c=null;try{var r=JSON.parse(w.localStorage.getItem(${key})||'null');if(r&&r.v===${CONSENT_VERSION}&&(r.c==='granted'||r.c==='denied'))c=r.c;}catch(e){}
w.__wainConsent=c;var L=false;
w.__wainLoadGtm=function(){if(L||w.__wainTrackers!==true)return;L=true;w.dataLayer.length=0;g('consent','default',D);g('set','ads_data_redaction',true);g('consent','update',G);if(typeof w.__wainRedactSet==='function')w.__wainRedactSet();
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var j=d.createElement('script');j.async=true;j.src=${JSON.stringify(GTM_SRC)};(d.head||d.documentElement).appendChild(j);};
var A=function(e){var t=e.target,b=t&&t.closest?t.closest('[data-consent]'):null;if(!b)return;e.stopImmediatePropagation();
if(e.type==='click')w.dispatchEvent(new CustomEvent(${JSON.stringify(CONSENT_ACTION_EVENT)},{detail:b.getAttribute('data-consent')}));};
${JSON.stringify(CONSENT_GUARDED_EVENTS)}.forEach(function(t){w.addEventListener(t,A,true);});
var U=function(e){if(w.__wainStop)e.stopImmediatePropagation();};
${JSON.stringify(CONSENT_UNLOAD_EVENTS)}.forEach(function(t){w.addEventListener(t,U,true);});
})(window,document);`;
}

/**
 * Stored "granted": load GTM on page load. Rendered in <head> after the
 * consent bootstrap AND after #252's ANALYTICS_REDACT_BOOTSTRAP, and only
 * when the proxy allows trackers, so __wainTrackers is already decided.
 */
export const CONSENT_AUTOLOAD_SCRIPT =
  "(function(w){if(w.__wainConsent==='granted'&&typeof w.__wainLoadGtm==='function')w.__wainLoadGtm();})(window);";

type ConsentWindow = Window & {
  __wainBoot?: number;
  __wainBootSource?: "head" | "client";
  __wainStop?: boolean;
  __wainConsent?: ConsentChoice | null;
  __wainLoadGtm?: () => void;
  __wainTrackers?: boolean;
  __wainRedactSet?: () => void;
  dataLayer?: unknown[];
};

/**
 * Fallback for pages where the <head> bootstrap never executed. On a
 * route-level 404 (notFound() while streaming), Next delivers <head> only
 * inside the RSC payload, so the inline script is inserted inert. The
 * consent manager calls this when its module loads (before hydration, so
 * before any click, and before GTM could load: GTM is only ever injected by
 * this bootstrap). Running the same script from the client installs the
 * Consent Mode defaults, the click/exit guards and, for a stored "granted",
 * GTM. Idempotent: the script returns at once if it already ran.
 */
export function ensureConsentBootstrap(): "head" | "client" | "server" {
  if (typeof window === "undefined") return "server";
  const w = window as ConsentWindow;
  if (w.__wainBoot) return (w.__wainBootSource ??= "head");
  // Same order as the layout's <head>: consent first, then #252's redaction
  // (it judges the URL itself and fails closed on /h/*, /owner/edit, /ops
  // and dirty URLs), then the stored-Accept autoload. Without the redaction
  // run, __wainTrackers stays unset and GTM never loads on these pages.
  for (const text of [consentBootstrapScript(), ANALYTICS_REDACT_BOOTSTRAP, CONSENT_AUTOLOAD_SCRIPT]) {
    const script = document.createElement("script");
    script.setAttribute("data-consent-bootstrap", "client");
    script.text = text;
    (document.head || document.documentElement).appendChild(script);
  }
  w.__wainBootSource = "client";
  return "client";
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const w = window as ConsentWindow;
  if (w.__wainConsent === "granted" || w.__wainConsent === "denied") return w.__wainConsent;
  try {
    const raw = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null") as {
      v?: number;
      c?: string;
    } | null;
    if (raw?.v === CONSENT_VERSION && (raw.c === "granted" || raw.c === "denied")) return raw.c;
  } catch {
    // Storage blocked: no stored choice, so ask again (trackers stay off).
  }
  return null;
}

function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: CONSENT_VERSION, c: choice, t: new Date().toISOString() }),
    );
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
  (window as ConsentWindow).__wainConsent = choice;
}

function deleteTrackerData(): void {
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i += 1) {
    const domain = parts.slice(i).join(".");
    domains.push(`; domain=${domain}`, `; domain=.${domain}`);
  }
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !TRACKER_COOKIE_PATTERN.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (TRACKER_STORAGE_PATTERN.test(key)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing to clear.
  }
}

/** Accept: store, then load GTM (Vercel + DataFast mount from React state). */
export function grantConsent(): void {
  storeConsent("granted");
  (window as ConsentWindow).__wainLoadGtm?.();
}

/**
 * Reject. If tools were already running (withdrawing after Accept): the
 * stored choice flips first, Google tags are switched off (ga-disable-<id>,
 * so no unload ping) and Consent Mode goes to denied, the wain.lol cookies
 * are deleted, and the page reloads so no script stays live. The click
 * itself never reached a tag listener (see CONSENT_ACTION_EVENT).
 */
export function denyConsent(previous: ConsentChoice | null): void {
  storeConsent("denied");
  if (previous !== "granted") return;
  const w = window as ConsentWindow;
  w.__wainStop = true;
  for (const id of GOOGLE_TAG_IDS) {
    (w as unknown as Record<string, boolean>)[`ga-disable-${id}`] = true;
  }
  if (w.dataLayer) {
    // gtag() commands must be an Arguments object, not an array.
    const dataLayer = w.dataLayer;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    })("consent", "update", CONSENT_DENIED);
  }
  deleteTrackerData();
  window.location.reload();
}
