"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { redactAnalyticsUrl } from "@/lib/analytics-redact";

/** Vercel Web Analytics: /h/{id} → /h/[invite]; only utm_* / click ids / `from` kept. */
export function redactVercelAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = redactAnalyticsUrl(event.url);
  if (!url) return null;
  return { ...event, url };
}

export function RedactedAnalytics() {
  return <Analytics beforeSend={redactVercelAnalyticsEvent} />;
}
