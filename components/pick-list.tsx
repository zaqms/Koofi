"use client";

import Link from "next/link";
import { BeenButton } from "@/components/been-button";
import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

export type ChatPick = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoodLabel: string;
  example: boolean;
  why: string;
  cardPath: string;
};

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
        const name = language === "ar" ? pick.nameAr : pick.nameEn;
        const other = language === "ar" ? pick.nameEn : pick.nameAr;

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
              {pick.example ? (
                <span className="shrink-0 rounded-full bg-paper-deep px-2 py-0.5 text-[11px] text-ink-soft">
                  {copy.exampleBadge[language]}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6">{pick.why}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={pick.cardPath}
                className="rounded-full bg-bean px-3 py-1 text-xs text-foam hover:bg-bean-deep"
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
