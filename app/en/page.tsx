import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import { listingOgImage } from "@/lib/listing-og";
import {
  LOCKED_OPENER_EN,
  PRODUCT_NAME,
  SOCIAL_TWITTER_CARD,
} from "@/lib/product";
import { websiteJsonLd } from "@/lib/structured-data";

const homeOg = listingOgImage({ kind: "home", language: "en" }, LOCKED_OPENER_EN);

export const metadata = {
  title: PRODUCT_NAME,
  description: LOCKED_OPENER_EN,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: PRODUCT_NAME,
    description: LOCKED_OPENER_EN,
    siteName: PRODUCT_NAME,
    locale: "en_US",
    type: "website",
    url: "/en",
    images: [homeOg],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: PRODUCT_NAME,
    description: LOCKED_OPENER_EN,
    images: [homeOg],
  },
};

export default function EnglishHome() {
  return (
    <>
      <JsonLd data={websiteJsonLd("en")} />
      <HomeLanding language="en" />
    </>
  );
}
