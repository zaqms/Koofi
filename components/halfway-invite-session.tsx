import { Chat } from "@/components/chat";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { parseHalfwayInviteToken } from "@/lib/halfway-invite";
import { resolveHalfwayInviteSession } from "@/lib/halfway-invite-store";
import {
  halfwayFrozenMore,
  restoreHalfwayPicks,
} from "@/lib/meet-halfway";
import { halfwayInviteLocaleHref, PRODUCT_NAME, SOCIAL_TWITTER_CARD } from "@/lib/product";
import type { Language } from "@/lib/types";

type HalfwayInviteSessionInput = {
  language: Language;
  id: string;
  from?: string;
};

function inboundFrom(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export function halfwayInviteFromSearch(
  value: string | string[] | undefined,
): string | undefined {
  return inboundFrom(value);
}

export async function halfwayInviteMetadata(input: HalfwayInviteSessionInput) {
  const rawId = decodeURIComponent(input.id);
  const resolved = await resolveHalfwayInviteSession(rawId);
  const locale = input.language;
  const title =
    !resolved.ok && resolved.reason === "expired"
      ? locale === "en"
        ? "This Halfway expired"
        : "هالجولة انتهت"
      : resolved.ok && resolved.session.shopIds.length > 0
        ? locale === "en"
          ? "Three cafes between you"
          : "ثلاث قهاوي بينكم"
        : locale === "en"
          ? "Halfway — drop your pin"
          : "بيننا — دبّس موقعك";
  return {
    title: `${title} · ${PRODUCT_NAME}`,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      siteName: PRODUCT_NAME,
      type: "website",
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
    },
  };
}

export async function HalfwayInviteSession({
  language,
  id,
  from,
}: HalfwayInviteSessionInput) {
  const rawId = decodeURIComponent(id);
  const parsed = parseHalfwayInviteToken(rawId);
  const resolved = await resolveHalfwayInviteSession(rawId);
  const expired = !resolved.ok && resolved.reason === "expired";
  const shopIds = resolved.ok ? resolved.session.shopIds : [];
  const locations = resolved.ok
    ? resolved.session.locations
    : parsed.ok
      ? parsed.seed.locations
      : [];
  const picks =
    shopIds.length > 0
      ? restoreHalfwayPicks({ shopIds, language })
      : undefined;
  const halfwayMore =
    resolved.ok && picks && picks.length > 0
      ? halfwayFrozenMore({
          locations: resolved.session.locations.map((pin) => ({ pin })),
          shopIds,
        })
      : undefined;

  return (
    <main className="min-h-dvh">
      {resolved.ok ? (
        <TrackShareInbound kind="halfway" packId={rawId} from={from} />
      ) : null}
      <Chat
        landing={language}
        localeHref={halfwayInviteLocaleHref(rawId, language, from)}
        selectedChipId="meet-halfway"
        halfwayInviteExpired={expired}
        halfwayInvite={
          resolved.ok
            ? {
                id: rawId,
                language,
                locations: locations.map((pin) => ({
                  lat: pin.lat,
                  lng: pin.lng,
                })),
                shopIds,
                picks,
                halfwayMore,
                joined: resolved.joined,
              }
            : undefined
        }
      />
      <SiteFooter language={language} />
    </main>
  );
}
