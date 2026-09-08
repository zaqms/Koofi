"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { homePath, ownerClaimPath, ownerPath, shopDisplayName } from "@/lib/product";
import { STUB_OTP_CODE, type ClaimError } from "@/lib/claims-types";
import type { Language, NeighborhoodId } from "@/lib/types";

export type OwnerCatalogOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoodAr: string;
  neighborhood: string;
};

type OwnerClaimProps = {
  language: Language;
  shops: OwnerCatalogOption[];
  initialShopId?: string;
};

type Step = 1 | 2 | 3 | "done";

function errorCopy(language: Language, error: ClaimError | undefined): string {
  switch (error) {
    case "bad_phone":
      return copy.ownerBadPhone[language];
    case "bad_otp":
      return copy.ownerBadOtp[language];
    case "otp_send_failed":
      return copy.ownerOtpSendFailed[language];
    case "otp_template_not_ready":
      return copy.ownerOtpTemplateNotReady[language];
    case "otp_account_not_ready":
      return copy.ownerOtpAccountNotReady[language];
    case "already_claimed":
      return copy.ownerAlreadyPending[language];
    case "no_storage":
      return copy.ownerNoStorage[language];
    case "bad_proof":
      return copy.ownerBadProof[language];
    case "rate_limited":
      return copy.feedbackRateLimited[language];
    default:
      return copy.error[language];
  }
}

export function OwnerClaim({ language, shops, initialShopId }: OwnerClaimProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const preselected = shops.find((shop) => shop.id === initialShopId);

  const [step, setStep] = useState<Step>(preselected ? 2 : 1);
  const [shopId, setShopId] = useState(preselected?.id ?? "");
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpStub, setOtpStub] = useState(false);
  const [proofName, setProofName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = shops.find((shop) => shop.id === shopId);
  const selectedLabel = selected
    ? shopDisplayName(selected, language)
    : "";
  const selectedArea = selected
    ? language === "ar"
      ? selected.neighborhoodAr
      : neighborhoodLabel(selected.neighborhood as NeighborhoodId, "en")
    : "";
  const fromCard = Boolean(preselected);
  const localeHref = selected
    ? ownerClaimPath(selected.id, other)
    : ownerPath(other);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return shops.slice(0, 12);
    return shops
      .filter((shop) => {
        const hay = `${shop.nameAr} ${shop.nameEn} ${shop.neighborhoodAr} ${shop.neighborhood}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 16);
  }, [query, shops]);

  function pickShop(id: string) {
    setShopId(id);
    setMessage(null);
    setStep(2);
  }

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    if (busy || !shopId) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/claims/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, phone, language }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: ClaimError;
        stub?: boolean;
        stubCode?: string;
        hint?: string;
      };
      if (!payload.ok) {
        setMessage(errorCopy(language, payload.error));
        return;
      }
      setOtpStub(Boolean(payload.stub));
      if (payload.stub) {
        setMessage(
          `${copy.ownerOtpStub[language]} ${copy.ownerStubCodeHint[language]}`,
        );
        if (payload.stubCode === STUB_OTP_CODE) setCode(STUB_OTP_CODE);
      } else {
        setMessage(null);
      }
      setStep(3);
    } catch {
      setMessage(copy.error[language]);
    } finally {
      setBusy(false);
    }
  }

  async function submitClaim(event: FormEvent) {
    event.preventDefault();
    if (busy || !shopId) return;
    if (!proofName) {
      setMessage(copy.ownerBadProof[language]);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          phone,
          code,
          proofType: "cr",
          proofName,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: ClaimError;
      };
      if (!payload.ok) {
        setMessage(errorCopy(language, payload.error));
        return;
      }
      setStep("done");
    } catch {
      setMessage(copy.error[language]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="flex items-center justify-between gap-3">
        <BrandHomeLink language={language} className="text-lg font-semibold" />
        <Link
          href={localeHref}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>

      <section className="mt-8">
        <p className="text-xs text-ink-soft" dir="ltr">
          1 · {copy.ownerStepCafe.en} / {copy.ownerStepCafe.ar}
        </p>
        {fromCard && selected ? (
          <>
            <p className="mt-2 text-xs text-ink-soft">
              {copy.ownerConfirmed[language]}
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-none tracking-tight">
              {selectedLabel}
            </h1>
            {selectedArea ? (
              <p className="mt-3 text-sm leading-7 text-ink-soft">{selectedArea}</p>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="mt-3 text-[2rem] font-bold leading-none tracking-tight">
              {copy.ownerTitle[language]}
            </h1>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              {copy.ownerLead[language]}
            </p>
          </>
        )}
      </section>

      {step === "done" ? (
        <article className="mt-8 rounded-2xl border border-line bg-foam px-4 py-6">
          <p className="text-sm leading-7">{copy.ownerUnderReview[language]}</p>
          {selectedLabel ? (
            <p className="mt-3 text-sm text-ink-soft">{selectedLabel}</p>
          ) : null}
        </article>
      ) : null}

      {step === 1 ? (
        <div className="mt-8 space-y-6">
          <div>
            <label className="text-xs text-ink-soft" htmlFor="owner-search">
              {copy.ownerSearch[language]}
            </label>
            <input
              id="owner-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.ownerSearch[language]}
              className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-foam px-4 text-sm outline-none placeholder:text-ink-soft/70 focus:border-ink-soft"
              autoComplete="off"
            />
            <ul className="mt-3 space-y-2">
              {filtered.map((shop) => {
                const area =
                  language === "ar"
                    ? shop.neighborhoodAr
                    : neighborhoodLabel(shop.neighborhood as NeighborhoodId, "en");
                return (
                  <li key={shop.id}>
                    <button
                      type="button"
                      onClick={() => pickShop(shop.id)}
                      className="w-full rounded-2xl border border-line bg-foam px-4 py-3 text-start text-sm hover:border-bean"
                    >
                      <span className="font-medium">
                        {shopDisplayName(shop, language)}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">
                        {area}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <form className="mt-8 space-y-4" onSubmit={sendOtp}>
          <p className="text-xs text-ink-soft">2 · {copy.ownerStepWhatsapp[language]}</p>
          {!fromCard && selectedLabel ? (
            <p className="text-sm font-medium">{selectedLabel}</p>
          ) : null}
          <div>
            <label className="text-xs text-ink-soft" htmlFor="owner-phone">
              {copy.ownerPhone[language]}
            </label>
            <input
              id="owner-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={copy.ownerPhonePlaceholder[language]}
              inputMode="tel"
              autoComplete="tel"
              className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-foam px-4 text-sm outline-none placeholder:text-ink-soft/70 focus:border-ink-soft"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center rounded-2xl bg-bean px-4 text-sm text-foam hover:bg-bean-deep disabled:opacity-70"
          >
            {copy.ownerSendCode[language]}
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="mt-8 space-y-4" onSubmit={submitClaim}>
          <p className="text-xs text-ink-soft">3 · {copy.ownerStepProof[language]}</p>
          {otpStub ? (
            <p className="rounded-2xl bg-paper-deep px-4 py-3 text-sm leading-7 text-ink-soft">
              {copy.ownerOtpStub[language]} {copy.ownerStubCodeHint[language]}
            </p>
          ) : null}
          <div>
            <label className="text-xs text-ink-soft" htmlFor="owner-otp">
              {copy.ownerOtp[language]}
            </label>
            <input
              id="owner-otp"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-foam px-4 text-sm outline-none focus:border-ink-soft"
            />
          </div>
          <div>
            <p className="text-sm leading-7 text-ink-soft">
              {copy.ownerProofHint[language]}
            </p>
            <label className="mt-3 block text-xs text-ink-soft" htmlFor="owner-proof">
              {copy.ownerProofFile[language]}
            </label>
            <input
              id="owner-proof"
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(event) => {
                const file = event.target.files?.[0];
                setProofName(file?.name ?? "");
              }}
              className="mt-2 block w-full text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center rounded-2xl bg-bean px-4 text-sm text-foam hover:bg-bean-deep disabled:opacity-70"
          >
            {copy.ownerSubmit[language]}
          </button>
        </form>
      ) : null}

      {message && step !== "done" ? (
        <p className="mt-4 text-sm text-ink-soft" role="status">
          {message}
        </p>
      ) : null}

      <p className="mt-8">
        <Link
          href={homePath(language)}
          className="text-sm text-bean hover:text-bean-deep"
        >
          {copy.backToChat[language]}
        </Link>
      </p>
    </main>
  );
}
