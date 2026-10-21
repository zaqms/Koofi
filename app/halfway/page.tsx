import { HomeLanding } from "@/components/home-landing";
import { halfwayPageMetadata } from "@/lib/chip-page";
import { DEFAULT_LIVE_CITY } from "@/lib/cities";

export const metadata = halfwayPageMetadata("ar");

export default function HalfwayPage() {
  return (
    <HomeLanding
      language="ar"
      city={DEFAULT_LIVE_CITY}
      selectedChipId="meet-halfway"
    />
  );
}
