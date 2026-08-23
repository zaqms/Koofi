import Link from "next/link";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { cardPath, shopDisplayName } from "@/lib/product";
import type { Language } from "@/lib/types";

type DirectoryCardProps = {
  shop: DirectoryShop;
  language: Language;
};

export function DirectoryCard({ shop, language }: DirectoryCardProps) {
  const name = shopDisplayName(shop, language);
  const other = shopDisplayName(shop, language === "ar" ? "en" : "ar");
  const area = language === "ar" ? shop.neighborhoodAr : neighborhoodLabel(shop.neighborhood, "en");
  const vibe = shop.vibeTags.slice(0, 3).join(" · ");

  return (
    <li className="rounded-2xl border border-line bg-foam px-3 py-3">
      <div className="flex min-w-0 items-start gap-3" dir="ltr">
        <ShopVisual
          nameAr={shop.nameAr}
          nameEn={shop.nameEn}
          photoUrl={shop.photoUrl}
          logoUrl={shop.logoUrl}
        />
        <div
          className="min-w-0 flex-1"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <h3 className="text-lg font-semibold leading-tight">{name}</h3>
          <p className="text-[11px] leading-4 text-ink-soft" dir="auto">
            {other} · {area}
          </p>
          {vibe ? (
            <p className="mt-1 truncate text-sm leading-5">{vibe}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={cardPath(shop.id)}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.cardLink[language]}
        </Link>
        <a
          href={shop.mapsHref}
          className="rounded-full bg-bean px-3 py-1 text-xs text-foam hover:bg-bean-deep"
        >
          {copy.maps[language]}
        </a>
      </div>
    </li>
  );
}
