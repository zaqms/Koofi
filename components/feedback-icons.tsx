import type { ReactNode } from "react";

type IconTileProps = {
  size?: number;
  label?: string;
  voted?: boolean;
  children: ReactNode;
};

/** Dark charcoal squircle. Thin outline glyphs sit inside — not filled blobs. */
export function IconTile({ size = 40, label, voted, children }: IconTileProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={
        voted
          ? "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-charcoal shadow-[0_0_10px_rgba(168,213,160,0.55)]"
          : "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-charcoal shadow-[0_2px_8px_rgba(28,20,16,0.2)]"
      }
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

type GlyphProps = {
  size?: number;
  className?: string;
};

/** Page mark, empty state, add-idea. Thin white outline. */
export function LightbulbGlyph({ size = 22, className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className ?? "text-foam"}
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.4c2.7 0 4.9 2.1 4.9 4.8 0 1.7-.8 2.9-1.8 3.8-.5.5-.8 1.1-.9 1.8H9.8c-.1-.7-.4-1.3-.9-1.8-1-1-1.8-2.1-1.8-3.8 0-2.7 2.2-4.8 4.9-4.8Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M9.8 15.8h4.4M10.4 17.8h3.2M11.2 19.7h1.6"
      />
    </svg>
  );
}

/** Upvote. Pale green + glow when this browser already voted. */
export function ThumbsUpGlyph({
  size = 18,
  className,
  voted = false,
}: GlyphProps & { voted?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={
        className ??
        (voted
          ? "text-vote drop-shadow-[0_0_5px_rgba(168,213,160,0.9)]"
          : "text-foam")
      }
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.4 10.6h2.9v8.6H7.6c-1 0-1.8-.8-1.8-1.8v-5c0-1 .8-1.8 1.6-1.8Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 10.6V7.4c0-1.5 1-2.5 2.3-2.5 1 0 1.6.8 1.6 1.8v3.9h3.2c1.2 0 2.1.9 2 2.1l-.7 5.3c-.1 1.1-1.1 1.9-2.2 1.9h-6.2"
      />
    </svg>
  );
}

export function LightbulbTile({
  size = 44,
  glyph = 22,
  label,
}: {
  size?: number;
  glyph?: number;
  label?: string;
}) {
  return (
    <IconTile size={size} label={label}>
      <LightbulbGlyph size={glyph} />
    </IconTile>
  );
}

export function ThumbsUpTile({
  size = 36,
  voted = false,
  label,
}: {
  size?: number;
  voted?: boolean;
  label?: string;
}) {
  return (
    <IconTile size={size} label={label} voted={voted}>
      <ThumbsUpGlyph size={Math.round(size * 0.5)} voted={voted} />
    </IconTile>
  );
}
