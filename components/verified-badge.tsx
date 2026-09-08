import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type VerifiedBadgeProps = {
  language: Language;
  size?: "card" | "list";
};

export function VerifiedBadge({
  language,
  size = "card",
}: VerifiedBadgeProps) {
  const compact = size === "list";
  return (
    <span
      className={
        compact
          ? "inline-flex shrink-0 items-center rounded-full border border-gold/70 bg-passport-wash px-1.5 py-0.5 text-[10px] leading-none text-gold"
          : "inline-flex items-center rounded-full border border-gold/70 bg-passport-wash px-2.5 py-1 text-[11px] leading-none text-gold"
      }
    >
      {copy.verified[language]}
    </span>
  );
}
