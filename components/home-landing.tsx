import { Chat } from "@/components/chat";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { SiteFooter } from "@/components/site-footer";
import { listDirectoryShops } from "@/lib/catalog";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import { districtPath } from "@/lib/product";
import type { Language, NeighborhoodId } from "@/lib/types";

type HomeLandingProps = {
  language: Language;
  district?: NeighborhoodId | null;
};

export function HomeLanding({
  language,
  district = null,
}: HomeLandingProps) {
  const other: Language = language === "ar" ? "en" : "ar";

  return (
    <main className="min-h-dvh">
      <Chat
        landing={language}
        localeHref={district ? districtPath(district, other) : undefined}
      />
      <NewThisWeek language={language} shops={listNewThisWeekShops()} />
      <ShopDirectory
        language={language}
        shops={listDirectoryShops()}
        district={district}
      />
      <SiteFooter language={language} />
    </main>
  );
}
