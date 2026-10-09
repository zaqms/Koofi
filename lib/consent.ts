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
 * 2. If the stored choice is "granted", load GTM right away.
 * 3. window.__wainLoadGtm() loads GTM after Accept. It first empties the
 *    dataLayer so events queued before consent are never sent.
 *
 * scripts/check-legal.ts asserts the layout never loads a tracker outside
 * this gate. The server-side DataFast AI-crawler call in proxy.ts is not a
 * browser tracker: it only reports known AI crawler user agents.
 */
export const CONSENT_STORAGE_KEY = "wain_consent";
export const CONSENT_VERSION = 1;
export type ConsentChoice = "granted" | "denied";

/** Footer "Cookie settings" → banner. */
export const CONSENT_OPEN_EVENT = "wain:consent-open";

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
  return `(function(w,d){w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments);}
var D=${JSON.stringify({ ...CONSENT_DENIED, wait_for_update: 500 })},G=${JSON.stringify(CONSENT_GRANTED)};
g('consent','default',D);g('set','ads_data_redaction',true);
var c=null;try{var r=JSON.parse(w.localStorage.getItem(${key})||'null');if(r&&r.v===${CONSENT_VERSION}&&(r.c==='granted'||r.c==='denied'))c=r.c;}catch(e){}
w.__wainConsent=c;var L=false;
w.__wainLoadGtm=function(){if(L)return;L=true;w.dataLayer.length=0;g('consent','default',D);g('set','ads_data_redaction',true);g('consent','update',G);
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var j=d.createElement('script');j.async=true;j.src=${JSON.stringify(GTM_SRC)};(d.head||d.documentElement).appendChild(j);};
if(c==='granted')w.__wainLoadGtm();})(window,document);`;
}

type ConsentWindow = Window & {
  __wainConsent?: ConsentChoice | null;
  __wainLoadGtm?: () => void;
  dataLayer?: unknown[];
};

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
 * Reject. If tools were already running (withdrawing after Accept), tell
 * Google, delete their wain.lol cookies and reload so no script stays live.
 */
export function denyConsent(previous: ConsentChoice | null): void {
  storeConsent("denied");
  if (previous !== "granted") return;
  const w = window as ConsentWindow;
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
