import { AboutPageView } from "@/components/about-page";
import { copy } from "@/lib/copy";
import { LOCKED_ABOUT, PRODUCT_NAME } from "@/lib/product";

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
  },
  twitter: {
    card: "summary",
    title: copy.about.en,
    description: LOCKED_ABOUT.lead.en,
  },
};

export default function EnglishAboutPage() {
  return <AboutPageView language="en" />;
}
