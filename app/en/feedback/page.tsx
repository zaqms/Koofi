import { FeedbackBoard } from "@/components/feedback-board";
import { loadFeedbackSnapshot } from "@/lib/feedback";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME, SOCIAL_SHARE_IMAGE, SOCIAL_TWITTER_CARD } from "@/lib/product";

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
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: copy.feedbackTitle.en,
    description: copy.feedbackSubtitle.en,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default async function EnglishFeedbackPage() {
  const snapshot = await loadFeedbackSnapshot();
  return <FeedbackBoard language="en" snapshot={snapshot} />;
}
