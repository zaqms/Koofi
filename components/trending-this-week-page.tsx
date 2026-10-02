import { DirectoryCard } from "@/components/directory-card";
import { DocumentLocale } from "@/components/document-locale";
import { Chat } from "@/components/chat";
import { SiteFooter } from "@/components/site-footer";
import { copy } from "@/lib/copy";
import { trendingPath } from "@/lib/product";
import {
  listTrendingThisWeekRows,
  trendingWindowLabel,
  type TrendingThisWeekRow,
} from "@/lib/trending-this-week";
import type { Language } from "@/lib/types";

type TrendingThisWeekListProps = {
  language: Language;
  rows: readonly TrendingThisWeekRow[];
};

/** List body. Header matches the district / Most Popular list pages. */
export function TrendingThisWeekList({
  language,
  rows,
}: TrendingThisWeekListProps) {
  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="wain-trending-page"
      data-trending-page=""
    >
      <h1 id="wain-trending-page" className="text-base font-semibold">
        {copy.trendingThisWeek[language]}
      </h1>
      <p className="mt-1 text-xs leading-5 text-ink-soft" data-trending-window="">
        {trendingWindowLabel(language)}
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-ink" data-trending-empty="">
          {copy.trendingEmpty[language]}
        </p>
      ) : (
        <ul className="mt-4 grid gap-5" data-trending-list="">
          {rows.map((row) => (
            <li key={row.shop.id} className="grid gap-2" data-trending-id={row.shop.id}>
              <ul className="grid">
                <DirectoryCard shop={row.shop} language={language} />
              </ul>
              <p
                className="px-1 text-sm leading-6 text-ink-soft"
                data-trending-line=""
              >
                {language === "ar" ? row.lineAr : row.lineEn}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type TrendingThisWeekPageProps = {
  language: Language;
  rows?: readonly TrendingThisWeekRow[];
};

export function TrendingThisWeekPage({
  language,
  rows = listTrendingThisWeekRows(),
}: TrendingThisWeekPageProps) {
  const other: Language = language === "ar" ? "en" : "ar";

  return (
    <main className="min-h-dvh">
      <DocumentLocale language={language} />
      <Chat
        landing={language}
        localeHref={trendingPath(other)}
        selectedChipId={null}
      />
      <TrendingThisWeekList language={language} rows={rows} />
      <SiteFooter language={language} />
    </main>
  );
}
