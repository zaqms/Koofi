import {
  extractInboundTexts,
  isWhatsAppConfigured,
  replyForWhatsApp,
  sendWhatsAppText,
  verifyWebhookChallenge,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const requestChallenge = url.searchParams.get("hub.challenge");

  if (mode || token || requestChallenge) {
    const challenge = verifyWebhookChallenge(mode, token, requestChallenge);
    if (challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("forbidden", { status: 403 });
  }

  return Response.json(
    {
      ok: true,
      door: "whatsapp",
      configured: isWhatsAppConfigured(),
      hint: "Web chat does not need WhatsApp credentials. Attach a Meta number later — see README.",
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const inbound = extractInboundTexts(
    (payload ?? {}) as Parameters<typeof extractInboundTexts>[0],
  );

  const replies = [];

  for (const message of inbound) {
    const body = replyForWhatsApp(message.text);
    const send = await sendWhatsAppText(message.from, body);
    replies.push({
      from: message.from,
      messageId: message.messageId,
      sent: send.ok,
      skippedSend: send.skipped,
    });
  }

  return Response.json({
    ok: true,
    received: inbound.length,
    replies,
    configured: isWhatsAppConfigured(),
  });
}
