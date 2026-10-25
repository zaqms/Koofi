import { haversineKm } from "./distance";
import type { ChatPick, Pin } from "./types";

/**
 * Search branches, nearest first, sorted on the visitor's device.
 * The pin never goes to the server (lib/legal.ts: location stays on the
 * device). Cards without coordinates keep their server order at the end.
 * `rank` keeps the server order so map-click logs line up with the ask log.
 */
export function sortPicksByDistance(picks: ChatPick[], pin: Pin): ChatPick[] {
  return picks
    .map((pick, index) => ({ pick: { ...pick, rank: pick.rank ?? index }, index }))
    .map((row) => ({
      ...row,
      km:
        typeof row.pick.lat === "number" && typeof row.pick.lng === "number"
          ? haversineKm(pin, { lat: row.pick.lat, lng: row.pick.lng })
          : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => (a.km !== b.km ? a.km - b.km : a.index - b.index))
    .map((row) => row.pick);
}
