import { FeedbackBoard } from "@/components/feedback-board";
import { loadFeedbackSnapshot } from "@/lib/feedback";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${copy.feedbackTitle.ar} · ${PRODUCT_NAME}`,
  description: copy.feedbackSubtitle.ar,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: copy.feedbackTitle.ar,
    description: copy.feedbackSubtitle.ar,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/feedback",
  },
  twitter: {
    card: "summary",
    title: copy.feedbackTitle.ar,
    description: copy.feedbackSubtitle.ar,
  },
};

export default async function FeedbackPage() {
  const snapshot = await loadFeedbackSnapshot();
  return <FeedbackBoard language="ar" snapshot={snapshot} />;
}
