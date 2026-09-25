import { BrowseNeighborhoods } from "@/components/browse-neighborhoods";
import { Chat } from "@/components/chat";
import { CityDiscovery } from "@/components/city-discovery";
import { DocumentLocale } from "@/components/document-locale";
import { HomeTrending } from "@/components/home-trending";
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
  MEET_HALFWAY_CHIP,
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
  const directoryShops = popularChipSelected
    ? listPopularDirectoryShops()
    : isDriveThroughDirectoryChip(pageChipId)
      ? listDriveThroughDirectoryShops()
      : listDirectoryShops();
  // بيننا is its own screen. The home discovery feed stays on bare home
  // and on category landings; /halfway ends after pins, results, and feedback.
  const halfwayScreen = pageChipId === MEET_HALFWAY_CHIP.id;
  const cafeViewAllHref =
    halfwayScreen
      ? null
      : pageChipId && pageChipId !== "popular"
        ? chipSharePath(pageChipId, language)
        : mostPopularPath(language);
  const homeDiscovery = bareHome ? (
    <CityDiscovery>
      <HomeTrending language={language} shops={listNewThisWeekShops()} />
      <BrowseNeighborhoods
        language={language}
        candidates={neighborhoodCandidates}
      />
      <ShopDirectory
        language={language}
        shops={directoryShops}
        listing={listing}
        moment={chipMoment}
        chipId={chipMoment ? pageChipId : null}
        headingMode="city-cafes"
        viewAllHref={cafeViewAllHref}
        sectionId="wain-riyadh-cafes"
      />
    </CityDiscovery>
  ) : null;
  const legacyDirectory = (
    <ShopDirectory
      language={language}
      shops={directoryShops}
      listing={listing}
      moment={chipMoment}
      chipId={chipMoment ? pageChipId : null}
    />
  );
  const legacyWeek = (
    <NewThisWeek language={language} shops={listNewThisWeekShops()} />
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
        homeSurface={bareHome}
        discovery={halfwayScreen ? null : homeDiscovery}
      />
      {bareHome ? (
        <div className="pb-[max(11rem,calc(9rem+env(safe-area-inset-bottom)))]">
          <SiteFooter language={language} rule={false} />
        </div>
      ) : halfwayScreen ? (
        <SiteFooter language={language} />
      ) : (
        <>
          <CityDiscovery>
            {filterPutsDirectoryFirst(
              popularChipSelected ? "popular" : listing,
              null,
              chipMoment,
            ) ? (
              <>
                {legacyDirectory}
                {legacyWeek}
              </>
            ) : (
              <>
                {legacyWeek}
                {legacyDirectory}
              </>
            )}
          </CityDiscovery>
          <SiteFooter language={language} />
        </>
      )}
    </main>
  );
}
