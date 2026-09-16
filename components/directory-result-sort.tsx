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
};

/** Matcha results sort pills. Selected terracotta, inactive Paper. */
export function DirectoryResultSortPills({
  language,
  sort,
  onPick,
}: DirectoryResultSortPillsProps) {
  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      role="tablist"
      aria-label={copy.directorySortLabel[language]}
      data-directory-sorts=""
    >
      {DIRECTORY_RESULT_SORTS.map((id) => {
        const selected = sort === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-sort={id}
            onClick={() => onPick(id)}
            className={
              selected
                ? "h-8 rounded-full bg-bean px-3 text-[13px] text-foam"
                : "h-8 rounded-full border border-line bg-paper px-3 text-[13px] text-ink"
            }
          >
            {DIRECTORY_SORT_COPY[id][language]}
          </button>
        );
      })}
    </div>
  );
}
