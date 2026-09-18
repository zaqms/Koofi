# Dating-policy grep report

Scan: `date|dating|موعد|لموعد|soft-places|good-for-a-date|for-two`  
Scope: repo source (excludes `node_modules/`, `.git/`, `package-lock.json`).

## Crawler-visible result

Live HTML / catalog / sitemap no longer expose a dating vibe:

- Chip id + moment tag + public slug are `with-friends` (label stays **With friends** / **مع الأصحاب**).
- Directory heading id is `koofi-chip-with-friends` (no `koofi-chip-date`).
- Six catalog shops retagged `date` → `with-friends`.
- Sitemap includes `https://wain.lol/coffee-shops/with-friends` and `/en/coffee-shops/with-friends`.
- Sitemap excludes `/date`, `/for-two`, `/good-for-a-date`, and `soft-places`.
- Chat aliases dropped dating copy (`لموعد`, `dating`, `good for a date`, `for two`).
- بيننا / Halfway copy is unchanged.

Retired dating URLs 308 to `/coffee-shops/with-friends` (AR + EN). Those pages are never generated as 200.

## Intentional remaining matches

| Pattern | Where | Why it stays |
| --- | --- | --- |
| `date`, `for-two`, `good-for-a-date` | `lib/product.ts` `LEGACY_DATING_CHIP_SLUGS` + `next.config.ts` redirects | 308 only — not live routes |
| same slugs | `scripts/check-chip-urls.ts`, `check-structured-data.ts`, `check-district-urls.ts`, `check-plg.ts`, `README.md` | Locks that redirects exist and dating pages are not 200 / not in the sitemap |
| `لموعد`, `Good for a date`, `For two` | check scripts only | Negative assertions (“must not appear”) |
| `Soft Places` / `soft-places` | comments + parked-feature locks in lib/scripts/README | Feature stays parked; no UI, no sitemap loc |

This file itself matches the scan terms because it names them.

## False positives (calendar / JS / SEO — not dating)

Do **not** treat these as dating copy:

- `Date()`, `Date.now()`, `new Date(...)`, `createdAt: Date`, `instanceof Date` — JS calendar timestamps
- `sitemapLastmodDate`, `<lastmod>YYYY-MM-DD</lastmod>`, “date-only lastmod” — sitemap calendar dates
- `dateModified`, `EN_CONTENT_DATE_MODIFIED` — schema.org editorial freshness
- `updated`, `updatedAt`, `updated_at`, `update(` — SQL / object updates
- `validate`, `candidates`, `place_id` — unrelated identifiers
- `stale-while-revalidate` — cache header
- `lib/passport-preview.ts` `Batch · date · spice` — coffee tasting note (date fruit), not dating
- `scripts/check-directory-sort.ts` “store opening date” — calendar sense

`موعد` / `لموعد` / `مواعدة` do not appear in UI, meta, blurbs, `llms.txt`, or the sitemap. Remaining Arabic hits are negative test strings only.

No `soft-places` slug is routed or listed. Soft Places stays parked.
