import { Chat } from "@/components/chat";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { ShopUpvoteProvider } from "@/components/shop-upvote-provider";
import { SiteFooter } from "@/components/site-footer";
import { listDirectoryShops } from "@/lib/catalog";
import { listPopularDirectoryShops } from "@/lib/most-popular";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import {
  districtPath,
  filterPutsDirectoryFirst,
  mostPopularPath,
} from "@/lib/product";
import type { Language, NeighborhoodId } from "@/lib/types";

type HomeLandingProps = {
  language: Language;
  district?: NeighborhoodId | null;
  listing?: "popular" | null;
};

export function HomeLanding({
  language,
  district = null,
  listing = null,
}: HomeLandingProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const popular = listing === "popular";
  const localeHref = popular
    ? mostPopularPath(other)
    : district
      ? districtPath(district, other)
      : undefined;
  const week = (
    <NewThisWeek language={language} shops={listNewThisWeekShops()} />
  );
  const directory = (
    <ShopDirectory
      language={language}
      shops={popular ? listPopularDirectoryShops() : listDirectoryShops()}
      district={district}
      listing={listing}
    />
  );

  return (
    <main className="min-h-dvh">
      <Chat
        landing={language}
        localeHref={localeHref}
        selectedChipId={popular ? "popular" : undefined}
      />
      <ShopUpvoteProvider>
        {filterPutsDirectoryFirst(listing, district) ? (
          <>
            {directory}
            {week}
          </>
        ) : (
          <>
            {week}
            {directory}
          </>
        )}
      </ShopUpvoteProvider>
      <SiteFooter language={language} />
    </main>
  );
}
