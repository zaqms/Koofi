import { AboutPageView } from "@/components/about-page";
import { JsonLd } from "@/components/json-ld";
import { copy } from "@/lib/copy";
import { aboutFaqJsonLd } from "@/lib/faq";
import { LOCKED_ABOUT, PRODUCT_NAME, SOCIAL_SHARE_IMAGE } from "@/lib/product";

export const metadata = {
  title: copy.about.ar,
  description: `${LOCKED_ABOUT.lead.ar} ${LOCKED_ABOUT.body.ar}`,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.about.ar,
    description: `${LOCKED_ABOUT.lead.ar} ${LOCKED_ABOUT.body.ar}`,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/about",
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: "summary",
    title: copy.about.ar,
    description: `${LOCKED_ABOUT.lead.ar} ${LOCKED_ABOUT.body.ar}`,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutFaqJsonLd("ar")} />
      <AboutPageView language="ar" />
    </>
  );
}
