import { EnRichText } from "@/components/en-rich-text";
import { cafeArMarkdown } from "@/lib/ar-content";
import { cafeEnMarkdown } from "@/lib/en-content";
import type { Language, Shop } from "@/lib/types";

type CafeEnBlurbProps = {
  shop: Shop;
  language?: Language;
};

export function CafeEnBlurb({
  shop,
  language = "en",
}: CafeEnBlurbProps) {
  const markdown =
    language === "ar" ? cafeArMarkdown(shop) : cafeEnMarkdown(shop);

  return (
    <section
      data-cafe-seo-essay=""
      className="mt-8 text-wain-soft-taupe [&_a]:text-wain-soft-taupe [&_a]:underline [&_strong]:font-medium [&_strong]:text-wain-soft-taupe"
      aria-label={language === "ar" ? "عن وين" : "On wain"}
    >
      <EnRichText
        markdown={markdown}
        className="space-y-3 text-[13px] leading-6 text-wain-soft-taupe"
      />
    </section>
  );
}
