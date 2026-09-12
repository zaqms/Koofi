import { HomeLanding } from "@/components/home-landing";
import { halfwayPageMetadata } from "@/lib/chip-page";

export const metadata = halfwayPageMetadata("en");

export default function EnglishHalfwayPage() {
  return <HomeLanding language="en" selectedChipId="meet-halfway" />;
}
