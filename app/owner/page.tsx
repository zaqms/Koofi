import { OwnerClaim } from "@/components/owner-claim";
import { getShop } from "@/lib/catalog";
import { copy } from "@/lib/copy";
import {
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  shopDisplayName,
} from "@/lib/product";

export const dynamic = "force-dynamic";

type OwnerPageProps = {
  searchParams: Promise<{ shop?: string | string[] }>;
};

function shopQuery(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export async function generateMetadata({ searchParams }: OwnerPageProps) {
  const shop = getShop(shopQuery((await searchParams).shop) ?? "");
  const title = shop
    ? `${shopDisplayName(shop, "ar")} · ${PRODUCT_NAME}`
    : `${copy.ownerTitle.ar} · ${PRODUCT_NAME}`;
  const description = shop ? shop.neighborhoodAr : copy.ownerLead.ar;
  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: "ar_SA",
      type: "website",
      url: shop ? `/owner?shop=${encodeURIComponent(shop.id)}` : "/owner",
      images: [SOCIAL_SHARE_IMAGE],
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
      description,
      images: [SOCIAL_SHARE_IMAGE],
    },
  };
}

export default async function OwnerPage({ searchParams }: OwnerPageProps) {
  const shop = getShop(shopQuery((await searchParams).shop) ?? "");
  return <OwnerClaim language="ar" shop={shop} />;
}
