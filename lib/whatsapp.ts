import { isAddShopIntent } from "./add-shop-intent";
import { copy } from "./copy";
import { ENV_KEYS, readEnv } from "./env";
import { detectLanguage } from "./language";
import { isOffTopicAsk } from "./off-topic-intent";
import { extractMapsUrl, looksLikeHttpUrl } from "./maps-url";
import {
  formatWhatsAppReply,
  pickCafes,
  whatsAppLocations,
} from "./picker";
import { recordSuggestion } from "./suggest";
import type { Language } from "./types";
import { speakForPicks } from "./voice";

export const DEFAULT_WHATSAPP_OTP_TEMPLATE = "wain_claim_otp";

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

export type WhatsAppSendResult = {
  ok: boolean;
  skipped: boolean;
  status?: number;
  graphCode?: number;
  graphMessage?: string;
};

type SendResult = WhatsAppSendResult;

export type ClaimOtpSendError =
  | "otp_send_failed"
  | "otp_template_not_ready"
  | "otp_account_not_ready";

const TEMPLATE_NOT_READY_CODES = new Set([132000, 132001, 132015, 132016]);
const ACCOUNT_NOT_READY_CODES = new Set([3, 10, 200]);
const ACCOUNT_NOT_READY_MESSAGE =
  /permission to create message template|does not have permission|not authorized|cannot create message template|account does not have/i;

const SECRET_KEY = /token|authorization|secret|password|bearer|access_token/i;

function graphErrorBodyForLog(json: unknown, fallback: string): unknown {
  if (json && typeof json === "object") {
    try {
      const redacted = JSON.parse(JSON.stringify(json), (key, value) =>
        SECRET_KEY.test(key) ? "[redacted]" : value,
      ) as unknown;
      return redacted;
    } catch {
      return { parse_failed: true };
    }
  }
  return fallback.slice(0, 2000);
}

function graphJsonHasError(json: unknown): boolean {
  return Boolean(
    json &&
      typeof json === "object" &&
      "error" in json &&
      (json as { error?: unknown }).error,
  );
}

export function claimOtpTemplateName(): string {
  return readEnv(ENV_KEYS.WHATSAPP_OTP_TEMPLATE) ?? DEFAULT_WHATSAPP_OTP_TEMPLATE;
}

export function claimOtpLanguageCode(language: Language | undefined): "ar" | "en" {
  return language === "en" ? "en" : "ar";
}

export function mapGraphClaimOtpError(result: SendResult): ClaimOtpSendError {
  const code = result.graphCode;
  const message = result.graphMessage ?? "";
  if (code != null && TEMPLATE_NOT_READY_CODES.has(code)) {
    return "otp_template_not_ready";
  }
  if (
    (code != null && ACCOUNT_NOT_READY_CODES.has(code)) ||
    ACCOUNT_NOT_READY_MESSAGE.test(message)
  ) {
    return "otp_account_not_ready";
  }
  return "otp_send_failed";
}

function graphErrorFields(json: unknown): {
  graphCode?: number;
  graphMessage?: string;
} {
  if (!json || typeof json !== "object" || !("error" in json)) return {};
  const error = (json as { error?: unknown }).error;
  if (!error || typeof error !== "object") return {};
  const record = error as { code?: unknown; message?: unknown };
  return {
    graphCode: typeof record.code === "number" ? record.code : undefined,
    graphMessage: typeof record.message === "string" ? record.message : undefined,
  };
}

export function claimOtpTemplateComponents(code: string): Record<string, unknown>[] {
  const otp = { type: "text", text: code };
  return [
    { type: "body", parameters: [otp] },
    {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [otp],
    },
  ];
}

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
    return { body: copy.suggestBad.ar, locations: [] };
  }

  if (isAddShopIntent(text)) {
    return { body: copy.askMaps.ar, locations: [] };
  }

  if (isOffTopicAsk(text)) {
    const language = detectLanguage(text);
    return { body: copy.offTopic[language], locations: [] };
  }

  const result = pickCafes({ text });
  const spoken = await speakForPicks({
    userText: text,
    landing: result.language,
    result,
  });
  return {
    body: formatWhatsAppReply(result, spoken),
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

  const text = await response.text();
  let json: unknown;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = undefined;
    }
  }

  if (!response.ok || graphJsonHasError(json)) {
    const fields = graphErrorFields(json);
    console.error("wain_whatsapp_graph_error", {
      status: response.status,
      body: graphErrorBodyForLog(json, text),
    });
    return {
      ok: false,
      skipped: false,
      status: response.status,
      ...fields,
    };
  }

  return { ok: true, skipped: false, status: response.status };
}

export async function sendWhatsAppClaimOtp(
  to: string,
  code: string,
  language?: Language,
): Promise<SendResult> {
  return graphMessage({
    to,
    type: "template",
    recipient_type: "individual",
    template: {
      name: claimOtpTemplateName(),
      language: { code: claimOtpLanguageCode(language) },
      components: claimOtpTemplateComponents(code),
    },
  });
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
