import { HomeLanding } from "@/components/home-landing";
import {
  LOCKED_OPENER_EN,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
} from "@/lib/product";

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
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: PRODUCT_NAME,
    description: LOCKED_OPENER_EN,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function EnglishHome() {
  return <HomeLanding language="en" />;
}
