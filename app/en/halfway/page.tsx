import { HomeLanding } from "@/components/home-landing";
import { halfwayPageMetadata } from "@/lib/chip-page";
import { DEFAULT_LIVE_CITY } from "@/lib/cities";

export const metadata = halfwayPageMetadata("en");

export default function EnglishHalfwayPage() {
  return (
    <HomeLanding
      language="en"
      city={DEFAULT_LIVE_CITY}
      selectedChipId="meet-halfway"
    />
  );
}
