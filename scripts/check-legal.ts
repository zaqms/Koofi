/**
 * Privacy + terms lock (PR #251 r2). Guards the r1 QA findings:
 * no "cafés, not coordinates" claim (H1), Google Ads remarketing (M1) and
 * OpenAI advanced matching (M2) disclosed, Latin identifiers isolated for
 * RTL (L2), and noindex + out of the sitemap while review markers remain (L8).
 * Brand: Wain / وين only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEGAL_DOCS,
  LEGAL_HAS_PLACEHOLDERS,
  LEGAL_LTR_PATTERN,
  LEGAL_PLACEHOLDER_PATTERN,
  LEGAL_ROBOTS,
  type LegalDoc,
} from "../lib/legal";
import { listSitemapLocs } from "../lib/sitemap-xml";

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

const privacyAr = bodyText(LEGAL_DOCS.privacy.ar).join("\n");
const privacyEn = bodyText(LEGAL_DOCS.privacy.en).join("\n");
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
const sitemapFile = read("public/sitemap.xml");
if (LEGAL_HAS_PLACEHOLDERS) {
  assert(
    LEGAL_ROBOTS?.index === false && LEGAL_ROBOTS.follow === true,
    "legal pages are noindex, follow while markers remain",
  );
  for (const loc of legalLocs) {
    assert(!locs.includes(loc), `${loc} stays out of listSitemapLocs() while markers remain`);
    assert(!sitemapFile.includes(`<loc>${loc}</loc>`), `${loc} stays out of public/sitemap.xml while markers remain`);
  }
} else {
  assert(LEGAL_ROBOTS === undefined, "legal pages are indexable once the markers are gone");
  for (const loc of legalLocs) {
    assert(locs.includes(loc), `${loc} is back in the sitemap once the markers are gone`);
  }
}

console.log(
  `check-legal: ok (${markerCount} marker blocks, noindex=${LEGAL_HAS_PLACEHOLDERS}, sitemap ${locs.length})`,
);
