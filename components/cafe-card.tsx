"use client";

import { useEffect, useState } from "react";
import { CafeClaimFooter } from "@/components/cafe-claim-footer";
import { CafeDetail } from "@/components/cafe-detail";
import { CardBeen } from "@/components/card-been";
import type { ClaimStatus } from "@/lib/claims-types";
import type { DirectoryShop } from "@/lib/directory";
import { SHOW_BEEN_HERE } from "@/lib/tonight";
import type { Language, Shop } from "@/lib/types";

type CafeCardProps = {
  shop: Shop;
  language?: Language;
  backHref?: string;
  siblings?: DirectoryShop[];
};

type ClaimPayload = {
  ok?: boolean;
  status?: ClaimStatus;
};

export function CafeCard({
  shop,
  language = "ar",
  backHref = "/",
  siblings = [],
}: CafeCardProps) {
  const [status, setStatus] = useState<ClaimStatus>("none");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/claims?shopId=${encodeURIComponent(shop.id)}`)
      .then((response) => response.json() as Promise<ClaimPayload>)
      .then((payload) => {
        if (cancelled || !payload.ok) return;
        if (payload.status === "verified" || payload.status === "pending") {
          setStatus(payload.status);
          return;
        }
        setStatus("none");
      })
      .catch(() => {
        if (!cancelled) setStatus("none");
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  return (
    <div>
      <CafeDetail
        shop={shop}
        language={language}
        backHref={backHref}
        siblings={siblings}
      />
      {SHOW_BEEN_HERE ? (
        <CardBeen shopId={shop.id} language={language} />
      ) : null}
      <div className="sr-only">
        <CafeClaimFooter shop={shop} language={language} status={status} />
      </div>
    </div>
  );
}
