import { Chat } from "@/components/chat";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { inspectHalfwayInviteId } from "@/lib/halfway-invite";
import { PRODUCT_NAME, SOCIAL_TWITTER_CARD } from "@/lib/product";

export const dynamic = "force-dynamic";

type HalfwayInvitePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

function inboundFrom(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export async function generateMetadata({ params }: HalfwayInvitePageProps) {
  const { id } = await params;
  const inspected = inspectHalfwayInviteId(decodeURIComponent(id));
  const title =
    inspected.ok && inspected.seed.locale === "en"
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

export default async function HalfwayInvitePage({
  params,
  searchParams,
}: HalfwayInvitePageProps) {
  const rawId = decodeURIComponent((await params).id);
  const from = inboundFrom((await searchParams).from);
  const inspected = inspectHalfwayInviteId(rawId);
  const language = inspected.ok ? inspected.seed.locale : "ar";

  return (
    <main className="min-h-dvh">
      {inspected.ok ? (
        <TrackShareInbound kind="halfway" packId={rawId} from={from} />
      ) : null}
      <Chat
        landing={language}
        selectedChipId="meet-halfway"
        halfwayInviteExpired={!inspected.ok && inspected.reason === "expired"}
        halfwayInvite={
          inspected.ok
            ? {
                id: rawId,
                language: inspected.seed.locale,
                locations: inspected.seed.locations.map((pin) => ({
                  lat: pin.lat,
                  lng: pin.lng,
                })),
              }
            : undefined
        }
      />
      <SiteFooter language={language} />
    </main>
  );
}
