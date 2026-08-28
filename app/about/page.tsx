import { AboutPageView } from "@/components/about-page";
import { LOCKED_ABOUT } from "@/lib/product";

export const metadata = {
  title: "عن كوفي",
  description: LOCKED_ABOUT.lead.ar,
};

export default function AboutPage() {
  return <AboutPageView language="ar" />;
}
