import { NeighborhoodsPageView } from "@/components/neighborhoods-page";
import {
  listNeighborhoodRows,
  neighborhoodsIndexDescription,
  neighborhoodsIndexTitle,
} from "@/lib/browse-neighborhoods";
import { listDirectoryShops } from "@/lib/catalog";
import { pageAlternates } from "@/lib/locale";
import {
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  neighborhoodsPath,
} from "@/lib/product";

const language = "ar" as const;
const title = neighborhoodsIndexTitle(language);
const description = neighborhoodsIndexDescription(language);
const url = neighborhoodsPath(language);

export const metadata = {
  title,
  description,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  alternates: pageAlternates(
    url,
    neighborhoodsPath("ar"),
    neighborhoodsPath("en"),
  ),
  openGraph: {
    title,
    description,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url,
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title,
    description,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function NeighborhoodsPage() {
  return (
    <NeighborhoodsPageView
      language="ar"
      rows={listNeighborhoodRows("ar", listDirectoryShops())}
    />
  );
}
