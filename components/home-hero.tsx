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
  ar: { src: "/brand/riyadh-hero-ar.webp", width: 1600, height: 694 },
  en: { src: "/brand/riyadh-hero-en.webp", width: 1600, height: 693 },
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

  const line = (
    <h1
      className={
        arabic
          ? "text-start text-[1.35rem] font-medium leading-snug tracking-tight text-ink"
          : "font-serif text-[1.2rem] font-medium leading-[1.15] tracking-[-0.02em] text-ink"
      }
    >
      {HOME_HERO_LINE[language]}
    </h1>
  );

  if (cityId !== "riyadh") {
    return (
      <div
        className="relative -mx-4 pt-[3.75rem]"
        data-riyadh-hero=""
        data-hero-city={cityId}
      >
        <div className="flex items-center gap-2" dir={arabic ? "rtl" : "ltr"}>
          <div
            className={
              arabic
                ? "w-max max-w-[64%] shrink-0 py-1 pe-2"
                : "w-max max-w-[54%] shrink-0 py-1 ps-4"
            }
          >
            {line}
          </div>
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

  return (
    <div
      className="relative -mx-4 pt-[3.75rem]"
      data-riyadh-hero=""
      data-hero-city={cityId}
    >
      <div className="relative" data-riyadh-hero-art="">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          className={
            arabic
              ? "block h-auto w-full object-contain object-left"
              : "block h-auto w-full object-contain object-right"
          }
        />
        <div
          className={
            arabic
              ? "absolute top-[36%] right-0 w-[32%] -translate-y-1/2 pe-4"
              : "absolute top-[36%] left-0 w-[38%] -translate-y-1/2 ps-4"
          }
        >
          {line}
        </div>
      </div>
    </div>
  );
}
