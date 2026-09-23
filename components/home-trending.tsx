import Link from "next/link";
import { ShopVisual } from "@/components/shop-visual";
import { ViewAllLink } from "@/components/view-all-link";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { cardPath, shopDisplayName } from "@/lib/product";
import type { Language } from "@/lib/types";

type HomeTrendingProps = {
  language: Language;
  shops: DirectoryShop[];
};

/** Home preview. Same three allowlist rows in EN and AR. District pages keep the full cards. */
const HOME_TRENDING_COUNT = 3;

export function HomeTrending({ language, shops }: HomeTrendingProps) {
  const rows = shops.slice(0, HOME_TRENDING_COUNT);
  if (rows.length === 0) return null;
  const rtl = language === "ar";

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-2 pb-0.5"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="wain-trending"
      data-home-trending=""
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="wain-trending"
          className="min-w-0 text-base font-semibold leading-6"
        >
          {copy.trendingThisWeek[language]}
        </h2>
        <ViewAllLink href="#wain-riyadh-cafes" language={language} />
      </div>
      <ul className="mt-2 grid grid-cols-3 items-stretch gap-2">
        {rows.map((shop) => (
          <li key={shop.id} className="min-w-0">
            <Link
              href={cardPath(shop.id, language)}
              data-trending-id={shop.id}
              className="flex h-full min-h-[3.85rem] items-center gap-1.5 rounded-2xl border border-line bg-foam p-1"
            >
              <ShopVisual
                nameAr={shop.nameAr}
                nameEn={shop.nameEn}
                photoUrl={shop.photoUrl}
                logoUrl={shop.logoUrl}
                size="md"
              />
              <span className="line-clamp-3 min-w-0 flex-1 text-start text-[12px] font-medium leading-[1.2] text-ink">
                {shopDisplayName(shop, language)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
