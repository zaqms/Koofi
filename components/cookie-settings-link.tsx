"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/consent";
import { consentText } from "@/lib/consent-copy";
import type { Language } from "@/lib/types";

/** Footer link that reopens the cookie banner. */
export function CookieSettingsLink({
  language,
  className,
}: {
  language: Language;
  className: string;
}) {
  return (
    <button
      type="button"
      className={className}
      data-consent="settings"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      {consentText("settingsLink", language)}
    </button>
  );
}
