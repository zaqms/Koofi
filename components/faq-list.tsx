import type { FaqItem } from "@/lib/faq";
import type { Language } from "@/lib/types";

type FaqListProps = {
  items: readonly FaqItem[];
  language: Language;
  heading?: string;
  compact?: boolean;
};

/** Visible FAQ. Same `items` must feed FAQPage JSON-LD — no hidden extras. */
export function FaqList({ items, language, heading, compact = false }: FaqListProps) {
  const dir = language === "ar" ? "rtl" : "ltr";

  if (compact) {
    return (
      <dl className="mt-3 space-y-2" dir={dir} lang={language}>
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-xs font-medium">{item.q}</dt>
            <dd className="mt-0.5 text-xs leading-5 text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <section
      className="mt-6 rounded-2xl border border-line bg-foam px-4 py-5"
      dir={dir}
      lang={language}
      aria-labelledby={heading ? "faq-heading" : undefined}
    >
      {heading ? (
        <h2 id="faq-heading" className="text-base font-semibold">
          {heading}
        </h2>
      ) : null}
      <dl>
        {items.map((item) => (
          <div key={item.q} className={heading ? "mt-4" : "mt-3 first:mt-0"}>
            <dt className="text-sm font-medium">{item.q}</dt>
            <dd className="mt-1 text-sm leading-7 text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
