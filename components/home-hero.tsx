import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/** P0 landing chrome. Headline + support only — no eyebrow slogans. */
export function HomeHero({ language }: HomeHeroProps) {
  return (
    <div className="space-y-2.5 text-center">
      <h1 className="text-[1.85rem] font-semibold leading-10 tracking-tight text-ink sm:text-4xl sm:leading-12">
        {language === "ar" ? copy.opener : copy.openerEn}
      </h1>
      <p className="text-[15px] leading-6 text-ink-soft">
        {copy.homeSupport[language]}
      </p>
    </div>
  );
}
