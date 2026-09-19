import { emailMapsHref } from "./email-maps-href";
import { ENV_KEYS, readEnv } from "./env";
import {
  halfwayResultCafesFromPicks,
  halfwayResultPins,
} from "./halfway-results-payload";
import type {
  HalfwayResultCafe,
  HalfwayResultPin,
} from "./halfway-results-payload";
import type { ChatPick, Language, Pin } from "./types";

function emailCafeMapsUrl(pick: ChatPick): string {
  return emailMapsHref({
    existing: pick.mapsHref,
    shopId: pick.id,
  });
}

type HalfwayResultSource = "local" | "invite";

/** Amjad locked — not amjad@cali.sa. */
export const HALFWAY_RESULTS_NOTIFY_EMAIL = "aj@cali.sa";

export const HALFWAY_RESULTS_WEBHOOK_URL =
  "https://api2.cursor.sh/automations/webhook/9dad0fe5-0b67-5573-b14c-92e4083acac1";

export type HalfwayResultsWebhookBody = {
  event: "meet_halfway_results";
  notify_email: typeof HALFWAY_RESULTS_NOTIFY_EMAIL;
  locale: Language;
  session_id?: string;
  count: number;
  source?: HalfwayResultSource;
  cafes: HalfwayResultCafe[];
  pins?: HalfwayResultPin[];
  host_pin?: HalfwayResultPin;
  guest_pin?: HalfwayResultPin;
};

export function halfwayResultsWebhookBody(input: {
  locale: Language;
  picks: readonly ChatPick[];
  sessionId?: string | null;
  midpoint?: Pin | null;
  locations?: readonly { pin?: Pin | null }[] | null;
  source?: HalfwayResultSource;
}): HalfwayResultsWebhookBody {
  const session_id = input.sessionId?.trim() || undefined;
  const pins = halfwayResultPins(input.locations);
  const host_pin = pins.find((pin) => pin.role === "host");
  const guest_pin = pins.find((pin) => pin.role === "guest");
  return {
    event: "meet_halfway_results",
    notify_email: HALFWAY_RESULTS_NOTIFY_EMAIL,
    locale: input.locale,
    ...(session_id ? { session_id } : {}),
    count: input.picks.length,
    ...(input.source ? { source: input.source } : {}),
    cafes: halfwayResultCafesFromPicks({
      picks: input.picks,
      midpoint: input.midpoint,
    }).map((cafe, index) => {
      const pick = input.picks[index];
      return pick ? { ...cafe, maps_url: emailCafeMapsUrl(pick) } : cafe;
    }),
    ...(pins.length > 0 ? { pins } : {}),
    ...(host_pin ? { host_pin } : {}),
    ...(guest_pin ? { guest_pin } : {}),
  };
}

/**
 * Server-only. Bearer key stays in Vercel env — never import this module
 * from a client component. Missing key stubs and logs; results still render.
 */
export async function notifyHalfwayResults(input: {
  locale: Language;
  picks: readonly ChatPick[];
  sessionId?: string | null;
  midpoint?: Pin | null;
  locations?: readonly { pin?: Pin | null }[] | null;
  source?: HalfwayResultSource;
}): Promise<"sent" | "skipped" | "failed"> {
  if (input.picks.length === 0) return "skipped";

  const body = halfwayResultsWebhookBody(input);
  const key = readEnv(ENV_KEYS.HALFWAY_RESULTS_WEBHOOK_KEY);
  if (!key) {
    console.log(
      "wain_halfway_results_webhook_stub",
      JSON.stringify({
        locale: body.locale,
        session_id: body.session_id ?? null,
        count: body.count,
        cafes: body.cafes.map((cafe) => cafe.name_en),
        pins: body.pins?.map((pin) => pin.role) ?? [],
      }),
    );
    return "skipped";
  }

  try {
    const response = await fetch(HALFWAY_RESULTS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
