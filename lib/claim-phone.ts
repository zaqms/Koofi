/** Saudi-first E.164. Accepts +9665…, 05…, 5…, 9665… */
export function parseOwnerPhone(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return undefined;

  let e164: string | undefined;
  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    if (rest.length >= 8 && rest.length <= 15) e164 = `+${rest}`;
  } else {
    const only = digits.replace(/\D/g, "");
    if (only.startsWith("966") && only.length === 12) e164 = `+${only}`;
    else if (only.startsWith("05") && only.length === 10) {
      e164 = `+966${only.slice(1)}`;
    } else if (only.startsWith("5") && only.length === 9) {
      e164 = `+966${only}`;
    } else if (only.length >= 8 && only.length <= 15 && !only.startsWith("0")) {
      e164 = `+${only}`;
    }
  }

  if (!e164 || !/^\+[1-9]\d{7,14}$/.test(e164)) return undefined;
  return e164;
}

/** Cloud API `to` field — digits only, no plus. */
export function whatsAppTo(e164: string): string {
  return e164.replace(/^\+/, "");
}
