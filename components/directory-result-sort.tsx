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
  /** Control order. Matcha / Drive-through keep Nearby, New, A–Z. */
  sorts?: readonly DirectoryResultSort[];
  labels?: Record<DirectoryResultSort, { ar: string; en: string }>;
  /** District results use the same pills with their own order and marker. */
  marker?: "directory" | "district";
};

/** Shared compact sort chips. Selected terracotta, inactive Paper + line. */
export function DirectoryResultSortPills({
  language,
  sort,
  onPick,
  nearbyAvailable,
  showNearbyHint = false,
  sorts = DIRECTORY_RESULT_SORTS,
  labels = DIRECTORY_SORT_COPY,
  marker = "directory",
}: DirectoryResultSortPillsProps) {
  return (
    <div>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="tablist"
        aria-label={copy.directorySortLabel[language]}
        data-directory-sorts={marker === "directory" ? "" : undefined}
        data-district-cafe-sorts={marker === "district" ? "" : undefined}
      >
        {sorts.map((id) => {
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
              {labels[id][language]}
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
