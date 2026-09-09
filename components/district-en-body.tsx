import { EnRichText } from "@/components/en-rich-text";
import { districtArMarkdown } from "@/lib/ar-content";
import { districtEnMarkdown } from "@/lib/en-content";
import type { Language, NeighborhoodId } from "@/lib/types";

type DistrictEnBodyProps = {
  district: NeighborhoodId;
  language?: Language;
};

export function DistrictEnBody({
  district,
  language = "en",
}: DistrictEnBodyProps) {
  const markdown =
    language === "ar"
      ? districtArMarkdown(district)
      : districtEnMarkdown(district);

  return (
    <div className="mt-3">
      <EnRichText markdown={markdown} skipHeadingLevel1 />
    </div>
  );
}
