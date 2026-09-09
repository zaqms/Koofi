import { EnRichText } from "@/components/en-rich-text";
import { cafeEnMarkdown } from "@/lib/en-content";
import type { Shop } from "@/lib/types";

type CafeEnBlurbProps = {
  shop: Shop;
};

export function CafeEnBlurb({ shop }: CafeEnBlurbProps) {
  return (
    <section className="mt-6" aria-label="On wain">
      <EnRichText markdown={cafeEnMarkdown(shop)} />
    </section>
  );
}
