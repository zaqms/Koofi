/**
 * Bidi-lite for Satori (next/og ImageResponse) share cards.
 *
 * Satori has no Unicode bidi: it paints the words of a line left-to-right in
 * logical order, so «دا نونا» comes out as «نونا دا»; `direction: rtl` is
 * ignored. A pure-Arabic word on its own is shaped correctly, but a token
 * that mixes Arabic letters with punctuation («(البشور)») loses its joining,
 * and the space between two Arabic words is sometimes dropped
 * («هاوس اوف» → «اوفهاوس»).
 *
 * So the RTL line is split into units Satori can paint on its own, in
 * logical order:
 *   - one unit per Arabic word (Arabic letters + marks only),
 *   - one unit per punctuation mark resolved RTL (brackets mirrored),
 *   - one unit per LTR island (Latin words, digits; spaces inside kept),
 * and the caller lays them out in a `flex-direction: row-reverse` row with
 * explicit gaps where the text had whitespace (see lib/og-rtl-text.tsx).
 *
 * Resolution is a small subset of UAX #9 for a single RTL paragraph:
 * strong R (Arabic/Hebrew letters), strong L (other letters), EN (digits);
 * EN after an L stays with the Latin (W7); neutrals take the direction of
 * their neighbours if both sides agree, otherwise the paragraph's (RTL),
 * with EN counting as R (N1/N2). No embeddings or isolates (control
 * characters are dropped).
 */

export type OgBidiUnit = {
  text: string;
  dir: "rtl" | "ltr";
  /** Whitespace follows this unit in logical order (draw a gap). */
  spaceAfter: boolean;
};

type Cls = "R" | "L" | "EN" | "WS" | "N" | "NSM" | "X";

const MIRROR: Record<string, string> = {
  "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{",
  "<": ">", ">": "<", "«": "»", "»": "«", "‹": "›", "›": "‹",
};

function classify(cp: number): Cls {
  const ch = String.fromCodePoint(cp);
  if (/\s/.test(ch)) return "WS";
  if (cp === 0x200e) return "L"; // LRM
  if (cp === 0x200f || cp === 0x061c) return "R"; // RLM, ALM
  if ((cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069) || cp === 0xfeff) {
    return "X"; // embeddings / isolates / BOM: dropped
  }
  if (cp === 0x200c || cp === 0x200d) return "NSM"; // ZWNJ / ZWJ stay inside the word
  if ((cp >= 0x30 && cp <= 0x39) || (cp >= 0x660 && cp <= 0x669) || (cp >= 0x6f0 && cp <= 0x6f9)) {
    return "EN";
  }
  if (cp >= 0x300 && cp <= 0x36f) return "NSM"; // Latin combining marks
  if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) return "L"; // ASCII letters
  // Arabic-script punctuation is neutral: ، ؛ ؟ ٪ ٫ ٬ ٭ ۔
  if ([0x60c, 0x61b, 0x61f, 0x66a, 0x66b, 0x66c, 0x66d, 0x6d4].includes(cp)) return "N";
  if (
    (cp >= 0x590 && cp <= 0x5ff) || // Hebrew
    (cp >= 0x600 && cp <= 0x6ff) || // Arabic
    (cp >= 0x750 && cp <= 0x77f) || // Arabic Supplement
    (cp >= 0x8a0 && cp <= 0x8ff) || // Arabic Extended-A
    (cp >= 0xfb1d && cp <= 0xfdff) || // Hebrew / Arabic presentation forms A
    (cp >= 0xfe70 && cp <= 0xfeff) // Arabic presentation forms B
  ) {
    return "R";
  }
  if (
    cp < 0x80 || // remaining ASCII: punctuation and symbols
    (cp >= 0xa0 && cp <= 0xbf) ||
    cp === 0xd7 || cp === 0xf7 ||
    (cp >= 0x2000 && cp <= 0x2bff) || // general punctuation, symbols, arrows
    (cp >= 0x3000 && cp <= 0x303f) || // CJK punctuation
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff01 && cp <= 0xff0f) ||
    cp >= 0x1f000 // emoji and pictographs
  ) {
    return "N";
  }
  return "L"; // any other letter (Latin, Greek, Cyrillic, CJK, Hangul…)
}

/** True when the text has an RTL letter (so it needs the RTL layout at all). */
export function hasRtlText(text: string): boolean {
  for (const ch of text) if (classify(ch.codePointAt(0)!) === "R") return true;
  return false;
}

/**
 * Split an RTL-paragraph line into Satori-paintable units, in logical order.
 * Render them in a `row-reverse` flex row (first unit on the right).
 */
export function ogBidiUnits(text: string): OgBidiUnit[] {
  const chars = Array.from(text.trim().replace(/\s+/g, " "));
  const cls: Cls[] = chars.map((ch) => classify(ch.codePointAt(0)!));
  // Marks inherit the class of what they sit on.
  for (let i = 0; i < cls.length; i += 1) {
    if (cls[i] === "NSM") cls[i] = i > 0 ? cls[i - 1]! : "N";
  }
  // W7: digits after a Latin letter belong to the Latin run.
  let lastStrong: Cls = "R";
  for (let i = 0; i < cls.length; i += 1) {
    if (cls[i] === "R" || cls[i] === "L") lastStrong = cls[i]!;
    else if (cls[i] === "EN" && lastStrong === "L") cls[i] = "L";
  }
  // N1/N2: neutrals between two L stay L; everything else is the paragraph's R.
  const strongAt = (i: number, step: 1 | -1): "R" | "L" => {
    for (let j = i + step; j >= 0 && j < cls.length; j += step) {
      if (cls[j] === "L") return "L";
      if (cls[j] === "R" || cls[j] === "EN") return "R";
    }
    return "R"; // sos / eos of an RTL paragraph
  };
  const res: ("R" | "L" | "EN" | "WSR" | "X")[] = cls.map((c, i) => {
    if (c === "X") return "X";
    if (c === "R" || c === "L" || c === "EN") return c;
    const both = strongAt(i, -1) === "L" && strongAt(i, 1) === "L";
    if (c === "WS") return both ? "L" : "WSR";
    return both ? "L" : "R";
  });

  const units: OgBidiUnit[] = [];
  let i = 0;
  while (i < chars.length) {
    const r = res[i]!;
    if (r === "X") { i += 1; continue; }
    if (r === "WSR") {
      const last = units[units.length - 1];
      if (last) last.spaceAfter = true;
      i += 1;
      continue;
    }
    if (r === "L" || r === "EN") {
      // LTR island: Latin, digits and the neutrals/spaces resolved L between them.
      let s = "";
      while (i < chars.length && (res[i] === "L" || res[i] === "EN" || res[i] === "X")) {
        if (res[i] !== "X") s += chars[i];
        i += 1;
      }
      units.push({ text: s, dir: "ltr", spaceAfter: false });
      continue;
    }
    // r === "R": an Arabic word (letters + marks), or one RTL neutral.
    if (cls[i] === "R") {
      let s = "";
      while (i < chars.length && res[i] === "R" && cls[i] === "R") { s += chars[i]; i += 1; }
      units.push({ text: s, dir: "rtl", spaceAfter: false });
    } else {
      const ch = chars[i]!;
      units.push({ text: MIRROR[ch] ?? ch, dir: "rtl", spaceAfter: false });
      i += 1;
    }
  }
  return units;
}

/** Visual (left-to-right) string of the units, for tests and debugging. */
export function ogBidiVisual(text: string): string {
  return ogBidiUnits(text)
    .map((u, k, all) => (k + 1 < all.length && u.spaceAfter ? ` ${u.text}` : u.text))
    .reverse()
    .join("");
}
