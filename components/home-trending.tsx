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
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-2"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="wain-trending"
      data-home-trending=""
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="wain-trending"
          className="min-w-0 text-lg font-semibold leading-7"
        >
          {copy.trendingThisWeek[language]}
        </h2>
        <ViewAllLink href="#wain-riyadh-cafes" language={language} />
      </div>
      <ul className="mt-3 flex items-stretch gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((shop) => (
          <li key={shop.id} className="flex w-[9.25rem] shrink-0">
            <Link
              href={cardPath(shop.id, language)}
              data-trending-id={shop.id}
              className="flex h-full min-h-[4.75rem] w-full items-center gap-2 rounded-[1.15rem] border border-line bg-foam px-2 py-2"
            >
              <ShopVisual
                nameAr={shop.nameAr}
                nameEn={shop.nameEn}
                photoUrl={shop.photoUrl}
                logoUrl={shop.logoUrl}
                size="lg"
              />
              <span className="line-clamp-3 min-w-0 flex-1 text-start text-[13px] font-semibold leading-4 text-ink">
                {shopDisplayName(shop, language)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
