import { AboutPageView } from "@/components/about-page";
import { LOCKED_ABOUT } from "@/lib/product";

export const metadata = {
  title: "About",
  description: LOCKED_ABOUT.lead.en,
};

export default function EnglishAboutPage() {
  return <AboutPageView language="en" />;
}
