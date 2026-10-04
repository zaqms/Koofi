import { LegalPageView } from "@/components/legal-page";
import { legalDoc } from "@/lib/legal";
import { pageAlternates } from "@/lib/locale";
import {
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  termsPath,
} from "@/lib/product";

const language = "ar" as const;
const doc = legalDoc("terms", language);
const url = termsPath(language);

export const metadata = {
  title: doc.title,
  description: doc.description,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  alternates: pageAlternates(url, termsPath("ar"), termsPath("en")),
  openGraph: {
    title: doc.title,
    description: doc.description,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url,
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: doc.title,
    description: doc.description,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function TermsPage() {
  return <LegalPageView kind="terms" language={language} />;
}
