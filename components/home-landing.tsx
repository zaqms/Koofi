import { BrowseNeighborhoods } from "@/components/browse-neighborhoods";
import { Chat } from "@/components/chat";
import { DocumentLocale } from "@/components/document-locale";
import { DistrictEnBody } from "@/components/district-en-body";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { ShopClaimProvider } from "@/components/shop-claim-provider";
import { ShopUpvoteProvider } from "@/components/shop-upvote-provider";
import { SiteFooter } from "@/components/site-footer";
import {
  listDirectoryShops,
  listDirectoryShopsForDistrict,
  listDriveThroughDirectoryShops,
} from "@/lib/catalog";
import { listPopularDirectoryShops } from "@/lib/most-popular";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import { restoreOffHomeChipOpen } from "@/lib/chip-open";
import {
  chipDirectoryMoment,
  chipSharePath,
  districtPath,
  filterPutsDirectoryFirst,
  isOffHomeChipId,
  mostPopularPath,
} from "@/lib/product";
import type { Language, NeighborhoodId } from "@/lib/types";

type HomeLandingProps = {
  language: Language;
  district?: NeighborhoodId | null;
  listing?: "popular" | null;
  selectedChipId?: string | null;
};

export function HomeLanding({
  language,
  district = null,
  listing = null,
  selectedChipId,
}: HomeLandingProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const popular = listing === "popular";
  const bareHome =
    selectedChipId === undefined && listing == null && !district;
  const pageChipId =
    selectedChipId !== undefined
      ? selectedChipId
      : popular
        ? "popular"
        : district
          ? null
          : "popular";
  const localeHref = bareHome
    ? undefined
    : pageChipId
      ? chipSharePath(pageChipId, other)
      : popular
        ? mostPopularPath(other)
        : district
          ? districtPath(district, other)
          : undefined;
  const chipOpen =
    pageChipId && isOffHomeChipId(pageChipId)
      ? restoreOffHomeChipOpen(pageChipId, language)
      : null;
  const chipMoment = chipDirectoryMoment(pageChipId);
  const week = (
    <NewThisWeek language={language} shops={listNewThisWeekShops()} />
  );
  const directory = (
    <ShopDirectory
      language={language}
      shops={
        popular
          ? listPopularDirectoryShops()
          : pageChipId === "drive-through"
            ? listDriveThroughDirectoryShops()
            : district
              ? listDirectoryShopsForDistrict(district)
              : listDirectoryShops()
      }
      district={district}
      listing={listing}
      moment={chipMoment}
      chipId={chipMoment ? pageChipId : null}
      intro={
        district ? (
          <DistrictEnBody district={district} language={language} />
        ) : null
      }
    />
  );

  return (
    <main className="min-h-dvh">
      <DocumentLocale language={language} />
      <Chat
        key={district ?? listing ?? selectedChipId ?? "home"}
        landing={language}
        localeHref={localeHref}
        selectedChipId={pageChipId}
        chipOpen={chipOpen}
      />
      {bareHome ? <BrowseNeighborhoods language={language} /> : null}
      <ShopUpvoteProvider>
        <ShopClaimProvider>
          {filterPutsDirectoryFirst(listing, district, chipMoment) ? (
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
        </ShopClaimProvider>
      </ShopUpvoteProvider>
      <SiteFooter language={language} />
    </main>
  );
}
