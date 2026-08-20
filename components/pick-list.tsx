"use client";

import Link from "next/link";
import { BeenButton } from "@/components/been-button";
import { copy } from "@/lib/copy";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import type { ChatPick, Language } from "@/lib/types";

export type { ChatPick };

type PickListProps = {
  picks: ChatPick[];
  language: Language;
  beenIds: string[];
  onBeen: (id: string) => void;
};

export function PickList({ picks, language, beenIds, onBeen }: PickListProps) {
  return (
    <ol className="mt-3 grid gap-2">
      {picks.map((pick, index) => {
        const name = shopDisplayName(pick, language);
        const other = shopDisplayName(
          pick,
          language === "ar" ? "en" : "ar",
        );

        return (
          <li
            key={pick.id}
            className="rounded-2xl border border-line bg-foam px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-soft">{index + 1}</p>
                <h3 className="text-base font-semibold leading-tight">{name}</h3>
                <p className="text-xs text-ink-soft" dir="auto">
                  {other} · {pick.neighborhoodLabel}
                </p>
              </div>
              {isExampleShop(pick) ? (
                <span className="shrink-0 rounded-full bg-paper-deep px-2 py-0.5 text-[11px] text-ink-soft">
                  {exampleBadge(language)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6">{pick.why}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={pick.mapsHref}
                className="rounded-full bg-bean px-3 py-1 text-xs text-foam hover:bg-bean-deep"
              >
                {copy.maps[language]}
              </a>
              <Link
                href={pick.cardPath}
                className="text-xs text-ink-soft underline-offset-2 hover:underline"
              >
                {copy.cardLink[language]}
              </Link>
              <BeenButton
                marked={beenIds.includes(pick.id)}
                language={language}
                onMark={() => onBeen(pick.id)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
