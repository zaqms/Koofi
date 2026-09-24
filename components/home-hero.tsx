import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/**
 * Bare-home editorial row. Headline and skyline share one band
 * under the header. The drawing stays on the end edge, clear of the glyphs.
 */
export function HomeHero({ language }: HomeHeroProps) {
  const arabic = language === "ar";
  return (
    <div className="relative -mx-4 pt-[3.75rem]" data-riyadh-hero="">
      <div className="flex items-center gap-4" dir="ltr">
        <h1
          dir={arabic ? "rtl" : "ltr"}
          className={
            arabic
              ? "w-[48%] shrink-0 py-1 ps-4 text-start text-[1.85rem] font-medium leading-[1.28] tracking-tight text-ink"
              : "w-[50%] shrink-0 py-1 ps-4 font-serif text-[1.85rem] font-medium leading-[1.12] tracking-[-0.02em] text-ink"
          }
        >
          {arabic ? copy.opener : copy.openerEn}
        </h1>
        <div
          className="pointer-events-none relative h-[10.25rem] min-w-0 flex-1 overflow-hidden"
          data-riyadh-hero-art=""
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/riyadh-hero.svg"
            alt=""
            width={360}
            height={220}
            className="absolute inset-y-0 right-0 h-full w-auto max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
