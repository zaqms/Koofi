import { Chat } from "@/components/chat";
import { DocumentLocale } from "@/components/document-locale";
import { DistrictEnBody } from "@/components/district-en-body";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { SiteFooter } from "@/components/site-footer";
import { listDirectoryShopsForDistrict } from "@/lib/catalog";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import { districtPath } from "@/lib/product";
import type { City, Language, NeighborhoodId } from "@/lib/types";

type DistrictPageProps = {
  language: Language;
  district: NeighborhoodId;
  /** The district's city. A Jeddah page must not render Riyadh rows. */
  city: City;
};

/**
 * Shared district template. Every `/coffee-shops/{slug}` (and `/en/…`)
 * neighborhood uses this — name, count, cards, and SEO body come from
 * catalog + locked district copy. Soft Places stays parked.
 */
export function DistrictPage({ language, district, city }: DistrictPageProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const shops = listDirectoryShopsForDistrict(district, city);

  return (
    <main
      className="min-h-dvh"
      data-district-page=""
      data-district-id={district}
      data-district-template="shared"
    >
      <DocumentLocale language={language} />
      <Chat
        key={district}
        landing={language}
        localeHref={districtPath(district, other)}
        selectedChipId={null}
      />
      <ShopDirectory
        language={language}
        shops={shops}
        district={district}
        intro={<DistrictEnBody district={district} language={language} />}
      />
      <NewThisWeek language={language} shops={listNewThisWeekShops()} />
      <SiteFooter language={language} />
    </main>
  );
}
