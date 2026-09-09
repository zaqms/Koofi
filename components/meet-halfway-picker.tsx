"use client";

import { useMemo, useState } from "react";
import { copy } from "@/lib/copy";
import { listDirectoryShops } from "@/lib/catalog";
import { directoryNeighborhoods } from "@/lib/directory";
import type { HalfwayInput } from "@/lib/meet-halfway";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import type { Language, NeighborhoodId } from "@/lib/types";

type MeetHalfwayPickerProps = {
  language: Language;
  disabled?: boolean;
  onSubmit: (locations: HalfwayInput[]) => void;
};

function DistrictSelect({
  id,
  label,
  value,
  language,
  areas,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: NeighborhoodId | "";
  language: Language;
  areas: NeighborhoodId[];
  disabled?: boolean;
  onChange: (next: NeighborhoodId | "") => void;
}) {
  return (
    <label className="block text-start" htmlFor={id}>
      <span className="mb-1 block text-[11px] leading-4 text-ink-soft">
        {label}
      </span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? "" : (next as NeighborhoodId));
        }}
        className="min-h-12 w-full rounded-2xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-bean disabled:opacity-50"
      >
        <option value="">{copy.meetHalfwayPickArea[language]}</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {neighborhoodLabel(area, language)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MeetHalfwayPicker({
  language,
  disabled,
  onSubmit,
}: MeetHalfwayPickerProps) {
  const areas = useMemo(
    () => directoryNeighborhoods(listDirectoryShops()),
    [],
  );
  const [me, setMe] = useState<NeighborhoodId | "">("");
  const [other, setOther] = useState<NeighborhoodId | "">("");

  function submit() {
    if (!me || !other || disabled) return;
    // v1 UI is exactly two district pickers.
    // Core ranking is locations: Location[] (N≥2) — add a third/fourth
    // picker here later for 3–4 friends. Do not pair-hardcode the API.
    onSubmit([{ district: me }, { district: other }]);
  }

  return (
    <div
      className="space-y-2.5 rounded-2xl border border-line bg-foam p-3"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <p className="text-xs leading-5 text-ink-soft">
        {copy.meetHalfwayHint[language]}
      </p>
      <div className="grid gap-2">
        <DistrictSelect
          id="meet-halfway-me"
          label={copy.meetHalfwayMe[language]}
          value={me}
          language={language}
          areas={areas}
          disabled={disabled}
          onChange={setMe}
        />
        <DistrictSelect
          id="meet-halfway-other"
          label={copy.meetHalfwayOther[language]}
          value={other}
          language={language}
          areas={areas}
          disabled={disabled}
          onChange={setOther}
        />
      </div>
      <button
        type="button"
        disabled={disabled || !me || !other}
        onClick={submit}
        className="h-12 w-full rounded-2xl bg-bean text-sm text-foam disabled:opacity-50"
      >
        {copy.meetHalfwayGo[language]}
      </button>
    </div>
  );
}
