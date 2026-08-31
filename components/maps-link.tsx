"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { trackEvent, type MapsClickSource } from "@/lib/track";
import type { Language } from "@/lib/types";

type MapsLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
  shopId: string;
  locale: Language;
  source: MapsClickSource;
};

/** External Maps CTA. Always leaves Koofi open in the current tab. */
export function MapsLink({
  href,
  children,
  shopId,
  locale,
  source,
  onClick,
  ...props
}: MapsLinkProps) {
  function fireMapsClick() {
    trackEvent(
      "maps_click",
      { shop_id: shopId, locale, source },
      { dedupeKey: `maps_click:${shopId}:${source}` },
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        fireMapsClick();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
