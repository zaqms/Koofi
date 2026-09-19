"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  cityLabel,
  cityStatus,
  isLiveCity,
  listCityRegistry,
  type CityId,
} from "@/lib/cities";
import { useCity } from "@/lib/city-context";
import { copy } from "@/lib/copy";
import { homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type CitySelectorProps = {
  language: Language;
};

function isBareHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/en";
}

export function CitySelector({ language }: CitySelectorProps) {
  const { cityId, selectCity } = useCity();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const rtl = language === "ar";
  const cities = listCityRegistry();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: CityId) {
    selectCity(id);
    setOpen(false);
    if (!isLiveCity(id) && !isBareHomePath(pathname)) {
      router.push(homePath(language));
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      data-city-selector=""
      data-city-id={cityId}
      data-city-status={cityStatus(cityId)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={copy.changeCity[language]}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 max-w-[11rem] items-center gap-1 rounded-full border border-line bg-foam px-2.5 text-[12px] leading-none text-ink"
      >
        <span className="min-w-0 truncate">{cityLabel(cityId, language)}</span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="size-2.5 shrink-0 text-ink-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M2.4 4.2 6 8l3.6-3.8" />
        </svg>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={copy.moreCities[language]}
          dir={rtl ? "rtl" : "ltr"}
          lang={language}
          className="absolute end-0 z-30 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-2xl border border-line bg-foam py-1 shadow-[0_10px_28px_rgba(30,23,20,0.08)]"
        >
          {cities.map((row) => {
            const selected = row.id === cityId;
            const comingSoon = row.status === "comingSoon";
            return (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={selected}
                data-city-option={row.id}
                data-city-option-status={row.status}
                onClick={() => pick(row.id)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-[13px] leading-5 text-ink hover:bg-paper-deep"
              >
                <span className="min-w-0 truncate font-medium">
                  {cityLabel(row.id, language)}
                </span>
                {comingSoon ? (
                  <span className="shrink-0 text-[11px] text-ink-soft">
                    {copy.comingSoon[language]}
                  </span>
                ) : selected ? (
                  <span aria-hidden className="shrink-0 text-bean">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
