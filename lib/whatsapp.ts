import { ENV_KEYS, readEnv } from "./env";
import { formatWhatsAppReply, pickCafes } from "./picker";
import { cardHref } from "./public-url";

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

export function replyForWhatsApp(text: string): string {
  const result = pickCafes({ text });
  return formatWhatsAppReply(result, cardHref);
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    readEnv(ENV_KEYS.WHATSAPP_ACCESS_TOKEN) &&
      readEnv(ENV_KEYS.WHATSAPP_PHONE_NUMBER_ID),
  );
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; skipped: boolean; status?: number }> {
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
        to,
        type: "text",
        text: { body, preview_url: true },
      }),
    },
  );

  return { ok: response.ok, skipped: false, status: response.status };
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
