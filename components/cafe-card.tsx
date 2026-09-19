"use client";

import { useEffect, useState } from "react";
import { CafeClaimFooter } from "@/components/cafe-claim-footer";
import { CafeDetail } from "@/components/cafe-detail";
import {
  CafePassportCard,
  type PassportSocial,
} from "@/components/cafe-passport-card";
import { CardBeen } from "@/components/card-been";
import {
  emptyPassport,
  preferPassportUi,
  type ClaimStatus,
  type PassportOwnerFields,
} from "@/lib/claims-types";
import type { DirectoryShop } from "@/lib/directory";
import { woodsPassportFixture } from "@/lib/passport-preview";
import { SHOW_BEEN_HERE } from "@/lib/tonight";
import type { Language, Shop } from "@/lib/types";

type CafeCardProps = {
  shop: Shop;
  language?: Language;
  previewPassport?: boolean;
  cardNumber?: string;
  backHref?: string;
  localeHref?: string;
  social?: PassportSocial | null;
  siblings?: DirectoryShop[];
};

type ClaimPayload = {
  ok?: boolean;
  status?: ClaimStatus;
  passport?: PassportOwnerFields;
  preview?: boolean;
};

export function CafeCard({
  shop,
  language = "ar",
  previewPassport = false,
  cardNumber = "00",
  backHref = "/",
  localeHref,
  social = null,
  siblings = [],
}: CafeCardProps) {
  const [status, setStatus] = useState<ClaimStatus>(
    previewPassport ? "verified" : "none",
  );
  const [passport, setPassport] = useState<PassportOwnerFields>(() =>
    previewPassport ? woodsPassportFixture(language) : emptyPassport(),
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/claims?shopId=${encodeURIComponent(shop.id)}`)
      .then((response) => response.json() as Promise<ClaimPayload>)
      .then((payload) => {
        if (cancelled || !payload.ok) return;
        if (payload.status === "verified") {
          setStatus("verified");
          setPassport(
            payload.preview
              ? woodsPassportFixture(language)
              : (payload.passport ?? emptyPassport()),
          );
          return;
        }
        if (payload.status === "pending") {
          setStatus("pending");
          return;
        }
        if (previewPassport) {
          setStatus("verified");
          setPassport(woodsPassportFixture(language));
          return;
        }
        setStatus("none");
      })
      .catch(() => {
        if (previewPassport) {
          setStatus("verified");
          setPassport(woodsPassportFixture(language));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [language, previewPassport, shop.id]);

  if (preferPassportUi(status)) {
    return (
      <CafePassportCard
        shop={shop}
        language={language}
        passport={passport}
        cardNumber={cardNumber}
        backHref={backHref}
        localeHref={localeHref ?? (language === "ar" ? `/en/c/${shop.id}` : `/c/${shop.id}`)}
        social={social}
      />
    );
  }

  return (
    <ThinCafeCard
      shop={shop}
      language={language}
      status={status}
      backHref={backHref}
      siblings={siblings}
    />
  );
}

function ThinCafeCard({
  shop,
  language,
  status,
  backHref,
  siblings,
}: {
  shop: Shop;
  language: Language;
  status: ClaimStatus;
  backHref: string;
  siblings: DirectoryShop[];
}) {
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
      <div className="mt-10">
        <CafeClaimFooter shop={shop} language={language} status={status} />
      </div>
    </div>
  );
}
