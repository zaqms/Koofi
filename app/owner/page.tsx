import { OwnerClaim } from "@/components/owner-claim";
import { ownerCatalogOptions } from "@/lib/claims";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME, SOCIAL_SHARE_IMAGE, SOCIAL_TWITTER_CARD } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${copy.ownerTitle.ar} · ${PRODUCT_NAME}`,
  description: copy.ownerLead.ar,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.ownerTitle.ar,
    description: copy.ownerLead.ar,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/owner",
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: copy.ownerTitle.ar,
    description: copy.ownerLead.ar,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

type OwnerPageProps = {
  searchParams: Promise<{ shop?: string | string[] }>;
};

function shopQuery(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export default async function OwnerPage({ searchParams }: OwnerPageProps) {
  const shops = ownerCatalogOptions();
  const initialShopId = shopQuery((await searchParams).shop);
  return (
    <OwnerClaim language="ar" shops={shops} initialShopId={initialShopId} />
  );
}
