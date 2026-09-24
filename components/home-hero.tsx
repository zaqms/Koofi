import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/**
 * Bare-home introduction. The skyline is a top band only.
 * The headline sits entirely below that band so no painted pixel can cross the glyphs.
 */
export function HomeHero({ language }: HomeHeroProps) {
  const arabic = language === "ar";
  return (
    <div className="relative -mx-4" data-riyadh-hero="">
      {/* End-aligned band. The start column stays clear for the wordmark; the h1 is below the band. */}
      <div className="pointer-events-none flex h-[14.5rem] overflow-hidden" data-riyadh-hero-art="">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/riyadh-hero.svg"
          alt=""
          width={360}
          height={220}
          className="ms-auto h-full w-[62%] object-contain object-top"
        />
      </div>
      <h1
        className={
          arabic
            ? "px-4 pt-5 pb-1 text-[1.9rem] font-medium leading-[1.35] tracking-tight text-ink"
            : "px-4 pt-5 pb-1 font-serif text-[2.15rem] font-medium leading-[1.12] tracking-[-0.02em] text-ink"
        }
      >
        {arabic ? copy.opener : copy.openerEn}
      </h1>
    </div>
  );
}
