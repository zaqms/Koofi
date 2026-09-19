"use client";

import {
  backToLiveCityLabel,
  comingSoonBody,
  comingSoonHeading,
  comingSoonLiveHint,
  DEFAULT_LIVE_CITY,
  type CityId,
} from "@/lib/cities";
import { useCity } from "@/lib/city-context";
import type { Language } from "@/lib/types";

type ComingSoonCityProps = {
  language: Language;
  city: CityId;
};

export function ComingSoonCity({ language, city }: ComingSoonCityProps) {
  const { selectCity } = useCity();
  const rtl = language === "ar";

  return (
    <section
      className="mx-auto w-full max-w-md px-4 py-10 text-center"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      data-coming-soon-city={city}
      aria-labelledby="coming-soon-city"
    >
      <p className="text-[11px] font-medium tracking-wide text-ink-soft uppercase">
        wain.lol
      </p>
      <h2
        id="coming-soon-city"
        className="mt-2 text-[1.65rem] font-semibold leading-9 tracking-tight text-ink"
      >
        {comingSoonHeading(language, city)}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-ink-soft">
        {comingSoonBody(language, city)}
      </p>
      <p className="mt-2 text-[13px] leading-5 text-ink-soft">
        {comingSoonLiveHint(language)}
      </p>
      <button
        type="button"
        data-back-to-live-city=""
        onClick={() => selectCity(DEFAULT_LIVE_CITY)}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-bean px-5 text-sm text-foam"
      >
        {backToLiveCityLabel(language)}
      </button>
    </section>
  );
}
