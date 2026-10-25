"use client";

import { useEffect, useId, useRef, useState } from "react";
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

/** «اعرض قهوة وحدة زيادة» / «اعرض قهوتين زيادة» / «اعرض 5 زيادة». */
function showMoreLabel(language: Language, count: number): string {
  if (count === 1) return copy.showMoreOne[language];
  if (count === 2) return copy.showMoreTwo[language];
  return fillCount(copy.showMore[language], count);
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
  const listId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<"revealed" | "toggle" | null>(null);
  const limit =
    initialVisible && initialVisible > 0 ? initialVisible : picks.length;
  const collapsible = picks.length > limit;
  const visible = expanded ? picks : picks.slice(0, limit);
  const hidden = picks.length - visible.length;

  // Expanding moves focus to the first card it revealed; collapsing returns it to the toggle.
  useEffect(() => {
    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === "revealed") {
      const card = listRef.current?.children.item(limit) as HTMLElement | null;
      const focusable = card?.querySelector<HTMLElement>("a[href], button");
      (focusable ?? card)?.focus();
    } else if (target === "toggle") {
      toggleRef.current?.focus();
    }
  }, [expanded, limit]);
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
      <ol id={listId} ref={listRef} className="grid gap-3">
        {visible.map((pick, index) => (
          <DirectoryCard
            key={pick.id}
            shop={directoryShopFromPick(pick)}
            language={language}
            mapsSource={mapsSource}
            onMapsClick={() => {
              postLearnMaps({ shopId: pick.id, pickIndex: pick.rank ?? index });
            }}
          />
        ))}
      </ol>
      {collapsible ? (
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line bg-foam px-3 text-sm text-ink hover:border-bean"
          onClick={() => {
            focusAfter.current = expanded ? "toggle" : "revealed";
            setExpanded(!expanded);
          }}
        >
          {expanded ? copy.showLess[language] : showMoreLabel(language, hidden)}
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
