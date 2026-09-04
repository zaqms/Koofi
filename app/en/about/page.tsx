import { AboutPageView } from "@/components/about-page";
import { JsonLd } from "@/components/json-ld";
import { copy } from "@/lib/copy";
import { aboutFaqJsonLd } from "@/lib/faq";
import { LOCKED_ABOUT, PRODUCT_NAME, SOCIAL_SHARE_IMAGE } from "@/lib/product";

export const metadata = {
  title: copy.about.en,
  description: LOCKED_ABOUT.lead.en,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.about.en,
    description: LOCKED_ABOUT.lead.en,
    siteName: PRODUCT_NAME,
    locale: "en_US",
    type: "website",
    url: "/en/about",
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: "summary",
    title: copy.about.en,
    description: LOCKED_ABOUT.lead.en,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function EnglishAboutPage() {
  return (
    <>
      <JsonLd data={aboutFaqJsonLd("en")} />
      <AboutPageView language="en" />
    </>
  );
}
