import { OwnerClaim } from "@/components/owner-claim";
import { ownerCatalogOptions } from "@/lib/claims";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME, SOCIAL_SHARE_IMAGE, SOCIAL_TWITTER_CARD } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${copy.ownerTitle.en} · ${PRODUCT_NAME}`,
  description: copy.ownerLead.en,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.ownerTitle.en,
    description: copy.ownerLead.en,
    siteName: PRODUCT_NAME,
    locale: "en_US",
    type: "website",
    url: "/en/owner",
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: copy.ownerTitle.en,
    description: copy.ownerLead.en,
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

export default async function EnglishOwnerPage({ searchParams }: OwnerPageProps) {
  const shops = ownerCatalogOptions();
  const initialShopId = shopQuery((await searchParams).shop);
  return (
    <OwnerClaim language="en" shops={shops} initialShopId={initialShopId} />
  );
}
