import { BrowseNeighborhoods } from "@/components/browse-neighborhoods";
import { Chat } from "@/components/chat";
import { CityDiscovery } from "@/components/city-discovery";
import { DocumentLocale } from "@/components/document-locale";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { SiteFooter } from "@/components/site-footer";
import { homeNeighborhoodCandidates } from "@/lib/browse-neighborhoods";
import {
  listBrowseDirectoryShops,
  listDirectoryShops,
  listDriveThroughDirectoryShops,
} from "@/lib/catalog";
import { listPopularDirectoryShops } from "@/lib/most-popular";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import { restoreOffHomeChipOpen } from "@/lib/chip-open";
import {
  chipSharePath,
  chipDirectoryMoment,
  filterPutsDirectoryFirst,
  isDriveThroughDirectoryChip,
  isOffHomeChipId,
  mostPopularPath,
} from "@/lib/product";
import { CITIES, type Language } from "@/lib/types";

type HomeLandingProps = {
  language: Language;
  listing?: "popular" | null;
  selectedChipId?: string | null;
};

export function HomeLanding({
  language,
  listing = null,
  selectedChipId,
}: HomeLandingProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const popular = listing === "popular";
  const bareHome = selectedChipId === undefined && listing == null;
  const neighborhoodCandidates = CITIES.flatMap((city) =>
    homeNeighborhoodCandidates(listBrowseDirectoryShops(city), city),
  );
  const pageChipId = selectedChipId !== undefined ? selectedChipId : "popular";
  // Bare `/` and `/en` highlight Most Popular. That selection has to use the
  // same popularityIndex ranking as the explicit Most Popular URL.
  const popularChipSelected = popular || pageChipId === "popular";
  const localeHref = bareHome
    ? undefined
    : pageChipId
      ? chipSharePath(pageChipId, other)
      : popular
        ? mostPopularPath(other)
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
        popularChipSelected
          ? listPopularDirectoryShops()
          : isDriveThroughDirectoryChip(pageChipId)
            ? listDriveThroughDirectoryShops()
            : listDirectoryShops()
      }
      listing={listing}
      moment={chipMoment}
      chipId={chipMoment ? pageChipId : null}
    />
  );

  return (
    <main className="min-h-dvh">
      <DocumentLocale language={language} />
      <Chat
        key={listing ?? selectedChipId ?? "home"}
        landing={language}
        localeHref={localeHref}
        selectedChipId={pageChipId}
        chipOpen={chipOpen}
      />
      <CityDiscovery>
        {bareHome ? (
          <BrowseNeighborhoods
            language={language}
            candidates={neighborhoodCandidates}
          />
        ) : null}
        {filterPutsDirectoryFirst(
          popularChipSelected ? "popular" : listing,
          null,
          chipMoment,
        ) ? (
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
      </CityDiscovery>
      <SiteFooter language={language} />
    </main>
  );
}
