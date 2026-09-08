import { ENV_KEYS, readEnv } from "./env";
import type { ProofType } from "./claims-types";

export const CLAIM_ALERT_TO = "aj@cali.sa";

export type ClaimAlertPayload = {
  shopId: string;
  shopNameAr: string;
  shopNameEn: string;
  phone: string;
  proofType: ProofType;
  proofAssetUrl: string | null;
  otpStub: boolean;
};

/** Thin log hook Ajz can filter in Vercel. Never pages Amjad. */
export function logClaimAlert(payload: ClaimAlertPayload): void {
  console.log("wain_claim", JSON.stringify(payload));
}

async function sendResendEmail(payload: ClaimAlertPayload): Promise<"sent" | "skipped" | "failed"> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return "skipped";

  const to = readEnv(ENV_KEYS.CLAIM_ALERT_TO) ?? CLAIM_ALERT_TO;
  const proof = payload.proofAssetUrl ?? "(stub path empty)";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "wain.lol claims <claims@wain.lol>",
        to: [to],
        subject: `Owner claim pending · ${payload.shopId}`,
        text: [
          `shop_id: ${payload.shopId}`,
          `name_ar: ${payload.shopNameAr}`,
          `name_en: ${payload.shopNameEn}`,
          `phone: ${payload.phone}`,
          `proof_type: ${payload.proofType}`,
          `proof: ${proof}`,
          `otp_stub: ${payload.otpStub ? "yes" : "no"}`,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function alertClaimSubmitted(
  payload: ClaimAlertPayload,
): Promise<{ logged: true; email: "sent" | "skipped" | "failed" }> {
  logClaimAlert(payload);
  const email = await sendResendEmail(payload);
  if (email === "skipped") {
    console.log(
      "wain_claim_email_stub",
      JSON.stringify({ to: CLAIM_ALERT_TO, shopId: payload.shopId }),
    );
  }
  return { logged: true, email };
}
