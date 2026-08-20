import { CardBeen } from "@/components/card-been";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { mapsHref } from "@/lib/public-url";
import type { Shop } from "@/lib/types";

type CafeCardProps = {
  shop: Shop;
};

export function CafeCard({ shop }: CafeCardProps) {
  const hours = shop.hours?.trim();
  const site = shop.officialSite?.trim();

  return (
    <article className="mt-4 rounded-[28px] border border-line bg-foam p-5 shadow-[0_12px_40px_rgba(28,20,16,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{shop.nameAr}</h1>
          <p className="mt-1 text-base text-ink-soft" dir="ltr">
            {shop.nameEn}
          </p>
        </div>
        {shop.example ? (
          <span className="rounded-full bg-paper-deep px-2.5 py-1 text-xs text-ink-soft">
            {copy.exampleBadge.ar}
          </span>
        ) : null}
      </div>

      {shop.example ? (
        <p className="mt-3 text-sm leading-6 text-ink-soft">{copy.exampleNote.ar}</p>
      ) : null}

      <dl className="mt-5 space-y-3 text-sm leading-6">
        <div>
          <dt className="text-xs text-ink-soft">{copy.neighborhood.ar}</dt>
          <dd>
            {shop.neighborhoodAr}
            <span className="text-ink-soft" dir="ltr">
              {" "}
              · {neighborhoodLabel(shop.neighborhood, "en")}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{copy.vibe.ar}</dt>
          <dd>{shop.vibeTags.join(" · ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{copy.hours.ar}</dt>
          <dd>{hours || copy.noHours.ar}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-2">
        {shop.pin ? (
          <a
            href={mapsHref(shop.pin.lat, shop.pin.lng)}
            className="rounded-2xl bg-bean px-4 py-3 text-center text-sm text-foam hover:bg-bean-deep"
          >
            {copy.directions.ar}
          </a>
        ) : (
          <p className="text-sm text-ink-soft">{copy.noPin.ar}</p>
        )}
        {site ? (
          <a
            href={site}
            className="rounded-2xl border border-line px-4 py-3 text-center text-sm hover:border-bean"
            rel="noreferrer"
          >
            {copy.site.ar}
          </a>
        ) : null}
        <CardBeen shopId={shop.id} />
      </div>
    </article>
  );
}
