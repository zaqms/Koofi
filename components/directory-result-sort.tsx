"use client";

import { copy } from "@/lib/copy";
import {
  DIRECTORY_RESULT_SORTS,
  DIRECTORY_SORT_COPY,
  type DirectoryResultSort,
} from "@/lib/directory-sort";
import type { Language } from "@/lib/types";

type DirectoryResultSortPillsProps = {
  language: Language;
  sort: DirectoryResultSort;
  onPick: (next: DirectoryResultSort) => void;
  nearbyAvailable: boolean;
  showNearbyHint?: boolean;
};

/** Matcha + Drive-through results sort pills. Selected terracotta, inactive Paper. */
export function DirectoryResultSortPills({
  language,
  sort,
  onPick,
  nearbyAvailable,
  showNearbyHint = false,
}: DirectoryResultSortPillsProps) {
  return (
    <div>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="tablist"
        aria-label={copy.directorySortLabel[language]}
        data-directory-sorts=""
      >
        {DIRECTORY_RESULT_SORTS.map((id) => {
          const selected = sort === id;
          const nearbyBlocked = id === "nearby" && !nearbyAvailable;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-disabled={nearbyBlocked || undefined}
              data-sort={id}
              data-nearby-blocked={nearbyBlocked ? "" : undefined}
              onClick={() => onPick(id)}
              className={
                selected
                  ? "h-8 rounded-full bg-bean px-3 text-[13px] text-foam"
                  : nearbyBlocked
                    ? "h-8 rounded-full border border-line bg-paper px-3 text-[13px] text-ink/45"
                    : "h-8 rounded-full border border-line bg-paper px-3 text-[13px] text-ink"
              }
            >
              {DIRECTORY_SORT_COPY[id][language]}
            </button>
          );
        })}
      </div>
      {showNearbyHint ? (
        <p
          className="mt-2 text-[12px] leading-5 text-ink-soft"
          data-directory-sort-nearby-hint=""
        >
          {copy.directorySortNearbyHint[language]}
        </p>
      ) : null}
    </div>
  );
}
