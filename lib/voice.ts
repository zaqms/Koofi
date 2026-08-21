import { ENV_KEYS, readEnv } from "./env";
import { neighborhoodLabel } from "./neighborhoods";
import { headingForPicks } from "./picker";
import { isExampleShop, shopDisplayName } from "./product";
import type { Language, PickResult } from "./types";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
/** Current xAI chat model. `grok-4` is not the live chat id. */
const XAI_MODEL = "grok-4.6";
const TIMEOUT_MS = 2500;
const MAX_CHARS = 220;

type SpeakInput = {
  userText: string;
  landing: Language;
  result: PickResult;
};

function pickLines(result: PickResult): string {
  return result.picks
    .map((pick, index) => {
      const name = shopDisplayName(pick.shop, result.language);
      const place = neighborhoodLabel(pick.shop.neighborhood, result.language);
      const example = isExampleShop(pick.shop) ? " example" : "";
      return `${index + 1}. ${name} — ${place}${example}`;
    })
    .join("\n");
}

function looksLikeNewList(text: string): boolean {
  return /^\s*\d+[\.)]/.test(text) || (text.match(/\n\s*\d+[\.)]/g) ?? []).length >= 2;
}

function sanitizeSpoken(raw: string, fallback: string): string {
  let text = raw.replace(/\s+/g, " ").trim();
  text = text.replace(/^["'«]+|["'»]+$/g, "").trim();
  if (!text || looksLikeNewList(text)) return fallback;
  if (text.length > MAX_CHARS) {
    const cut = text.slice(0, MAX_CHARS);
    const sentence = cut.match(/^[\s\S]+?[.!?؟…]/);
    text = (sentence?.[0] ?? cut).trim();
  }
  return text || fallback;
}

function systemPrompt(landing: Language): string {
  return landing === "ar"
    ? [
        "أنت كوفي، صاحب يقترح قهوة في الرياض. مو شات عام.",
        "رد بجملة قصيرة أو جملتين، خليجية/سعودية، كأنك تكلم صديق.",
        "احكِ عن المحلات المعطاة فقط. لا تخترع محل، ساعات، تقييم، أو ادعاء رسمي.",
        "لا تعيد قائمة مرقمة. لا ترتب بالنجوم. الكروت بتجي بعدك.",
      ].join(" ")
    : [
        "You are Koofi, a friend picking coffee in Riyadh. Not a general chatbot.",
        "Reply in one short sentence or two, spoken and casual.",
        "Talk only about the given shops. Do not invent a shop, hours, ratings, or official claims.",
        "Do not write a numbered list. Do not rank by stars. Cards follow your line.",
      ].join(" ");
}

export async function speakForPicks(input: SpeakInput): Promise<string> {
  const fallback = headingForPicks(input.result);
  if (input.result.picks.length === 0) return fallback;

  const key = readEnv(ENV_KEYS.XAI_API_KEY);
  if (!key) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        stream: false,
        temperature: 0.8,
        max_completion_tokens: 120,
        messages: [
          { role: "system", content: systemPrompt(input.landing) },
          {
            role: "user",
            content: [
              `Landing language: ${input.landing}`,
              `They said: ${input.userText}`,
              "These shops were already picked. Speak about them. Do not replace them:",
              pickLines(input.result),
            ].join("\n"),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback;
    return sanitizeSpoken(content, fallback);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
