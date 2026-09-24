import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/** Editorial headline with the Riyadh skyline sitting on the end side. */
export function HomeHero({ language }: HomeHeroProps) {
  const arabic = language === "ar";
  return (
    <div
      className="relative flex min-h-[8.75rem] items-center overflow-hidden py-4"
      data-riyadh-hero=""
    >
      <h1
        className={
          arabic
            ? "relative z-10 max-w-[13rem] text-[1.7rem] font-medium leading-[1.35] tracking-tight text-ink"
            : "relative z-10 max-w-[15.5rem] font-serif text-[1.95rem] font-medium leading-[1.12] tracking-[-0.02em] text-ink"
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
        className="pointer-events-none absolute end-0 top-1/2 h-[7rem] w-[15rem] -translate-y-1/2 object-contain object-end"
      />
    </div>
  );
}
