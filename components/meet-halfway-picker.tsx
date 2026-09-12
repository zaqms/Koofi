"use client";

import { useEffect, useRef, useState } from "react";
import { MeetHalfwayHero } from "@/components/meet-halfway-hero";
import { MapPinIcon } from "@/components/map-pin-icon";
import { copy } from "@/lib/copy";
import { formatHalfwayPlaceLabel } from "@/lib/halfway-place";
import type { HalfwayPinInput } from "@/lib/meet-halfway";
import { MEET_HALFWAY_CHIP } from "@/lib/product";
import {
  halfwayPinMethod,
  looksLikeSharedPin,
  parseSharedPin,
} from "@/lib/shared-pin";
import type { MeetHalfwayPinMethod, MeetHalfwayPinWhich } from "@/lib/track";
import {
  peekReadyVisitorLocation,
  requestVisitorLocation,
} from "@/lib/visitor-location";
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
  error?: string | null;
  onSubmit: (locations: HalfwayPinInput[]) => void;
  onInvite?: (me: HalfwayPinInput) => void;
  onCopyLink?: (me: HalfwayPinInput) => Promise<boolean> | boolean | void;
  onPin?: (input: {
    which: MeetHalfwayPinWhich;
    method: MeetHalfwayPinMethod;
  }) => void;
};

function pinDraftFrom(pin?: Pin | null): PinDraft {
  if (!pin) return { text: "" };
  return { text: "", pin };
}

function asInput(draft: PinDraft): HalfwayPinInput {
  return { text: draft.text, lat: draft.pin?.lat, lng: draft.pin?.lng };
}

function looksLikeCoordsOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(trimmed);
}

function StatusDot({
  ready,
  language,
}: {
  ready: boolean;
  language: Language;
}) {
  return (
    <span
      className={
        ready
          ? "inline-flex items-center gap-1 text-[11px] leading-4 text-emerald-800"
          : "inline-flex items-center gap-1 text-[11px] leading-4 text-ink-soft"
      }
    >
      <span
        aria-hidden
        className={
          ready
            ? "size-1.5 rounded-full bg-emerald-700"
            : "size-1.5 rounded-full border border-ink-soft/50"
        }
      />
      {ready
        ? copy.meetHalfwayReady[language]
        : copy.meetHalfwayWaitingStatus[language]}
    </span>
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
  error = null,
  onSubmit,
  onInvite,
  onCopyLink,
  onPin,
}: MeetHalfwayPickerProps) {
  const [me, setMe] = useState<PinDraft>(() => pinDraftFrom(initialMe));
  const [editing, setEditing] = useState(() => !initialMe);
  const [locationOff, setLocationOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const guest = mode === "guest";
  const resolvedMe = me.pin || me.text || !initialMe ? me : pinDraftFrom(initialMe);
  const meReady = Boolean(
    resolvedMe.pin || looksLikeSharedPin(resolvedMe.text),
  );
  const which: MeetHalfwayPinWhich = guest ? "self" : "a";
  const title =
    language === "ar" ? MEET_HALFWAY_CHIP.ar : MEET_HALFWAY_CHIP.en;
  const tagline = guest
    ? copy.meetHalfwayInviteGuestHint[language]
    : copy.meetHalfwayTagline[language];
  const placeLabel = resolvedMe.pin
    ? formatHalfwayPlaceLabel(resolvedMe.pin, language)
    : looksLikeSharedPin(resolvedMe.text)
      ? copy.meetHalfwayMapsPin[language]
      : "";

  const onPinRef = useRef(onPin);
  const autoReadyRef = useRef(false);
  useEffect(() => {
    onPinRef.current = onPin;
  }, [onPin]);
  useEffect(() => {
    if (autoReadyRef.current || resolvedMe.pin || initialMe) return;
    autoReadyRef.current = true;
    let cancelled = false;
    void peekReadyVisitorLocation().then((visitor) => {
      if (cancelled) return;
      if (visitor.status === "ready") {
        setMe({
          text: "",
          pin: { lat: visitor.lat, lng: visitor.lng },
        });
        setEditing(false);
        setLocationOff(false);
        onPinRef.current?.({ which, method: "geolocation" });
        return;
      }
      if (visitor.status === "unavailable") setLocationOff(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialMe, resolvedMe.pin, which]);

  async function dropMyPin() {
    const visitor = await requestVisitorLocation({ retry: true });
    if (visitor.status !== "ready") {
      setLocationOff(true);
      setEditing(true);
      return;
    }
    setLocationOff(false);
    setMe({
      text: "",
      pin: { lat: visitor.lat, lng: visitor.lng },
    });
    setEditing(false);
    onPin?.({ which, method: "geolocation" });
  }

  function onPaste(text: string) {
    const pin = parseSharedPin(text) ?? undefined;
    const wasSet = Boolean(resolvedMe.pin);
    const moved =
      pin &&
      (!resolvedMe.pin ||
        resolvedMe.pin.lat !== pin.lat ||
        resolvedMe.pin.lng !== pin.lng);
    if (locationOff && pin) setLocationOff(false);
    setMe({
      text: looksLikeCoordsOnly(text) ? "" : text,
      pin,
    });
    if (pin) setEditing(false);
    if (pin && (!wasSet || moved)) {
      onPin?.({ which, method: halfwayPinMethod(text) });
    }
  }

  function submitGuest() {
    if (!meReady || disabled) return;
    onSubmit([asInput(resolvedMe)]);
  }

  function invite() {
    if (!meReady || disabled || !onInvite) return;
    onInvite(asInput(resolvedMe));
  }

  async function copyLink() {
    if (!meReady || disabled || !onCopyLink) return;
    const ok = await onCopyLink(asInput(resolvedMe));
    if (ok === false) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const showPaste = editing || locationOff || (!meReady && !resolvedMe.pin);

  if (waiting || joined) {
    return (
      <div
        className="flex flex-col gap-5 px-1 pt-2 pb-1"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-foam px-3 py-2.5">
            <span className="text-sm text-ink">{copy.meetHalfwayMe[language]}</span>
            <StatusDot ready language={language} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-foam px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm text-ink">
                {copy.meetHalfwayOther[language]}
              </span>
              {joined && friendPin ? (
                <span className="block truncate text-[11px] text-ink-soft">
                  {formatHalfwayPlaceLabel(friendPin, language)}
                </span>
              ) : null}
            </span>
            <StatusDot ready={joined} language={language} />
          </div>
        </div>
        <MeetHalfwayHero />
        <p
          className={
            joined
              ? "rounded-2xl bg-bean/10 px-3 py-2.5 text-center text-sm leading-6 text-ink"
              : "text-center text-sm leading-6 text-ink-soft"
          }
          role="status"
          aria-live={joined || waiting ? "polite" : undefined}
        >
          {joined
            ? copy.meetHalfwayInviteJoined[language]
            : copy.meetHalfwayInviteWaiting[language]}
        </p>
        {onCopyLink ? (
          <button
            type="button"
            disabled={disabled || !meReady}
            onClick={() => {
              void copyLink();
            }}
            className="h-12 w-full rounded-2xl border border-line bg-foam text-sm text-ink disabled:opacity-50"
          >
            {copied
              ? copy.packetCopied[language]
              : copy.meetHalfwayCopyLink[language]}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-5 px-1 pt-4 pb-2"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <MeetHalfwayHero />
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="text-sm leading-6 text-ink-soft">{tagline}</p>
      </div>

      <div className="rounded-2xl border border-line bg-foam px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 text-ink-soft">
              <MapPinIcon />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] leading-4 text-ink-soft">
                {copy.meetHalfwayMe[language]}
              </p>
              <p className="truncate text-sm font-medium text-ink">
                {meReady
                  ? placeLabel
                  : copy.meetHalfwayMyPin[language]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {meReady ? <StatusDot ready language={language} /> : null}
            {meReady ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setEditing(true)}
                className="text-[11px] text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
              >
                {copy.meetHalfwayChange[language]}
              </button>
            ) : null}
          </div>
        </div>

        {showPaste ? (
          <div className="mt-3 space-y-2">
            <label className="block text-start" htmlFor="meet-halfway-me">
              <span className="sr-only">{copy.meetHalfwayMe[language]}</span>
              <input
                id="meet-halfway-me"
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={looksLikeCoordsOnly(resolvedMe.text) ? "" : resolvedMe.text}
                disabled={disabled}
                placeholder={copy.meetHalfwayPinPlaceholder[language]}
                onChange={(event) => onPaste(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-bean disabled:opacity-50"
              />
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                void dropMyPin();
              }}
              className="h-12 w-full rounded-2xl border border-line bg-paper text-sm text-ink disabled:opacity-50"
            >
              {copy.meetHalfwayMyPin[language]}
            </button>
          </div>
        ) : null}

        {locationOff ? (
          <p className="mt-2 text-[11px] leading-4 text-ink-soft" role="status">
            {copy.meetHalfwayLocationOff[language]}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-center text-xs leading-5 text-bean" role="status">
          {error}
        </p>
      ) : null}

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
          {onCopyLink ? (
            <button
              type="button"
              disabled={disabled || !meReady}
              onClick={() => {
                void copyLink();
              }}
              className="h-12 w-full rounded-2xl border border-line bg-foam text-sm text-ink disabled:opacity-50"
            >
              {copied
                ? copy.packetCopied[language]
                : copy.meetHalfwayCopyLink[language]}
            </button>
          ) : null}
          <p className="flex items-center justify-center gap-1.5 text-[11px] leading-4 text-ink-soft">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width="12"
              height="12"
              className="shrink-0"
            >
              <rect
                x="6"
                y="11"
                width="12"
                height="9"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            {copy.meetHalfwayNoAccount[language]}
          </p>
        </div>
      )}
    </div>
  );
}
