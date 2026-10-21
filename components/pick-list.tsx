"use client";

import { useEffect, useState } from "react";
import { BeenButton } from "@/components/been-button";
import { DirectoryCard } from "@/components/directory-card";
import { SharePackButton } from "@/components/share-pack-button";
import { copy } from "@/lib/copy";
import { directoryShopFromPick } from "@/lib/listing-shop";
import { SHOW_BEEN_HERE } from "@/lib/tonight";
import { postLearnMaps } from "@/lib/learn-session";
import { packIdForPicks } from "@/lib/share-pack";
import { trackEvent, type MapsClickSource } from "@/lib/track";
import type { ChatPick, Language } from "@/lib/types";

export type { ChatPick };

type PickListProps = {
  picks: ChatPick[];
  language: Language;
  uiLanguage: Language;
  beenIds: string[];
  onBeen: (id: string) => void;
  ask?: string;
  packId?: string;
  mapsSource?: MapsClickSource;
  /** Show this many cards, then a "show more" control. Omit to show the list. */
  initialVisible?: number;
  shareable?: boolean;
  /** Search packs keep every branch and open with the count, not "three cafés". */
  search?: boolean;
};

function fillCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function PickList({
  picks,
  language,
  uiLanguage,
  beenIds,
  onBeen,
  ask = "",
  packId,
  mapsSource = "pack",
  initialVisible,
  shareable = true,
  search = false,
}: PickListProps) {
  const [expanded, setExpanded] = useState(false);
  const limit =
    initialVisible && initialVisible > 0 ? initialVisible : picks.length;
  const visible = expanded ? picks : picks.slice(0, limit);
  const hidden = picks.length - visible.length;
  const resolvedPackId =
    packId ??
    (picks.length > 0
      ? packIdForPicks({ picks, language, ask, search })
      : undefined);

  useEffect(() => {
    if (picks.length !== 3) return;
    trackEvent(
      "three_pick_shown",
      {
        locale: language,
        shop_ids: picks.map((pick) => pick.id).join(","),
        ...(resolvedPackId ? { pack_id: resolvedPackId } : {}),
      },
      {
        dedupeKey: `three_pick_shown:${picks.map((pick) => pick.id).join(",")}`,
      },
    );
  }, [language, picks, resolvedPackId]);

  return (
    <div>
      <ol className="grid gap-3">
        {visible.map((pick, index) => (
          <DirectoryCard
            key={pick.id}
            shop={directoryShopFromPick(pick)}
            language={language}
            mapsSource={mapsSource}
            onMapsClick={() => {
              postLearnMaps({ shopId: pick.id, pickIndex: index });
            }}
          />
        ))}
      </ol>
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line bg-foam px-3 text-sm text-ink hover:border-bean"
          onClick={() => setExpanded(true)}
        >
          {fillCount(copy.showMore[language], hidden)}
        </button>
      ) : null}
      {SHOW_BEEN_HERE ? (
        picks.map((pick) => (
          <BeenButton
            key={`been-${pick.id}`}
            marked={beenIds.includes(pick.id)}
            language={language}
            onMark={() => onBeen(pick.id)}
          />
        ))
      ) : null}
      {shareable && picks.length > 0 ? (
        <SharePackButton
          picks={picks}
          language={language}
          uiLanguage={uiLanguage}
          ask={ask}
          packId={resolvedPackId}
          search={search}
        />
      ) : null}
    </div>
  );
}
