import { AboutPageView } from "@/components/about-page";
import { copy } from "@/lib/copy";
import { LOCKED_ABOUT, PRODUCT_NAME } from "@/lib/product";

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
  },
  twitter: {
    card: "summary",
    title: copy.about.ar,
    description: `${LOCKED_ABOUT.lead.ar} ${LOCKED_ABOUT.body.ar}`,
  },
};

export default function AboutPage() {
  return <AboutPageView language="ar" />;
}
