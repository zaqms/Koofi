import { DirectoryCard } from "@/components/directory-card";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import type { Language } from "@/lib/types";

type NewThisWeekProps = {
  language: Language;
  shops: DirectoryShop[];
};

export function NewThisWeek({ language, shops }: NewThisWeekProps) {
  if (shops.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-2"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="koofi-new-this-week"
    >
      <h2 id="koofi-new-this-week" className="text-base font-semibold">
        {copy.newThisWeek[language]}
      </h2>
      <p className="mt-1 text-xs leading-5 text-ink-soft">
        {copy.newThisWeekHint[language]}
      </p>
      <ul className="mt-4 grid gap-2">
        {shops.map((shop) => (
          <DirectoryCard key={shop.id} shop={shop} language={language} />
        ))}
      </ul>
    </section>
  );
}
