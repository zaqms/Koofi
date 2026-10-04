import type { CSSProperties, ReactElement } from "react";
import opentype from "@shuding/opentype.js";
import { ogBidiUnits } from "./og-bidi";

/**
 * Right-to-left text for Satori (next/og) cards.
 *
 * Satori has no bidi: it paints the words of a line left-to-right in logical
 * order and ignores `direction`. It also sizes text boxes from the sum of
 * the *isolated* glyph widths, while it paints the *joined* (shaped) Arabic
 * forms, so a word's box is wider or narrower than its ink («نونا» box
 * 108px, ink 66px at 54px) and the gaps between words come out uneven or
 * vanish («هاوس اوف» → «اوفهاوس»).
 *
 * So the line is split into units (lib/og-bidi.ts), laid out right-to-left
 * in a `row-reverse` flex row with explicit gaps, and every unit the card
 * font fully covers gets an explicit width: its shaped advance, measured with
 * the same opentype.js build Satori paints with. Units the font does not
 * cover (Latin with the Arabic-only font, Hangul) keep Satori's own width,
 * which is right for unjoined scripts.
 */
export const OG_RTL_ROW: CSSProperties = {
  display: "flex",
  flexDirection: "row-reverse",
  flexWrap: "wrap",
};

/** Shaped advance of `text` in the card font, or null if the font lacks a glyph. */
export type OgTextMeasure = (text: string, fontSize: number) => number | null;

const measurers = new Map<string, OgTextMeasure | null>();

function fontKey(font: ArrayBuffer): string {
  const bytes = new Uint8Array(font, 0, Math.min(font.byteLength, 8192));
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash = Math.imul(hash ^ bytes[i]!, 0x01000193) >>> 0;
  }
  return `${font.byteLength}:${hash.toString(16)}`;
}

/** Measurer for a font buffer (parsed once per process per font). */
export function ogFontMeasurer(
  font: ArrayBuffer | null | undefined,
): OgTextMeasure | null {
  if (!font) return null;
  const key = fontKey(font);
  if (measurers.has(key)) return measurers.get(key)!;
  let measure: OgTextMeasure | null = null;
  try {
    const parsed = opentype.parse(font);
    measure = (text, fontSize) => {
      for (const ch of text) {
        if (!/\s/.test(ch) && parsed.charToGlyphIndex(ch) === 0) return null;
      }
      return parsed.getAdvanceWidth(text, fontSize, { letterSpacing: 0 });
    };
  } catch {
    measure = null; // unparseable font: fall back to Satori's own widths
  }
  if (measurers.size > 8) measurers.clear();
  measurers.set(key, measure);
  return measure;
}

/**
 * Extra word space on top of the font's own (Plex Arabic's is 0.235em).
 * Joined Arabic overhangs its advance (the tail of ر, the stroke of ك), so
 * at the bare space «بار كافيه» reads as «باركافيه»; 0.08em keeps it apart.
 */
export const OG_RTL_EXTRA_GAP_EM = 0.08;

/** Space between words: the font's space advance (else 0.25em) + the extra. */
export function ogRtlGap(fontSize: number, measure?: OgTextMeasure | null): number {
  const space = measure?.(" ", fontSize);
  return (space && space > 0 ? space : fontSize * 0.25) + fontSize * OG_RTL_EXTRA_GAP_EM;
}

/**
 * Children for an `OG_RTL_ROW` container: one box per unit, in logical
 * order (row-reverse puts the first on the right).
 */
export function ogRtlUnits(
  text: string,
  fontSize: number,
  measure?: OgTextMeasure | null,
): ReactElement[] {
  const gap = ogRtlGap(fontSize, measure);
  return ogBidiUnits(text).map((unit, index, all) => {
    const width = measure?.(unit.text, fontSize) ?? null;
    return (
      <div
        key={index}
        style={{
          display: "flex",
          flexShrink: 0,
          ...(width === null ? {} : { width }),
          // row-reverse: the next unit sits to the left, so the gap goes there.
          marginLeft: unit.spaceAfter && index + 1 < all.length ? gap : 0,
        }}
      >
        {unit.text}
      </div>
    );
  });
}
