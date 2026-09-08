import { OwnerClaim } from "@/components/owner-claim";
import { getShop } from "@/lib/catalog";
import { ownerCatalogOptions } from "@/lib/claims";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
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
    ? `${shopDisplayName(shop, "en")} · ${PRODUCT_NAME}`
    : `${copy.ownerTitle.en} · ${PRODUCT_NAME}`;
  const description = shop
    ? neighborhoodLabel(shop.neighborhood, "en")
    : copy.ownerLead.en;
  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: "en_US",
      type: "website",
      url: shop ? `/en/owner?shop=${encodeURIComponent(shop.id)}` : "/en/owner",
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

export default async function EnglishOwnerPage({ searchParams }: OwnerPageProps) {
  const shops = ownerCatalogOptions();
  const initialShopId = shopQuery((await searchParams).shop);
  return (
    <OwnerClaim language="en" shops={shops} initialShopId={initialShopId} />
  );
}
