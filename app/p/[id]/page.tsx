import { notFound } from "next/navigation";
import { cache } from "react";
import { Chat } from "@/components/chat";
import { SiteFooter } from "@/components/site-footer";
import { TrackShareInbound } from "@/components/track-share-inbound";
import { packToChatPicks, resolvePack } from "@/lib/pack";
import { PRODUCT_NAME, SOCIAL_SHARE_IMAGE, shopDisplayName } from "@/lib/product";

type PackPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

const loadPack = cache((id: string) => resolvePack(id));

function inboundFrom(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export async function generateMetadata({ params }: PackPageProps) {
  const { id } = await params;
  const pack = loadPack(id);
  if (!pack) {
    return { title: PRODUCT_NAME };
  }

  const names = pack.shops
    .map((shop) => shopDisplayName(shop, pack.locale))
    .join(" · ");
  const area = pack.neighborhoodLabel;
  const description = [...pack.whys, area].filter(Boolean).join(" · ");

  return {
    title: `${names} · ${area}`,
    description,
    openGraph: {
      title: `${names} · ${area}`,
      description,
      locale: pack.locale === "en" ? "en_US" : "ar_SA",
      siteName: PRODUCT_NAME,
      type: "website",
      images: [SOCIAL_SHARE_IMAGE],
    },
    twitter: {
      card: "summary",
      title: `${names} · ${area}`,
      description,
      images: [SOCIAL_SHARE_IMAGE],
    },
  };
}

export default async function PackPage({ params, searchParams }: PackPageProps) {
  const { id } = await params;
  const pack = loadPack(id);
  if (!pack) notFound();

  const from = inboundFrom((await searchParams).from);
  const picks = packToChatPicks(pack);

  return (
    <main className="min-h-dvh">
      <TrackShareInbound kind="pack" packId={pack.id} from={from} />
      <Chat
        landing={pack.locale}
        restore={{
          packId: pack.id,
          ask: pack.ask,
          picks,
          language: pack.locale,
        }}
      />
      <SiteFooter language={pack.locale} />
    </main>
  );
}
