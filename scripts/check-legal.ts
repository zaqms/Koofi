/**
 * Privacy + terms lock (PR #251 r3). Guards the QA findings:
 * r1: no "cafés, not coordinates" claim (H1), Google Ads remarketing (M1) and
 * OpenAI advanced matching (M2) disclosed, Latin identifiers isolated for
 * RTL (L2), and noindex + out of the sitemap while review markers remain (L8).
 * r2: café hits to GA4 disclosed (M3), Google tag user-provided data marker
 * (M4), DataFast + Vercel on /h/ (L-a), Arabic bidi/wording (L-b, L-c),
 * every sitemap source checked + an invite-code review guard (L-d), and the
 * GTM container version the copy was checked against (I-b).
 * Brand: Wain / وين only.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEGAL_DOCS,
  LEGAL_GOOGLE_USER_DATA,
  LEGAL_GTM_CONTAINER_VERSION,
  LEGAL_HAS_PLACEHOLDERS,
  LEGAL_LTR_PATTERN,
  LEGAL_PLACEHOLDER_PATTERN,
  LEGAL_ROBOTS,
  type LegalDoc,
} from "../lib/legal";
import { buildSitemapXml, listSitemapLocs } from "../lib/sitemap-xml";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function bodyText(doc: LegalDoc): string[] {
  return [
    ...doc.intro,
    ...doc.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ]),
  ];
}

// Content asserts compare with plain spaces; the AR no-break joins (L-b)
// are checked on their own below.
const privacyAr = bodyText(LEGAL_DOCS.privacy.ar).join("\n").replace(/\u00A0/g, " ");
const privacyEn = bodyText(LEGAL_DOCS.privacy.en).join("\n");
const LEGAL_PLACEHOLDER_PATTERN_G = new RegExp(LEGAL_PLACEHOLDER_PATTERN.source, "g");
const all = (["privacy", "terms"] as const).flatMap((kind) =>
  (["ar", "en"] as const).map((language) => ({
    kind,
    language,
    doc: LEGAL_DOCS[kind][language],
  })),
);

// H1: the false "analytics get cafés, not coordinates" line stays gone.
assert(!/not your coordinates/i.test(privacyEn), "EN: no 'not your coordinates' claim");
assert(!privacyAr.includes("مو إحداثياتك"), "AR: no «مو إحداثياتك» claim");
assert(
  privacyEn.includes("{{meet_halfway_invite_share}}") &&
    privacyAr.includes("{{meet_halfway_invite_share}}"),
  "host-side invite_share flow disclosed in AR and EN",
);
assert(
  privacyEn.includes("{{pack_id}}") && privacyAr.includes("{{pack_id}}"),
  "pack_id disclosed in AR and EN",
);

// M3: GA4 gets no cafés on the results event, but does learn the café you
// open, tap Map on, or share (café page view, shop_id, outbound Maps link).
assert(!/does not receive the cafés/i.test(privacyEn), "EN: no 'GA does not receive the cafés' claim (M3)");
assert(!privacyAr.includes("أما القهاوي ومسافاتها فما توصل"), "AR: no «أما القهاوي ومسافاتها فما توصل» claim (M3)");
assert(
  privacyEn.includes("Google Analytics learns which café it was") &&
    /outside link/.test(privacyEn) &&
    privacyEn.includes("those hits can carry the invite page address"),
  "EN: café page / ID / Maps link to GA4 disclosed, with the invite address (M3)",
);
assert(
  privacyAr.includes("يعرف Google Analytics أي قهوة هي") &&
    privacyAr.includes("رابط خارجي") &&
    privacyAr.includes("عنوان صفحة الدعوة كمان"),
  "AR: café page / ID / Maps link to GA4 disclosed, with the invite address (M3)",
);

// M4: Google tag automatic user-provided data collection. The copy must
// match Amjad's decision (LEGAL_GOOGLE_USER_DATA): marker while pending,
// nothing when turned off, the disclosure when kept.
const M4_EN = "[AMJAD TO CONFIRM: keep or turn off user-provided data collection in the Google tag.";
const M4_AR = "[للتأكيد من أمجد: نخلي جمع بيانات المستخدم التلقائي في وسم Google أو نطفّيه.";
const M4_KEPT_EN = /Google tag also has automatic collection of user-provided data switched on/;
const M4_KEPT_AR = "ووسم Google مفعّل فيه الجمع التلقائي للبيانات اللي يدخلها المستخدم";
const m4 = {
  markerEn: privacyEn.includes(M4_EN),
  markerAr: privacyAr.includes(M4_AR),
  // Outside the marker only: the marker itself quotes the sentence.
  keptEn: M4_KEPT_EN.test(privacyEn.replace(LEGAL_PLACEHOLDER_PATTERN_G, "")),
  keptAr: privacyAr.replace(LEGAL_PLACEHOLDER_PATTERN_G, "").includes(M4_KEPT_AR),
};
const m4Expected = {
  pending: { marker: true, kept: false },
  off: { marker: false, kept: false },
  kept: { marker: false, kept: true },
}[LEGAL_GOOGLE_USER_DATA];
for (const language of ["en", "ar"] as const) {
  const marker = language === "en" ? m4.markerEn : m4.markerAr;
  const kept = language === "en" ? m4.keptEn : m4.keptAr;
  assert(
    marker === m4Expected.marker && kept === m4Expected.kept,
    `${language}: M4 copy doesn't match LEGAL_GOOGLE_USER_DATA="${LEGAL_GOOGLE_USER_DATA}" (marker ${marker}, disclosure ${kept})`,
  );
}

// L-a: on main DataFast does record /h/ (not "may"), and Vercel is named.
assert(!/may reach DataFast/.test(privacyEn), "EN: DataFast on /h/ is stated, not 'may' (L-a)");
assert(privacyEn.includes("also reaches DataFast and Vercel Web Analytics"), "EN: DataFast + Vercel on /h/ (L-a)");
assert(!privacyAr.includes("وممكن يوصل لـ DataFast"), "AR: DataFast on /h/ is stated (L-a)");
assert(privacyAr.includes("DataFast وVercel Web Analytics"), "AR: DataFast + Vercel on /h/ (L-a)");

// L-b: no "OpenAI: Google Tag Manager" LTR run, and «لـ»/«بـ» never sit
// before a plain (breakable) space in the Arabic docs.
assert(!privacyAr.includes("OpenAI: Google Tag Manager"), "AR: colon run 'OpenAI: Google Tag Manager' split (L-b)");
for (const kind of ["privacy", "terms"] as const) {
  const doc = LEGAL_DOCS[kind].ar;
  for (const text of [doc.title, doc.description, ...bodyText(doc)]) {
    assert(!/[لب]ـ /.test(text), `${kind}/ar: «لـ» joined with a no-break space in «${text.slice(0, 60)}» (L-b)`);
  }
}

// L-c: Arabic wording. «بعد» only means "after"; one term for the invite ID.
for (const old of ["رقم الدعوة", "رقم دعوة", "رقم جلسة", "رقم الجلسة", "تنمرّر", "ومنها اللي تكتبه", "يطلب وين موقعك", "وترتيب المسافة يبقى"]) {
  assert(!privacyAr.includes(old), `AR: «${old}» rewritten (L-c)`);
}
assert(privacyAr.includes("معرّف الدعوة"), "AR: invite ID is «معرّف الدعوة» (L-c)");
for (const match of privacyAr.matchAll(/(?<![\u0600-\u06FF])بعد(?![\u0600-\u06FF])\s+(\S+)/g)) {
  assert(["ما", "التحديث"].includes(match[1]), `AR: «بعد ${match[1]}» reads as "after"; use «كمان» for "also" (L-c)`);
}

// I-b / GTM pin: the copy names the container version it was checked against.
assert(
  privacyEn.includes(`reflects version ${LEGAL_GTM_CONTAINER_VERSION} of the container`) &&
    privacyAr.includes(`حسب النسخة ${LEGAL_GTM_CONTAINER_VERSION} من الحاوية`),
  `copy states it reflects GTM container version ${LEGAL_GTM_CONTAINER_VERSION} (AR + EN)`,
);
const liveGtm = process.env.LEGAL_GTM_LIVE_VERSION;
if (liveGtm) {
  assert(
    Number(liveGtm) === LEGAL_GTM_CONTAINER_VERSION,
    `GTM-W3TM4552 is live at v${liveGtm} but the copy was checked against v${LEGAL_GTM_CONTAINER_VERSION}: re-verify what GTM forwards, then bump LEGAL_GTM_CONTAINER_VERSION + the AR/EN sentence`,
  );
}

// M1: Google Ads remarketing is named, in the analytics text and the sharing list.
assert(
  privacyEn.includes("{{AW-18418378883}}") && privacyAr.includes("{{AW-18418378883}}"),
  "Google Ads account disclosed",
);
assert(/remarketing/i.test(privacyEn), "EN: remarketing disclosed");
assert(privacyAr.includes("إعادة الاستهداف"), "AR: إعادة الاستهداف disclosed");
for (const language of ["ar", "en"] as const) {
  const share = LEGAL_DOCS.privacy[language].sections.find((section) =>
    (section.bullets ?? []).some((bullet) => bullet.startsWith("Neon")),
  );
  assert(share, `${language}: sharing list found`);
  assert(
    (share.bullets ?? []).some((bullet) => bullet.includes("Google Ads")),
    `${language}: Google Ads in the sharing list`,
  );
}

// M2: OpenAI automatic advanced matching is disclosed.
assert(/advanced matching/i.test(privacyEn), "EN: OpenAI advanced matching disclosed");
assert(privacyAr.includes("المطابقة المتقدّمة"), "AR: المطابقة المتقدّمة disclosed");

// L5 / L6: ad-tool storage and the public suggestion list.
for (const token of ["{{_gcl_ls}}", "{{oaiq_cs:…}}", "{{/api/suggest}}"]) {
  assert(privacyEn.includes(token) && privacyAr.includes(token), `${token} disclosed in AR and EN`);
}

// Parity: same section count in AR and EN.
for (const kind of ["privacy", "terms"] as const) {
  assert(
    LEGAL_DOCS[kind].ar.sections.length === LEGAL_DOCS[kind].en.sections.length,
    `${kind}: AR/EN section count matches`,
  );
}

// L2: Latin identifiers are wrapped {{…}} so they render as <bdi dir="ltr">.
const IDENTIFIER =
  /(?:^|[^{\w])(_ga\b|_ga_<ID>|_gcl_\w+|_tw\w+|__obref|GTM-W3TM4552|AW-\d+|G-EFZZET02TT|wain_vid|pack_id|oaiq_cs|\/api\/suggest|\/h\/)/;
for (const { kind, language, doc } of all) {
  assert(
    !LEGAL_LTR_PATTERN.test(doc.title) && !LEGAL_LTR_PATTERN.test(doc.description),
    `${kind}/${language}: no {{…}} in title or description`,
  );
  for (const text of bodyText(doc)) {
    const unwrapped = text.replace(/\{\{[^}]+\}\}/g, "");
    assert(!/\{\{|\}\}/.test(unwrapped), `${kind}/${language}: balanced {{…}} in «${text.slice(0, 60)}»`);
    const hit = unwrapped.match(IDENTIFIER);
    assert(!hit, `${kind}/${language}: unwrapped identifier ${hit?.[1]} in «${text.slice(0, 60)}»`);
  }
}

// Brand: never the old repo name, never "ween".
const oldName = new RegExp(["ko", "ofi"].join(""), "i");
const oldNameAr = ["كو", "في"].join("");
for (const { kind, language, doc } of all) {
  const text = [doc.title, doc.description, ...bodyText(doc)].join("\n");
  assert(!oldName.test(text) && !text.includes(oldNameAr), `${kind}/${language}: no old repo name`);
  assert(!/\bween\b/i.test(text), `${kind}/${language}: never "ween"`);
}

// L8: while review markers remain, noindex + out of the sitemap.
const markerCount = all.reduce(
  (sum, { doc }) =>
    sum + bodyText(doc).filter((text) => LEGAL_PLACEHOLDER_PATTERN.test(text)).length,
  0,
);
assert(LEGAL_HAS_PLACEHOLDERS === markerCount > 0, "LEGAL_HAS_PLACEHOLDERS tracks the markers");
// Pinned per doc (individual markers, not blocks). Filling or adding a
// marker must update these and the PR body. r3: privacy 26 → 27 (M4).
const MARKERS_EXPECTED = { privacy: 27, terms: 5 } as const;
const markersIn = (doc: LegalDoc) =>
  bodyText(doc).reduce((sum, text) => sum + (text.match(LEGAL_PLACEHOLDER_PATTERN_G)?.length ?? 0), 0);
for (const { kind, language, doc } of all) {
  const count = markersIn(doc);
  assert(
    count === MARKERS_EXPECTED[kind],
    `${kind}/${language}: ${count} markers, expected ${MARKERS_EXPECTED[kind]} (update MARKERS_EXPECTED + PR body when markers change)`,
  );
}
const pages = ["app/privacy/page.tsx", "app/terms/page.tsx", "app/en/privacy/page.tsx", "app/en/terms/page.tsx"];
for (const page of pages) {
  assert(read(page).includes("robots: LEGAL_ROBOTS"), `${page} sends LEGAL_ROBOTS`);
}
const legalLocs = [
  "https://wain.lol/privacy",
  "https://wain.lol/en/privacy",
  "https://wain.lol/terms",
  "https://wain.lol/en/terms",
];
const locs = listSitemapLocs();
const builtXml = buildSitemapXml();
const sitemapFile = read("public/sitemap.xml");
// Every sitemap source: listSitemapLocs() (lib/sitemap-xml.ts), the XML it
// builds (scripts/generate-sitemap.ts, prebuild) and the committed
// public/sitemap.xml. A Next metadata sitemap route would be a 4th source
// this check doesn't read, so fail if one appears.
for (const route of ["app/sitemap.ts", "app/sitemap.xml", "app/en/sitemap.ts", "app/sitemap.xml/route.ts"]) {
  assert(!existsSync(join(process.cwd(), route)), `${route} is a new sitemap source: teach check-legal about it`);
}
const sources = [
  ["listSitemapLocs()", (loc: string) => locs.includes(loc)],
  ["buildSitemapXml()", (loc: string) => builtXml.includes(`<loc>${loc}</loc>`)],
  ["public/sitemap.xml", (loc: string) => sitemapFile.includes(`<loc>${loc}</loc>`)],
] as const;
if (LEGAL_HAS_PLACEHOLDERS) {
  assert(
    LEGAL_ROBOTS?.index === false && LEGAL_ROBOTS.follow === true,
    "legal pages are noindex, follow while markers remain",
  );
  for (const loc of legalLocs) {
    for (const [name, has] of sources) {
      assert(!has(loc), `${loc} stays out of ${name} while markers remain`);
    }
  }
} else {
  assert(LEGAL_ROBOTS === undefined, "legal pages are indexable once the markers are gone");
  for (const loc of legalLocs) {
    for (const [name, has] of sources) {
      assert(has(loc), `${loc} is back in ${name} once the markers are gone (run npm run generate-sitemap)`);
    }
  }
}

// L-d / D1: invite-link copy ↔ invite code. The بيننا and analytics copy
// describes main's invite + tracking code. #252 changes it (random ids, no
// trackers on /h/, no raw text). Two guards so the copy can't silently go
// stale (see D1-PENDING.md for the post-#252 wording):
// 1. Semantic: each claim must still match the code it describes.
const chatSrc = read("components/chat.tsx");
const layoutSrc = read("app/layout.tsx");
const analyticsParams = read("lib/track.ts").match(/export type AnalyticsParams = \{[\s\S]*?\n\};/)?.[0] ?? "";
assert(analyticsParams, "lib/track.ts: AnalyticsParams type found");
const claims = [
  {
    name: "invite ID contains the pin",
    copy: privacyEn.includes("the invite ID contains your pin") || privacyAr.includes("معرّف الدعوة فيه نقطتك"),
    code: /encodeHalfwayInviteId\(/.test(chatSrc),
    where: "components/chat.tsx mints invite ids with encodeHalfwayInviteId",
  },
  {
    name: "/h/ reaches GTM pixels, DataFast and Vercel",
    copy: privacyEn.includes("While an invite link is open, its address also reaches") || privacyAr.includes("ولما يكون رابط الدعوة مفتوح"),
    code:
      layoutSrc.includes("googletagmanager.com/gtm.js") &&
      layoutSrc.includes("datafa.st/js/script.js") &&
      layoutSrc.includes("<Analytics />") &&
      !/TRACKERS_HEADER|trackers \?/.test(layoutSrc),
    where: "app/layout.tsx loads GTM, DataFast and <Analytics /> on every page, ungated",
  },
  {
    name: "typed chat / search text sent as text",
    copy: privacyEn.includes("is sent to Google Analytics as text") || privacyAr.includes("ينرسل كنص"),
    code: /\bquery_text\?:/.test(analyticsParams),
    where: "lib/track.ts AnalyticsParams has query_text",
  },
  {
    name: "results note handed to GTM",
    copy: privacyEn.includes("The note is handed to Google Tag Manager") || privacyAr.includes("الملاحظة تنرسل"),
    code: /\bfeedback_text\?:/.test(analyticsParams),
    where: "lib/track.ts AnalyticsParams has feedback_text",
  },
];
for (const claim of claims) {
  assert(
    claim.copy === claim.code,
    claim.copy
      ? `D1: the copy says "${claim.name}" but the code changed (${claim.where} is no longer true). Apply D1-PENDING.md to lib/legal.ts`
      : `D1: the copy no longer says "${claim.name}" but ${claim.where}. Restore the disclosure`,
  );
}
// 2. Review hook: the files that decide what an invite link exposes and
// which trackers load. Any change flags the copy for review. After
// re-reading the بيننا + analytics sections against the new code, update
// the hash here (sha256, first 16 hex chars).
const INVITE_CODE_REVIEWED: Record<string, string> = {
  "lib/halfway-invite.ts": "2f34b493c509b2de",
  "app/layout.tsx": "b20c019fa1c2cebb",
  "proxy.ts": "4628574a27da881a",
  "lib/track.ts": "67fa09a0e5af320f",
};
for (const [file, reviewed] of Object.entries(INVITE_CODE_REVIEWED)) {
  const actual = createHash("sha256").update(read(file)).digest("hex").slice(0, 16);
  assert(
    actual === reviewed,
    `${file} changed since the legal copy was reviewed (sha256 ${actual}, reviewed ${reviewed}). Re-check the بيننا + analytics copy in lib/legal.ts, then update INVITE_CODE_REVIEWED`,
  );
}

console.log(
  `check-legal: ok (${markerCount} marker blocks; markers privacy ${markersIn(LEGAL_DOCS.privacy.ar)}/${markersIn(LEGAL_DOCS.privacy.en)}, terms ${markersIn(LEGAL_DOCS.terms.ar)}/${markersIn(LEGAL_DOCS.terms.en)} AR/EN; noindex=${LEGAL_HAS_PLACEHOLDERS}, sitemap ${locs.length}; copy reflects GTM v${LEGAL_GTM_CONTAINER_VERSION}${liveGtm ? ` = live v${liveGtm}` : ", set LEGAL_GTM_LIVE_VERSION to compare"})`,
);
