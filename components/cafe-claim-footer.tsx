"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { shopClaimWhatsAppHref } from "@/lib/product";
import type { ClaimStatus } from "@/lib/claims-types";
import type { Language, Shop } from "@/lib/types";

type CafeClaimFooterProps = {
  shop: Pick<Shop, "id" | "nameAr" | "nameEn">;
  language: Language;
};

type StatusPayload = {
  ok?: boolean;
  status?: ClaimStatus;
};

/**
 * Quiet card footer. Cold load shows the claim CTA (unclaimed default).
 * Hides the CTA after we learn the shop is pending or verified.
 * CTA is wa.me with a prefilled claim — phone digits are not shown.
 */
export function CafeClaimFooter({ shop, language }: CafeClaimFooterProps) {
  const [status, setStatus] = useState<ClaimStatus>("none");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/claims?shopId=${encodeURIComponent(shop.id)}`)
      .then((response) => response.json() as Promise<StatusPayload>)
      .then((payload) => {
        if (cancelled || !payload.ok) return;
        if (payload.status === "pending" || payload.status === "verified") {
          setStatus(payload.status);
        }
      })
      .catch(() => {
        /* keep the unclaimed CTA */
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  const showCta = status === "none";

  return (
    <footer className="mt-5 border-t border-line pt-3 text-xs text-ink-soft">
      <p dir="ltr">{copy.listedOn[language]}</p>
      {showCta ? (
        <p className="mt-1.5">
          <a
            href={shopClaimWhatsAppHref(shop, language)}
            className="underline-offset-2 hover:text-ink hover:underline"
          >
            {copy.ownThisCafe[language]}
          </a>
        </p>
      ) : null}
    </footer>
  );
}
