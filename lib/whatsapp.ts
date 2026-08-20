import { ENV_KEYS, readEnv } from "./env";
import { extractMapsUrl, looksLikeHttpUrl } from "./maps-url";
import {
  formatWhatsAppReply,
  pickCafes,
  whatsAppLocations,
} from "./picker";
import { bilingual, recordSuggestion } from "./suggest";
import { copy } from "./copy";

type WhatsAppTextMessage = {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
};

type WhatsAppChange = {
  value?: {
    messages?: WhatsAppTextMessage[];
  };
};

type WhatsAppPayload = {
  object?: string;
  entry?: { changes?: WhatsAppChange[] }[];
};

type SendResult = { ok: boolean; skipped: boolean; status?: number };

export function extractInboundTexts(payload: WhatsAppPayload): {
  from: string;
  text: string;
  messageId?: string;
}[] {
  const inbound: { from: string; text: string; messageId?: string }[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type && message.type !== "text") continue;
        const text = message.text?.body?.trim();
        const from = message.from?.trim();
        if (!text || !from) continue;
        inbound.push({ from, text, messageId: message.id });
      }
    }
  }

  return inbound;
}

export async function replyForWhatsApp(text: string): Promise<{
  body: string;
  locations: ReturnType<typeof whatsAppLocations>;
}> {
  if (extractMapsUrl(text)) {
    const suggestion = await recordSuggestion(text);
    return { body: suggestion.reply, locations: [] };
  }

  if (looksLikeHttpUrl(text)) {
    return { body: bilingual(copy.suggestBad), locations: [] };
  }

  const result = pickCafes({ text });
  return {
    body: formatWhatsAppReply(result),
    locations: whatsAppLocations(result),
  };
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    readEnv(ENV_KEYS.WHATSAPP_ACCESS_TOKEN) &&
      readEnv(ENV_KEYS.WHATSAPP_PHONE_NUMBER_ID),
  );
}

async function graphMessage(
  payload: Record<string, unknown>,
): Promise<SendResult> {
  const token = readEnv(ENV_KEYS.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = readEnv(ENV_KEYS.WHATSAPP_PHONE_NUMBER_ID);

  if (!token || !phoneNumberId) {
    return { ok: true, skipped: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        ...payload,
      }),
    },
  );

  return { ok: response.ok, skipped: false, status: response.status };
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<SendResult> {
  return graphMessage({
    to,
    type: "text",
    text: { body, preview_url: true },
  });
}

export async function sendWhatsAppLocation(
  to: string,
  location: { lat: number; lng: number; name: string; address: string },
): Promise<SendResult> {
  return graphMessage({
    to,
    type: "location",
    location: {
      latitude: location.lat,
      longitude: location.lng,
      name: location.name,
      address: location.address,
    },
  });
}

export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
): string | null {
  const expected = readEnv(ENV_KEYS.WHATSAPP_VERIFY_TOKEN);
  if (!expected) return null;
  if (mode === "subscribe" && token === expected && challenge) {
    return challenge;
  }
  return null;
}
