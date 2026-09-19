"use client";

import { DirectoryUpvote } from "@/components/directory-upvote";
import { MapsLink } from "@/components/maps-link";
import { ShareListingButton } from "@/components/share-listing-button";
import { TargetIcon } from "@/components/target-icon";
import { ViralShareActions } from "@/components/viral-share";
import { copy } from "@/lib/copy";
import { shopMapsHref } from "@/lib/public-url";
import { SHOW_INVITE_CTA, SHOW_TONIGHT_CARD } from "@/lib/tonight";
import type { Language, Shop } from "@/lib/types";

type CafePresenceRowProps = {
  shop: Shop;
  language: Language;
  photo?: string | null;
  variant: "passport" | "thin";
};

/**
 * Locked cafe actions: compact like, listing-share icon, parked وين؟
 * (`SHOW_INVITE_CTA`), Maps hugging its label. No X / Stories / Snap grid.
 */
export function CafePresenceRow({
  shop,
  language,
  photo = null,
  variant,
}: CafePresenceRowProps) {
  const mapsClass =
    variant === "passport"
      ? "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gold px-3 py-2 text-sm text-gold hover:bg-passport-wash min-h-11"
      : "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border border-gold px-3 text-sm text-gold-deep hover:bg-passport-wash min-h-11";

  return (
    <div className="flex items-center gap-2" dir="ltr">
      <DirectoryUpvote
        shopId={shop.id}
        language={language}
        variant={variant === "passport" ? "passport" : "list"}
      />
      <ShareListingButton
        shop={shop}
        language={language}
        source="card"
        compact
        variant={variant === "passport" ? "passport" : "default"}
      />
      {SHOW_TONIGHT_CARD || SHOW_INVITE_CTA ? (
        <ViralShareActions
          shop={shop}
          language={language}
          photo={photo}
          variant={variant}
        />
      ) : null}
      <MapsLink
        href={shopMapsHref(shop)}
        shopId={shop.id}
        locale={language}
        source="card"
        className={mapsClass}
      >
        <TargetIcon />
        <span>{copy.takeMeThere[language]}</span>
      </MapsLink>
    </div>
  );
}
