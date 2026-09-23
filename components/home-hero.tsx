import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type HomeHeroProps = {
  language: Language;
};

/** P0 landing headline. Support line stays in copy for share cards, not under the title. */
export function HomeHero({ language }: HomeHeroProps) {
  return (
    <div className="text-start">
      <h1 className="text-[1.7rem] font-semibold leading-8 tracking-tight text-ink sm:text-[2rem] sm:leading-10">
        {language === "ar" ? copy.opener : copy.openerEn}
      </h1>
    </div>
  );
}
