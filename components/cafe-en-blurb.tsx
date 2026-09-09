import { EnRichText } from "@/components/en-rich-text";
import { cafeArMarkdown } from "@/lib/ar-content";
import { cafeEnMarkdown } from "@/lib/en-content";
import type { Language, Shop } from "@/lib/types";

type CafeEnBlurbProps = {
  shop: Shop;
  language?: Language;
};

export function CafeEnBlurb({ shop, language = "en" }: CafeEnBlurbProps) {
  const markdown =
    language === "ar" ? cafeArMarkdown(shop) : cafeEnMarkdown(shop);

  return (
    <section
      className="mt-6"
      aria-label={language === "ar" ? "عن وين" : "On wain"}
    >
      <EnRichText markdown={markdown} />
    </section>
  );
}
