import { Chat } from "@/components/chat";
import { DocumentLocale } from "@/components/document-locale";
import { FixedListBody } from "@/components/fixed-list-body";
import { SiteFooter } from "@/components/site-footer";
import { homeNeighborhoodCandidates } from "@/lib/browse-neighborhoods";
import {
  directoryShopsInOrder,
  listBrowseDirectoryShops,
} from "@/lib/catalog";
import { listFixedListShops } from "@/lib/fixed-lists";
import {
  FIXED_LIST_NEARBY_PAGE_SIZE,
  type FixedListId,
} from "@/lib/fixed-list-ids";
import { listPopularDirectoryShops } from "@/lib/most-popular";
import { chipSharePath } from "@/lib/product";
import { CITIES, type Language } from "@/lib/types";

type FixedListPageProps = {
  language: Language;
  listId: FixedListId;
};

/**
 * List first, one H1, chat underneath. Chat does not auto-send:
 * selectedChipId is a fixed-list chip, and the opener pane stays unmounted
 * until someone actually asks.
 */
export function FixedListPage({ language, listId }: FixedListPageProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const shops = directoryShopsInOrder(listFixedListShops(listId));
  const popularFallback =
    listId === "nearby"
      ? listPopularDirectoryShops().slice(0, FIXED_LIST_NEARBY_PAGE_SIZE)
      : [];
  const neighborhoodCandidates =
    listId === "nearby"
      ? CITIES.flatMap((city) =>
          homeNeighborhoodCandidates(listBrowseDirectoryShops(city), city),
        )
      : [];

  return (
    <main className="min-h-dvh" data-fixed-list-page={listId}>
      <DocumentLocale language={language} />
      <Chat
        key={listId}
        landing={language}
        localeHref={chipSharePath(listId, other)}
        selectedChipId={listId}
        discovery={
          <FixedListBody
            language={language}
            listId={listId}
            shops={shops}
            popularFallback={popularFallback}
            neighborhoodCandidates={neighborhoodCandidates}
          />
        }
      />
      <SiteFooter language={language} />
    </main>
  );
}
