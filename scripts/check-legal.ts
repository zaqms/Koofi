/**
 * Privacy + terms + cookie consent lock (#251 r4, 9 Oct 2026).
 *
 * The legal body is AWAITING SHOUG TEXT (visible markers, noindex, out of
 * the sitemap). What is checked now:
 * - the consent gate: no tracker (GTM → GA4 / Google Ads / X / OpenAI,
 *   Vercel Web Analytics, DataFast) loads outside lib/consent.ts, Consent
 *   Mode v2 defaults are denied before GTM can load, Reject keeps it off;
 * - the cookie section and banner tie-in in AR + EN, with AR/EN parity;
 * - the contact address is privacy@cali.sa and no personal inbox
 *   is in any user-facing copy;
 * - noindex + sitemap rules while markers remain, sitemap = main's count;
 * - brand: Wain / وين only.
 * LEGAL_SHIP=1 additionally fails while any marker is left (merge gate).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import {
  CONSENT_DENIED,
  CONSENT_GUARDED_EVENTS,
  CONSENT_STORAGE_KEY,
  CONSENT_UNLOAD_EVENTS,
  GTM_SRC,
  consentBootstrapScript,
  CONSENT_AUTOLOAD_SCRIPT,
} from "../lib/consent";
import { CONSENT_CONTACT_EMAIL, consentCopy } from "../lib/consent-copy";
import {
  LEGAL_AWAITING_PATTERN,
  LEGAL_AWAITING_SHOUG,
  LEGAL_COOKIES_SECTION_ID,
  LEGAL_DOCS,
  LEGAL_HAS_PLACEHOLDERS,
  LEGAL_LTR_PATTERN,
  LEGAL_PLACEHOLDER_PATTERN,
  LEGAL_ROBOTS,
  legalDocText,
  type LegalDoc,
} from "../lib/legal";
import { buildSitemapXml, listSitemapLocs } from "../lib/sitemap-xml";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const KINDS = ["privacy", "terms"] as const;
const LANGS = ["ar", "en"] as const;
const all = KINDS.flatMap((kind) => LANGS.map((language) => ({ kind, language, doc: LEGAL_DOCS[kind][language] })));
const text = (doc: LegalDoc) => legalDocText(doc).join("\n").replace(/\u00A0/g, " ");
const G = (re: RegExp) => new RegExp(re.source, "g");
const count = (doc: LegalDoc, re: RegExp) =>
  legalDocText(doc).reduce((sum, t) => sum + (t.match(G(re))?.length ?? 0), 0);

// ---------- 1. Consent gate ----------
const layout = read("app/layout.tsx");
for (const banned of ["googletagmanager.com", "datafa.st", "@vercel/analytics", "<Analytics", "next/script", "ns.html", "gtm.js"]) {
  assert(!layout.includes(banned), `app/layout.tsx loads a tracker outside the consent gate (${banned})`);
}
assert(layout.includes("consentBootstrapScript()"), "app/layout.tsx runs the consent bootstrap in <head>");
assert(layout.includes("<ConsentManager"), "app/layout.tsx renders <ConsentManager>");
const headBlock = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));
assert(headBlock.includes("consentBootstrapScript()"), "consent bootstrap is inside <head>");
assert(headBlock.indexOf("consentBootstrapScript()") < headBlock.indexOf("ANALYTICS_REDACT_BOOTSTRAP") && headBlock.indexOf("ANALYTICS_REDACT_BOOTSTRAP") < headBlock.indexOf("CONSENT_AUTOLOAD_SCRIPT"), "consent bootstrap first, then #252's redaction, then the stored-Accept autoload");

// Only the consent gate (lib/consent.ts, components/consent-manager.tsx) and
// #252's redaction (lib/analytics-redact.ts, components/redacted-analytics.tsx,
// rendered only by the consent manager) may reference tracker loaders.
const GATED_FILES = new Set(["lib/consent.ts", "components/consent-manager.tsx", "components/redacted-analytics.tsx", "lib/analytics-redact.ts"]);
const TRACKER_REF = /googletagmanager\.com|datafa\.st\/js|@vercel\/analytics|connect\.facebook|static\.ads-twitter|bat\.bing/;
for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
  if (!/\.(tsx?|mjs|js)$/.test(file) || GATED_FILES.has(file)) continue;
  assert(!TRACKER_REF.test(read(file)), `${file} references a tracker loader outside the consent gate`);
}
const manager = read("components/consent-manager.tsx");
const grantedBlock = manager.match(/\{choice === "granted" \? \(([\s\S]*?)\) : null\}/)?.[1] ?? "";
assert(grantedBlock.includes("<RedactedAnalytics") && grantedBlock.includes("DATAFAST_SRC"), "Vercel Analytics (redacted) + DataFast render only when choice === granted");
assert((manager.match(/<RedactedAnalytics/g) ?? []).length === 1 && !manager.includes("<Analytics") && (manager.match(/DATAFAST_SRC/g) ?? []).length === 2, "no other Analytics/DataFast render in the manager");
assert(/\{trackers \? \(\s*<Script\s+src=\{DATAFAST_SRC\}/.test(manager), "DataFast also needs #252's trackers verdict");
const redactedUses = [...walk("app"), ...walk("components"), ...walk("lib")].filter((f) => /\.tsx?$/.test(f) && read(f).includes("<RedactedAnalytics"));
assert(redactedUses.join() === "components/consent-manager.tsx", `RedactedAnalytics renders only inside the consent gate (${redactedUses.join()})`);
// Equal prominence: Accept and Reject share one class string.
assert(manager.includes('className={button} data-consent="accept"') && manager.includes('className={button} data-consent="reject"'), "Accept and Reject use the same button style");
// L3: consent buttons have no React onClick; only the bootstrap guard acts on them.
assert(!/onClick/.test(manager) && !/onClick/.test(read("components/cookie-settings-link.tsx")), "consent buttons are handled by the capture guard only");
assert(read("components/site-footer.tsx").includes("<CookieSettingsLink"), "footer has the Cookie settings link");
// M1: the copy says «تحت كل صفحة» / "at the bottom of every page", so every
// page and not-found route must render <SiteFooter> (directly or through a
// component it imports, two levels deep). The render check over the built
// site is capture/footer-render.py in the #251 package.
function rendersFooter(file: string, depth = 0): boolean {
  const src = read(file);
  if (src.includes("<SiteFooter")) return true;
  if (depth >= 2) return false;
  for (const m of src.matchAll(/from "@\/components\/([\w-]+)"/g)) {
    const dep = `components/${m[1]}.tsx`;
    if (existsSync(join(process.cwd(), dep)) && rendersFooter(dep, depth + 1)) return true;
  }
  return false;
}
const routeFiles = walk("app").filter((f) => /\/(page|not-found)\.tsx$/.test(f));
assert(routeFiles.length >= 29, `found ${routeFiles.length} page/not-found routes`);
for (const file of routeFiles) {
  assert(rendersFooter(file), `${file} has no SiteFooter (Privacy, Terms, Cookie settings): the copy promises it on every page (M1)`);
}
assert(!read("lib/track.ts").match(/fetch\(|sendBeacon|XMLHttpRequest/), "lib/track.ts only writes to the dataLayer");

// Run the bootstrap in a sandbox: stored none / denied / granted / bad value.
type Sandbox = { dataLayer: unknown[]; appended: string[]; order: string[]; __wainLoadGtm?: () => void };
// #252: GTM also needs the redaction bootstrap's verdict (__wainTrackers);
// the layout renders the autoload after it on clean pages only.
function boot(stored: string | null, runs = 1, trackers: boolean | "unset" = true): Sandbox {
  const appended: string[] = [];
  const el = { async: false, src: "" };
  const order: string[] = [];
  const head = { appendChild: (node: { src: string }) => { appended.push(node.src); order.push("gtm"); } };
  const window = {
    dataLayer: undefined as unknown,
    __wainTrackers: trackers === "unset" ? undefined : trackers,
    addEventListener: (type: string, _fn: unknown, capture: boolean) => order.push(`listen:${type}:${capture}`),
    localStorage: { getItem: (k: string) => (k === CONSENT_STORAGE_KEY ? stored : null) },
  } as Record<string, unknown>;
  const document = { createElement: () => ({ ...el }), head, documentElement: head };
  const sandbox = { window, document };
  for (let i = 0; i < runs; i += 1) runInNewContext(consentBootstrapScript(), sandbox);
  runInNewContext(CONSENT_AUTOLOAD_SCRIPT, sandbox);
  return { dataLayer: window.dataLayer as unknown[], appended, order, __wainLoadGtm: window.__wainLoadGtm as () => void };
}
const asArgs = (entry: unknown) => Array.from(entry as ArrayLike<unknown>);
for (const stored of [null, JSON.stringify({ v: 1, c: "denied" }), '{"v":9,"c":"granted"}', "not json"]) {
  const s = boot(stored);
  assert(s.appended.length === 0, `bootstrap loads nothing with stored=${stored}`);
  const first = asArgs(s.dataLayer[0]);
  assert(first[0] === "consent" && first[1] === "default", "first dataLayer entry is consent default");
  const defaults = first[2] as Record<string, string>;
  for (const key of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"] as const) {
    assert(defaults[key] === "denied" && CONSENT_DENIED[key] === "denied", `Consent Mode v2 default ${key}=denied`);
  }
}
{
  const s = boot(JSON.stringify({ v: 1, c: "granted" }));
  assert(s.appended.length === 1 && s.appended[0] === GTM_SRC, "stored granted loads GTM once");
  const guardAt = s.order.indexOf("listen:click:true");
  assert(guardAt >= 0 && guardAt < s.order.indexOf("gtm"), "consent click guard (window, capture) is registered before GTM loads (L3)");
  for (const type of [...CONSENT_GUARDED_EVENTS, ...CONSENT_UNLOAD_EVENTS]) {
    const at = s.order.indexOf(`listen:${type}:true`);
    assert(at >= 0 && at < s.order.indexOf("gtm"), `guard covers ${type}, registered before GTM (L3)`);
  }
  const order = s.dataLayer.map((e) => (Array.isArray(e) ? e : asArgs(e).length ? asArgs(e) : e));
  const i = order.findIndex((e) => Array.isArray(e) && e[1] === "update");
  assert(i > 0, "consent update granted is pushed before gtm.js");
}
{
  const s = boot(null);
  s.dataLayer.push({ event: "pre_consent_event" });
  s.__wainLoadGtm?.();
  assert(s.appended.length === 1, "Accept loads GTM");
  assert(!s.dataLayer.some((e) => (e as { event?: string }).event === "pre_consent_event"), "events queued before Accept are dropped, never sent");
  s.__wainLoadGtm?.();
  assert(s.appended.length === 1, "GTM loads at most once");
}
// #252 gate: where trackers aren't allowed (/h/*, /owner/edit, /ops, dirty
// URLs, or the redaction never ran), even Accept loads nothing.
for (const trackers of [false, "unset"] as const) {
  const s = boot(JSON.stringify({ v: 1, c: "granted" }), 1, trackers);
  s.__wainLoadGtm?.();
  assert(s.appended.length === 0, `GTM stays off when __wainTrackers=${String(trackers)}, even after Accept`);
}
// M1-r5: the client fallback re-runs the same script; a second run (head
// already ran) must be a no-op: one set of guards, one consent default.
{
  const once = boot(JSON.stringify({ v: 1, c: "granted" }), 1);
  const twice = boot(JSON.stringify({ v: 1, c: "granted" }), 2);
  assert(twice.order.join() === once.order.join() && twice.appended.length === 1 && twice.dataLayer.length === once.dataLayer.length, "bootstrap is idempotent (head + client fallback run it once)");
}
// M1-r5: route-level 404s (notFound() while streaming) get <head> only in
// the RSC payload, so the inline bootstrap never executes there. The
// consent manager must install it from the client at module load, with the
// same script (so guards register before GTM can ever load).
const consentLib = read("lib/consent.ts");
assert(/export function ensureConsentBootstrap\(\)[\s\S]*?script\.text = consentBootstrapScript\(\);/.test(consentLib), "ensureConsentBootstrap runs consentBootstrapScript() from the client");
assert(/^ensureConsentBootstrap\(\);$/m.test(manager), "consent-manager installs the bootstrap when its module loads (route-level 404 fallback)");
/** Route-level 404 samples (AR + EN). The browser check (capture-r6/notfound-clicks.py) clicks Accept and Reject on each. */
const NOT_FOUND_SAMPLES = [
  ["/c/qa-no-such-cafe", "app/c/[id]/page.tsx"],
  ["/en/c/qa-no-such-cafe", "app/en/c/[id]/page.tsx"],
  ["/coffee-shops/qa-no-such-district", "app/[category]/[slug]/not-found.tsx"],
  ["/en/coffee-shops/qa-no-such-district", "app/en/[category]/[slug]/not-found.tsx"],
  ["/p/qa-no-such-pack", "app/p/[id]/page.tsx"],
  ["/en/p/qa-no-such-pack", "app/en/[category]/[slug]/page.tsx"],
  ["/c/x", "app/c/[id]/page.tsx"],
  ["/en/x", "app/not-found.tsx"],
  ["/en/qa-no-such-page", "app/not-found.tsx"],
  ["/qa-no-such-page", "app/not-found.tsx"],
] as const;
for (const [, file] of NOT_FOUND_SAMPLES) {
  assert(existsSync(join(process.cwd(), file)), `404 sample source ${file} exists`);
}

// ---------- 2. Contact + personal inbox ----------
assert(CONSENT_CONTACT_EMAIL === "privacy@cali.sa", "contact mailbox is privacy@cali.sa");
for (const { kind, language, doc } of all) {
  assert(text(doc).includes(`{{${CONSENT_CONTACT_EMAIL}}}`), `${kind}/${language}: names ${CONSENT_CONTACT_EMAIL}`);
}
const PERSONAL_INBOX = new RegExp(["aj", "cali\\.sa"].join("@"), "i");
const USER_FACING = [
  ...walk("app").filter((f) => /\.(tsx|txt|ts)$/.test(f) && !f.startsWith("app/api/")),
  ...walk("components"),
  "lib/legal.ts",
  "lib/consent-copy.ts",
  "lib/copy.ts",
  ...walk("public").filter((f) => /\.(txt|xml|html|json|webmanifest)$/.test(f)),
];
for (const file of USER_FACING) {
  assert(!PERSONAL_INBOX.test(read(file)), `${file}: personal inbox in user-facing copy`);
}
for (const { kind, language, doc } of all) {
  assert(!PERSONAL_INBOX.test(text(doc)), `${kind}/${language}: personal inbox in legal copy`);
}
assert(!PERSONAL_INBOX.test(JSON.stringify(consentCopy)), "personal inbox in banner copy");

// ---------- 3. Cookie section, banner tie-in, parity ----------
for (const language of LANGS) {
  const doc = LEGAL_DOCS.privacy[language];
  const cookies = doc.sections.find((s) => s.id === LEGAL_COOKIES_SECTION_ID);
  assert(cookies, `privacy/${language}: #${LEGAL_COOKIES_SECTION_ID} section (banner links here)`);
  const body = [...(cookies.paragraphs ?? []), ...(cookies.bullets ?? [])].join("\n");
  for (const name of ["Google Tag Manager", "Google Analytics", "Google Ads", "OpenAI", "DataFast", "Vercel Web Analytics", "{{wain_consent}}", "{{wain_vid}}", "{{_ga}}", "{{_gcl_au}}", "{{IDE}}", "{{_twpid}}", "{{__obref}}", "{{datafast_session_id}}", "wain.lol"]) {
    assert(body.includes(name), `privacy/${language} cookies: names ${name}`);
  }
  assert(language === "en" ? /Consent Mode/.test(body) && /Reject/.test(body) && /Cookie settings/.test(body) : body.includes("Consent Mode") && body.includes("«أرفض»") && body.includes("«إعدادات الكوكيز»"), `privacy/${language} cookies: Consent Mode, Reject, Cookie settings`);
  const clearLine = (cookies.paragraphs ?? []).find((t) => t.includes("doubleclick.net")) ?? "";
  assert(["Google", "X", "OpenAI", "doubleclick.net", "twitter.com", "t.co", "openai.com"].every((n) => clearLine.includes(n)), `privacy/${language} cookies: the 'clear in your browser' line names Google, X and OpenAI (L1)`);
  const terms = LEGAL_DOCS.terms[language];
  assert(text(terms).includes(language === "en" ? "Cookie settings" : "«إعدادات الكوكيز»"), `terms/${language}: cookie tie-in`);
}
assert(consentCopy.settingsLink.ar === "إعدادات الكوكيز" && consentCopy.settingsLink.en === "Cookie settings", "footer label matches the copy");
for (const kind of KINDS) {
  const [ar, en] = [LEGAL_DOCS[kind].ar, LEGAL_DOCS[kind].en];
  assert(ar.sections.length === en.sections.length, `${kind}: AR/EN section count`);
  ar.sections.forEach((s, i) => {
    const e = en.sections[i];
    assert(s.id === e.id, `${kind}: section ${i} id parity`);
    assert((s.paragraphs?.length ?? 0) === (e.paragraphs?.length ?? 0) && (s.bullets?.length ?? 0) === (e.bullets?.length ?? 0), `${kind}: section ${i} paragraph/bullet parity`);
  });
  assert(count(ar, LEGAL_PLACEHOLDER_PATTERN) === count(en, LEGAL_PLACEHOLDER_PATTERN), `${kind}: AR/EN marker parity`);
}

// ---------- 4. Markers, noindex, sitemap ----------
const markers = all.reduce((sum, { doc }) => sum + count(doc, LEGAL_PLACEHOLDER_PATTERN), 0);
const awaiting = all.reduce((sum, { doc }) => sum + count(doc, LEGAL_AWAITING_PATTERN), 0);
assert(LEGAL_HAS_PLACEHOLDERS === markers > 0, "LEGAL_HAS_PLACEHOLDERS tracks the markers");
assert(LEGAL_AWAITING_SHOUG === awaiting > 0, "LEGAL_AWAITING_SHOUG tracks the Shoug slots");
for (const page of ["app/privacy/page.tsx", "app/terms/page.tsx", "app/en/privacy/page.tsx", "app/en/terms/page.tsx"]) {
  assert(read(page).includes("robots: LEGAL_ROBOTS"), `${page} sends LEGAL_ROBOTS`);
}
const legalLocs = ["https://wain.lol/privacy", "https://wain.lol/en/privacy", "https://wain.lol/terms", "https://wain.lol/en/terms"];
const locs = listSitemapLocs();
const builtXml = buildSitemapXml();
const sitemapFile = read("public/sitemap.xml");
for (const route of ["app/sitemap.ts", "app/sitemap.xml", "app/en/sitemap.ts", "app/sitemap.xml/route.ts"]) {
  assert(!existsSync(join(process.cwd(), route)), `${route} is a new sitemap source: teach check-legal about it`);
}
const committedCount = (sitemapFile.match(/<loc>/g) ?? []).length;
assert(committedCount === locs.length, `public/sitemap.xml has ${committedCount} locs, lib/sitemap-xml.ts ${locs.length} (run npm run generate-sitemap)`);
const sources = [
  ["listSitemapLocs()", (loc: string) => locs.includes(loc)],
  ["buildSitemapXml()", (loc: string) => builtXml.includes(`<loc>${loc}</loc>`)],
  ["public/sitemap.xml", (loc: string) => sitemapFile.includes(`<loc>${loc}</loc>`)],
] as const;
if (LEGAL_HAS_PLACEHOLDERS) {
  assert(LEGAL_ROBOTS?.index === false && LEGAL_ROBOTS.follow === true, "legal pages are noindex, follow while markers remain");
  for (const loc of legalLocs) for (const [name, has] of sources) assert(!has(loc), `${loc} stays out of ${name} while markers remain`);
} else {
  assert(LEGAL_ROBOTS === undefined, "legal pages are indexable once the markers are gone");
  for (const loc of legalLocs) for (const [name, has] of sources) assert(has(loc), `${loc} is back in ${name} once the markers are gone`);
}

// ---------- 5. Typography + brand ----------
const IDENTIFIER = /(?:^|[^{\w@.])(IDE\b|_ga\b|_ga_\w+|_gcl_\w+|_tw\w+|__obref|__cf_bm|_cfuvid|guest_id\w*|personalization_id|muc_ads|test_cookie|wain_vid|wain_consent|wain_claim_ops|datafast_\w+|privacy@cali\.sa)/;
for (const { kind, language, doc } of all) {
  assert(!LEGAL_LTR_PATTERN.test(doc.title) && !LEGAL_LTR_PATTERN.test(doc.description), `${kind}/${language}: no {{…}} in title or description`);
  for (const t of legalDocText(doc)) {
    const unwrapped = t.replace(/\{\{[^}]+\}\}/g, "");
    assert(!/\{\{|\}\}/.test(unwrapped), `${kind}/${language}: balanced {{…}} in «${t.slice(0, 60)}»`);
    const hit = unwrapped.match(IDENTIFIER);
    assert(!hit, `${kind}/${language}: unwrapped identifier ${hit?.[1]} in «${t.slice(0, 60)}»`);
    if (language === "ar") assert(!/[لب]ـ /.test(t), `${kind}/ar: «لـ» joined with a no-break space in «${t.slice(0, 60)}»`);
  }
}
const oldName = new RegExp(["ko", "ofi"].join(""), "i");
const oldNameAr = ["كو", "في"].join("");
for (const t of [...all.map(({ doc }) => text(doc)), JSON.stringify(consentCopy)]) {
  assert(!oldName.test(t) && !t.includes(oldNameAr), "no old repo name");
  assert(!/\bween\b/i.test(t), 'never "ween"');
}

// ---------- 6. Ship gate ----------
if (process.env.LEGAL_SHIP === "1") {
  assert(!LEGAL_AWAITING_SHOUG, `LEGAL_SHIP: ${awaiting} AWAITING SHOUG TEXT slots left`);
  assert(!LEGAL_HAS_PLACEHOLDERS, `LEGAL_SHIP: ${markers} markers left`);
}

console.log(
  `check-legal: ok (consent gate: 0 trackers outside lib/consent.ts, Consent Mode v2 default denied, bootstrap sandbox 6/6 + capture guard + #252 trackers gate + idempotent client fallback (${NOT_FOUND_SAMPLES.length} 404 samples); footer on ${routeFiles.length}/${routeFiles.length} routes; contact ${CONSENT_CONTACT_EMAIL}, 0 personal-inbox hits in ${USER_FACING.length} user-facing files; markers ${markers} (Shoug slots ${awaiting}); noindex=${LEGAL_HAS_PLACEHOLDERS}; sitemap ${locs.length}${LEGAL_AWAITING_SHOUG ? "; NOT SHIPPABLE: awaiting Shoug text" : ""})`,
);
