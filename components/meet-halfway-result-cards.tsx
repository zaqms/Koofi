"use client";

import { DirectoryCard } from "@/components/directory-card";
import { copy } from "@/lib/copy";
import { directoryShopFromPick } from "@/lib/listing-shop";
import { postLearnMaps } from "@/lib/learn-session";
import type { ChatPick, Language, Pin } from "@/lib/types";

type MeetHalfwayResultCardsProps = {
  picks: ChatPick[];
  language: Language;
  origin?: Pin | null;
};

export function MeetHalfwayResultCards({
  picks,
  language,
}: MeetHalfwayResultCardsProps) {
  return (
    <ol className="grid gap-3">
      {picks.map((pick, index) => (
        <DirectoryCard
          key={pick.id}
          shop={directoryShopFromPick(pick)}
          language={language}
          mapsSource="pack"
          badge={index === 0 ? copy.meetHalfwayBestMatch[language] : null}
          onMapsClick={() => {
            postLearnMaps({ shopId: pick.id, pickIndex: index });
          }}
        />
      ))}
    </ol>
  );
}
