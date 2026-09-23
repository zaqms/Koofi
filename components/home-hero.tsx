import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/** Editorial headline with the Riyadh skyline sitting on the end side. */
export function HomeHero({ language }: HomeHeroProps) {
  const arabic = language === "ar";
  return (
    <div className="relative min-h-[5.25rem] overflow-hidden" data-riyadh-hero="">
      <h1
        className={
          arabic
            ? "relative z-10 max-w-[12.5rem] text-[1.35rem] font-medium leading-[1.35] tracking-tight text-ink"
            : "relative z-10 max-w-[14.75rem] font-serif text-[1.55rem] font-medium leading-[1.15] tracking-[-0.02em] text-ink"
        }
      >
        {arabic ? copy.opener : copy.openerEn}
      </h1>
      {/* Decorative skyline. The headline is the accessible name. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/riyadh-hero.svg"
        alt=""
        width={360}
        height={220}
        className="pointer-events-none absolute end-0 -top-0.5 h-[5.65rem] w-[12.25rem] object-contain object-end"
      />
    </div>
  );
}
