import { FeedbackBoard } from "@/components/feedback-board";
import { loadFeedbackSnapshot } from "@/lib/feedback";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${copy.feedbackTitle.en} · ${PRODUCT_NAME}`,
  description: copy.feedbackSubtitle.en,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.feedbackTitle.en,
    description: copy.feedbackSubtitle.en,
    siteName: PRODUCT_NAME,
    locale: "en_US",
    type: "website",
    url: "/en/feedback",
  },
  twitter: {
    card: "summary",
    title: copy.feedbackTitle.en,
    description: copy.feedbackSubtitle.en,
  },
};

export default async function EnglishFeedbackPage() {
  const snapshot = await loadFeedbackSnapshot();
  return <FeedbackBoard language="en" snapshot={snapshot} />;
}
