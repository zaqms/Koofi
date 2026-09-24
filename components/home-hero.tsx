"use client";

import { useCity } from "@/lib/city-context";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/** Bare-home headline only. Other screens keep LOCKED_OPENER. */
export const HOME_HERO_LINE = {
  ar: "هلا، وين ودك تروح اليوم..",
  en: "Hey, where are we going today..",
} as const;

/** Riyadh ships Amjad’s art. Jeddah and Dammam keep the current skyline until their art arrives. */
const RIYADH_ART = {
  ar: { src: "/brand/riyadh-hero-ar.webp", width: 1026, height: 626 },
  en: { src: "/brand/riyadh-hero-en.webp", width: 900, height: 657 },
} as const;

const FALLBACK_ART = { src: "/brand/riyadh-hero.svg", width: 360, height: 220 };

/**
 * Native two-column banner. Arabic: drawing on the left, type on the right.
 * English: type on the left, drawing on the right.
 */
export function HomeHero({ language }: HomeHeroProps) {
  const { cityId } = useCity();
  const arabic = language === "ar";
  const art = cityId === "riyadh" ? RIYADH_ART[language] : FALLBACK_ART;

  return (
    <div
      className="relative -mx-4 pt-[3.75rem]"
      data-riyadh-hero=""
      data-hero-city={cityId}
    >
      <div className="flex items-center gap-2" dir={arabic ? "rtl" : "ltr"}>
        <h1
          className={
            arabic
              ? "w-max max-w-[64%] shrink-0 py-1 pe-2 text-start text-[1.35rem] font-medium leading-snug tracking-tight text-ink"
              : "w-max max-w-[54%] shrink-0 py-1 ps-4 font-serif text-[1.45rem] font-medium leading-[1.15] tracking-[-0.02em] text-ink"
          }
        >
          {HOME_HERO_LINE[language]}
        </h1>
        <div
          className="pointer-events-none relative h-[8.5rem] min-w-0 flex-1"
          data-riyadh-hero-art=""
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art.src}
            alt=""
            width={art.width}
            height={art.height}
            className={
              arabic
                ? "h-full w-full object-contain object-left"
                : "h-full w-full object-contain object-right"
            }
          />
        </div>
      </div>
    </div>
  );
}
