import { EnRichText } from "@/components/en-rich-text";
import { districtEnMarkdown } from "@/lib/en-content";
import type { NeighborhoodId } from "@/lib/types";

type DistrictEnBodyProps = {
  district: NeighborhoodId;
};

export function DistrictEnBody({ district }: DistrictEnBodyProps) {
  return (
    <div className="mt-3">
      <EnRichText markdown={districtEnMarkdown(district)} skipHeadingLevel1 />
    </div>
  );
}
