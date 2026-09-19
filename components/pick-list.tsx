"use client";

import { useEffect } from "react";
import { BeenButton } from "@/components/been-button";
import { DirectoryCard } from "@/components/directory-card";
import { SharePackButton } from "@/components/share-pack-button";
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
};

export function PickList({
  picks,
  language,
  uiLanguage,
  beenIds,
  onBeen,
  ask = "",
  packId,
  mapsSource = "pack",
}: PickListProps) {
  const resolvedPackId =
    packId ??
    (picks.length > 0
      ? packIdForPicks({ picks, language, ask })
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
        {picks.map((pick, index) => (
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
      {picks.length > 0 ? (
        <SharePackButton
          picks={picks}
          language={language}
          uiLanguage={uiLanguage}
          ask={ask}
          packId={resolvedPackId}
        />
      ) : null}
    </div>
  );
}
