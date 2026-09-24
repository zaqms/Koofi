import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/**
 * One bare-home banner. The skyline fills the hero and sits on the
 * headline; the type stays in the clear band under the painted art.
 */
export function HomeHero({ language }: HomeHeroProps) {
  const arabic = language === "ar";
  return (
    <div className="relative -mx-4 flex min-h-[28rem] flex-col" data-riyadh-hero="">
      <div
        className="pointer-events-none relative min-h-[16rem] flex-1 overflow-hidden"
        data-riyadh-hero-art=""
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/riyadh-hero.svg"
          alt=""
          width={360}
          height={220}
          className="absolute inset-x-0 bottom-0 h-[118%] w-full object-contain object-bottom"
        />
      </div>
      <h1
        className={
          arabic
            ? "-mt-6 px-6 pb-3 text-[1.9rem] font-medium leading-[1.35] tracking-tight text-ink"
            : "-mt-6 px-6 pb-3 font-serif text-[2.15rem] font-medium leading-[1.12] tracking-[-0.02em] text-ink"
        }
      >
        {arabic ? copy.opener : copy.openerEn}
      </h1>
    </div>
  );
}
