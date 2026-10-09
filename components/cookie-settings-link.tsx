"use client";

import { consentText } from "@/lib/consent-copy";
import type { Language } from "@/lib/types";

/**
 * Footer link that reopens the cookie banner. No click handler: the consent
 * bootstrap's capture guard handles data-consent clicks before any tag
 * listener sees them (lib/consent.ts, CONSENT_ACTION_EVENT).
 */
export function CookieSettingsLink({
  language,
  className,
}: {
  language: Language;
  className: string;
}) {
  return (
    <button type="button" className={className} data-consent="settings">
      {consentText("settingsLink", language)}
    </button>
  );
}
