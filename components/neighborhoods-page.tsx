"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DocumentLocale } from "@/components/document-locale";
import { NeighborhoodIcon } from "@/components/neighborhood-icons";
import {
  filterNeighborhoodRows,
  neighborhoodCafeCountLabel,
  type NeighborhoodRow,
} from "@/lib/browse-neighborhoods";
import { copy } from "@/lib/copy";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { homePath, neighborhoodsPath } from "@/lib/product";
import { trackEvent } from "@/lib/track";
import type { Language } from "@/lib/types";

type NeighborhoodsPageViewProps = {
  language: Language;
  rows: NeighborhoodRow[];
};

export function NeighborhoodsPageView({
  language,
  rows,
}: NeighborhoodsPageViewProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => filterNeighborhoodRows(rows, query),
    [rows, query],
  );

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="relative flex items-start justify-between gap-3">
        <Link
          href={homePath(language)}
          className="inline-flex size-9 shrink-0 items-center justify-center text-ink"
          aria-label={copy.backToChat[language]}
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {language === "ar" ? (
              <path d="M6 3.2 11.2 8 6 12.8" />
            ) : (
              <path d="M10 3.2 4.8 8 10 12.8" />
            )}
          </svg>
        </Link>
        <div className="min-w-0 flex-1 pt-0.5 text-center">
          <h1 className="text-[1.15rem] font-semibold leading-7 text-ink">
            {copy.neighborhoodsIndex[language]}
          </h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">
            {copy.neighborhoodsIndexHint[language]}
          </p>
        </div>
        <Link
          href={neighborhoodsPath(other)}
          className="inline-flex h-9 shrink-0 items-center text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>

      <label className="sr-only" htmlFor="neighborhood-search">
        {copy.neighborhoodsSearch[language]}
      </label>
      <div className="relative mt-5">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-ink-soft"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="size-4"
          >
            <circle cx="11" cy="11" r="6.2" />
            <path d="m16 16 4 4" />
          </svg>
        </span>
        <input
          id="neighborhood-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.neighborhoodsSearch[language]}
          className="h-11 w-full rounded-full border border-line bg-foam pe-4 ps-10 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-bean"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-soft">
          {copy.neighborhoodsEmpty[language]}
        </p>
      ) : (
        <ul className="mt-3">
          {visible.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                onClick={() => {
                  const hood = NEIGHBORHOODS[row.id];
                  trackEvent(
                    "district_select",
                    {
                      district_id: hood.id,
                      district_ar: hood.ar,
                      district_en: hood.en,
                      locale: language,
                    },
                    { dedupeKey: `district_select:${hood.id}` },
                  );
                }}
                className="flex items-center gap-3 border-b border-line/80 py-3.5 text-ink"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-foam text-ink-soft">
                  <NeighborhoodIcon kind={row.icon} className="size-[1.35rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-5">
                    {row.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-ink-soft">
                    {neighborhoodCafeCountLabel(row.cafeCount, language)}
                  </span>
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5 shrink-0 text-ink-soft"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {language === "ar" ? (
                    <path d="M10 3.2 4.8 8 10 12.8" />
                  ) : (
                    <path d="M6 3.2 11.2 8 6 12.8" />
                  )}
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
