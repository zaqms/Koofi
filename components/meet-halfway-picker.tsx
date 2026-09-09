"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import type { HalfwayPinInput } from "@/lib/meet-halfway";
import { looksLikeSharedPin, parseSharedPin } from "@/lib/shared-pin";
import { requestVisitorLocation } from "@/lib/visitor-location";
import type { Language, Pin } from "@/lib/types";

type PinDraft = {
  text: string;
  pin?: Pin;
};

type MeetHalfwayPickerProps = {
  language: Language;
  disabled?: boolean;
  onSubmit: (locations: HalfwayPinInput[]) => void;
};

function PinField({
  id,
  label,
  draft,
  language,
  disabled,
  showMyPin,
  onChange,
}: {
  id: string;
  label: string;
  draft: PinDraft;
  language: Language;
  disabled?: boolean;
  showMyPin?: boolean;
  onChange: (next: PinDraft) => void;
}) {
  async function useMyPin() {
    const visitor = await requestVisitorLocation({ retry: true });
    if (visitor.status !== "ready") return;
    const pin = { lat: visitor.lat, lng: visitor.lng };
    onChange({
      text: `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
      pin,
    });
  }

  return (
    <label className="block text-start" htmlFor={id}>
      <span className="mb-1 block text-[11px] leading-4 text-ink-soft">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={draft.text}
          disabled={disabled}
          placeholder={copy.meetHalfwayPinPlaceholder[language]}
          onChange={(event) => {
            const text = event.target.value;
            onChange({
              text,
              pin: parseSharedPin(text) ?? undefined,
            });
          }}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-bean disabled:opacity-50"
        />
        {showMyPin ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              void useMyPin();
            }}
            className="h-12 shrink-0 rounded-2xl border border-line bg-paper px-3 text-xs text-ink disabled:opacity-50"
          >
            {copy.meetHalfwayMyPin[language]}
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function MeetHalfwayPicker({
  language,
  disabled,
  onSubmit,
}: MeetHalfwayPickerProps) {
  const [me, setMe] = useState<PinDraft>({ text: "" });
  const [other, setOther] = useState<PinDraft>({ text: "" });
  const ready =
    (me.pin || looksLikeSharedPin(me.text)) &&
    (other.pin || looksLikeSharedPin(other.text));

  function submit() {
    if (!ready || disabled) return;
    // v1 UI is exactly two shared pins.
    // Core ranking is locations: Location[] (N≥2) — add a third/fourth
    // pin field here later for 3–4 friends. Do not pair-hardcode the API.
    onSubmit([
      { text: me.text, lat: me.pin?.lat, lng: me.pin?.lng },
      { text: other.text, lat: other.pin?.lat, lng: other.pin?.lng },
    ]);
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
        <PinField
          id="meet-halfway-me"
          label={copy.meetHalfwayMe[language]}
          draft={me}
          language={language}
          disabled={disabled}
          showMyPin
          onChange={setMe}
        />
        <PinField
          id="meet-halfway-other"
          label={copy.meetHalfwayOther[language]}
          draft={other}
          language={language}
          disabled={disabled}
          onChange={setOther}
        />
      </div>
      <button
        type="button"
        disabled={disabled || !ready}
        onClick={submit}
        className="h-12 w-full rounded-2xl bg-bean text-sm text-foam disabled:opacity-50"
      >
        {copy.meetHalfwayGo[language]}
      </button>
    </div>
  );
}
