"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import type { HalfwayPinInput } from "@/lib/meet-halfway";
import { halfwayPinMethod, looksLikeSharedPin, parseSharedPin } from "@/lib/shared-pin";
import type { MeetHalfwayPinMethod, MeetHalfwayPinWhich } from "@/lib/track";
import { requestVisitorLocation } from "@/lib/visitor-location";
import type { Language, Pin } from "@/lib/types";

type PinDraft = {
  text: string;
  pin?: Pin;
};

export type MeetHalfwayPickerMode = "pair" | "guest";

type MeetHalfwayPickerProps = {
  language: Language;
  disabled?: boolean;
  mode?: MeetHalfwayPickerMode;
  waiting?: boolean;
  joined?: boolean;
  initialMe?: Pin | null;
  friendPin?: Pin | null;
  onSubmit: (locations: HalfwayPinInput[]) => void;
  onInvite?: (me: HalfwayPinInput) => void;
  onPin?: (input: {
    which: MeetHalfwayPinWhich;
    method: MeetHalfwayPinMethod;
  }) => void;
};

function pinDraftFrom(pin?: Pin | null): PinDraft {
  if (!pin) return { text: "" };
  return {
    text: `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
    pin,
  };
}

function asInput(draft: PinDraft): HalfwayPinInput {
  return { text: draft.text, lat: draft.pin?.lat, lng: draft.pin?.lng };
}

function PinField({
  id,
  label,
  draft,
  language,
  disabled,
  showMyPin,
  which,
  onChange,
  onPin,
}: {
  id: string;
  label: string;
  draft: PinDraft;
  language: Language;
  disabled?: boolean;
  showMyPin?: boolean;
  which: MeetHalfwayPinWhich;
  onChange: (next: PinDraft) => void;
  onPin?: (input: {
    which: MeetHalfwayPinWhich;
    method: MeetHalfwayPinMethod;
  }) => void;
}) {
  const [locationOff, setLocationOff] = useState(false);

  async function useMyPin() {
    const visitor = await requestVisitorLocation({ retry: true });
    if (visitor.status !== "ready") {
      setLocationOff(true);
      return;
    }
    setLocationOff(false);
    const pin = { lat: visitor.lat, lng: visitor.lng };
    onChange({
      text: `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
      pin,
    });
    onPin?.({ which, method: "geolocation" });
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
            const pin = parseSharedPin(text) ?? undefined;
            const wasSet = Boolean(draft.pin);
            const moved =
              pin &&
              (!draft.pin ||
                draft.pin.lat !== pin.lat ||
                draft.pin.lng !== pin.lng);
            if (locationOff) setLocationOff(false);
            onChange({ text, pin });
            if (pin && (!wasSet || moved)) {
              onPin?.({ which, method: halfwayPinMethod(text) });
            }
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
      {locationOff ? (
        <p className="mt-1 text-[11px] leading-4 text-ink-soft" role="status">
          {copy.meetHalfwayLocationOff[language]}
        </p>
      ) : null}
    </label>
  );
}

export function MeetHalfwayPicker({
  language,
  disabled,
  mode = "pair",
  waiting = false,
  joined = false,
  initialMe = null,
  friendPin = null,
  onSubmit,
  onInvite,
  onPin,
}: MeetHalfwayPickerProps) {
  const [me, setMe] = useState<PinDraft>(() => pinDraftFrom(initialMe));
  const [other, setOther] = useState<PinDraft>(() => pinDraftFrom(friendPin));
  const guest = mode === "guest";
  const meReady = Boolean(me.pin || looksLikeSharedPin(me.text));
  const otherReady = Boolean(other.pin || looksLikeSharedPin(other.text));
  const pairReady = meReady && otherReady;
  const hint = guest
    ? copy.meetHalfwayInviteGuestHint[language]
    : joined
      ? copy.meetHalfwayInviteJoined[language]
      : waiting
        ? copy.meetHalfwayInviteWaiting[language]
        : copy.meetHalfwayHint[language];

  useEffect(() => {
    if (!initialMe) return;
    setMe((current) => (current.pin ? current : pinDraftFrom(initialMe)));
  }, [initialMe]);

  useEffect(() => {
    if (!friendPin) return;
    setOther(pinDraftFrom(friendPin));
  }, [friendPin]);

  function submitPair() {
    if (!pairReady || disabled) return;
    // v1 UI is exactly two shared pins.
    // Core ranking is locations: Location[] (N≥2) — add a third/fourth
    // pin field here later for 3–4 friends. Do not pair-hardcode the API.
    onSubmit([asInput(me), asInput(other)]);
  }

  function submitGuest() {
    if (!meReady || disabled) return;
    onSubmit([asInput(me)]);
  }

  function invite() {
    if (!meReady || disabled || !onInvite) return;
    onInvite(asInput(me));
  }

  return (
    <div
      className="space-y-2.5 rounded-2xl border border-line bg-foam p-3"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <p
        className={
          joined
            ? "rounded-xl bg-bean/10 px-2.5 py-2 text-xs leading-5 text-ink"
            : "text-xs leading-5 text-ink-soft"
        }
        role={joined || waiting ? "status" : undefined}
        aria-live={joined || waiting ? "polite" : undefined}
      >
        {hint}
      </p>
      <div className="grid gap-2">
        <PinField
          id="meet-halfway-me"
          label={copy.meetHalfwayMe[language]}
          draft={me}
          language={language}
          disabled={disabled || (waiting && !joined)}
          showMyPin
          which={guest ? "self" : "a"}
          onChange={setMe}
          onPin={onPin}
        />
        {guest ? null : (
          <PinField
            id="meet-halfway-other"
            label={copy.meetHalfwayOther[language]}
            draft={other}
            language={language}
            disabled={disabled || (waiting && !joined)}
            which="b"
            onChange={setOther}
            onPin={onPin}
          />
        )}
      </div>
      {guest ? (
        <button
          type="button"
          disabled={disabled || !meReady}
          onClick={submitGuest}
          className="h-12 w-full rounded-2xl bg-bean text-sm text-foam disabled:opacity-50"
        >
          {copy.meetHalfwayGo[language]}
        </button>
      ) : (
        <div className="grid gap-2">
          {onInvite ? (
            <button
              type="button"
              disabled={disabled || !meReady}
              onClick={invite}
              className="h-12 w-full rounded-2xl bg-bean text-sm text-foam disabled:opacity-50"
            >
              {copy.meetHalfwayInvite[language]}
            </button>
          ) : null}
          {onInvite ? (
            <p className="text-[11px] leading-4 text-ink-soft">
              {copy.meetHalfwayInviteHint[language]}
            </p>
          ) : null}
          <button
            type="button"
            disabled={disabled || (waiting && !joined) || !pairReady}
            onClick={submitPair}
            className="h-12 w-full rounded-2xl border border-line bg-paper text-sm text-ink disabled:opacity-50"
          >
            {copy.meetHalfwayGo[language]}
          </button>
        </div>
      )}
    </div>
  );
}
