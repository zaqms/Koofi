// Minimal types for @shuding/opentype.js, the opentype.js build Satori
// (next/og) uses to shape and paint text. Only what lib/og-rtl-text.tsx needs.
declare module "@shuding/opentype.js" {
  export type Font = {
    charToGlyphIndex(char: string): number;
    getAdvanceWidth(
      text: string,
      fontSize: number,
      options?: { letterSpacing?: number },
    ): number;
  };
  export function parse(buffer: ArrayBuffer): Font;
  const opentype: { parse: typeof parse };
  export default opentype;
}
