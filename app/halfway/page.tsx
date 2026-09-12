import { HomeLanding } from "@/components/home-landing";
import { halfwayPageMetadata } from "@/lib/chip-page";

export const metadata = halfwayPageMetadata("ar");

export default function HalfwayPage() {
  return <HomeLanding language="ar" selectedChipId="meet-halfway" />;
}
