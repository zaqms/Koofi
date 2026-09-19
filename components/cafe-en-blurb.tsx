import { EnRichText } from "@/components/en-rich-text";
import { cafeArMarkdown } from "@/lib/ar-content";
import { cafeEnMarkdown } from "@/lib/en-content";
import type { Language, Shop } from "@/lib/types";

type CafeEnBlurbProps = {
  shop: Shop;
  language?: Language;
  visuallyHidden?: boolean;
};

export function CafeEnBlurb({
  shop,
  language = "en",
  visuallyHidden = false,
}: CafeEnBlurbProps) {
  const markdown =
    language === "ar" ? cafeArMarkdown(shop) : cafeEnMarkdown(shop);

  return (
    <section
      className={visuallyHidden ? "sr-only" : "mt-6"}
      aria-label={language === "ar" ? "عن وين" : "On wain"}
    >
      <EnRichText markdown={markdown} />
    </section>
  );
}
