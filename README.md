# Koofi

A consumer agent for one job: **where should I go for coffee right now, and why?**

People talk to it on a thin web chat, or later on WhatsApp. It is not an app-store app, not a marketing site, not a marketplace, and not a leads tool.

Owner: **Amjad Puliyali**. The real shop list still comes from him.

## What it does

- Two landings, same chat: **`/`** is Arabic (`اي قهوة ناوي تروح؟`, Arabic chips, RTL). **`/en`** is English (`Which coffee you heading to?`, English chips, LTR). Header switches with `EN` / `عربي`. Not a marketing site. Not both languages stacked in one bubble.
- Ten vibe chips under the opener, one label each. Tapping still returns **three** pick cards. Chips stay available above the composer so they can try another vibe without starting a new conversation. Typing the other language still flips the reply. WhatsApp has no chip UI; typing the same Arabic or English phrase maps the same way.
- They can also type a vibe or a neighborhood. A follow-up like `أبعد عن العليا` / `away from Olaya` gets another spoken line and a new three from the remaining catalog — not a general chat.
- Koofi sends **exactly three** cafe picks when it can. It does not collapse to a single shop card when three shops exist. A short spoken line sits above the cards (xAI chat completions, `grok-4.6`). The share unit is still the cards: name, one-line why, and a Google Maps pin. For a real shop the Maps click is Amjad’s `mapsShareUrl` short link, not a reconstructed lat/lng search. People forward that pin to go. The `/c/[id]` card is optional and secondary. If `XAI_API_KEY` is missing or the model call fails, the spoken line falls back to today’s heading copy. Cards still send.
- Riyadh only. Neighborhoods: Hittin (حطين), Al Malqa (الملقا), Al Nakheel (النخيل), Al Yasmin (الياسمين), Olaya (العليا), Sulimaniyah (السليمانية), Al Wurud (الورود), Al Rabwah (الربوة), Al Rabi (الربيع), Al Masif (المصيف), Al Rahmaniyyah (الرحمانية).
- Arabic in (Gulf / Saudi casual). Reply in the language they used. English if they switch. RTL-first.
- Reason over rating. Neighborhood and moment still choose the three shops — never sort or pick by stars. A real shop card may show Google’s rating, review count, and one short snippet via Places. If `GOOGLE_PLACES_API_KEY` is missing or the lookup fails, the rating row is hidden. Do not scrape Maps.
- **Been here** on the web (`localStorage`) so we stop offering that place as new.
- Optional card at `/c/[id]`: name AR/EN, neighborhood, pin, vibe tags. Unclaimed shops stay a thin card. Verified shops unlock the richer Passport card (owner photos, brewing/note, owner-supplied hours only, thin offer, optional phone/IG, share, shared ▲ upvote, Maps CTA). Do not invent hours. Do not ask people to share a Koofi URL.
- **بطاقة الليلة / Tonight’s card** is the primary share on Passport and thin cards. It mints a 9:16 story image (hero or logo, name EN+AR, district, optional one-liner, `wain.lol` watermark) and deep-links `/c/{id}?from=tonight`. Ephemeral — الليلة / tonight — not a check-in stamp. No GPS gate. Rate-limited per device session.
- **خذني معه / Come with me** is the secondary CTA (`تعال`). Prefill `أنا بـ {name} الحين — تعال` / `I'm at {name} — come through` + the same card link. Same share sheet (system / X / Stories / Snap / download / copy). Tracked separately.
- Each pick card has a small 44px letter mark from the shop name (IK, WO, …). A `photoUrl` is shown only if Amjad sets one. Do not scrape Maps photos.
- **أضف قهوة / Add a shop** sits under the composer, not in the chip row. Drop a Google Maps link. Koofi thanks them and stores a suggestion for Amjad — it does not go into `catalog.json`.

## What v1 leaves out

App store app, browse-the-city marketing site, rest of KSA, scraped reviews/stars, ranking by rating, booking, ordering, delivery, loyalty, shop dashboard, ads, inbound leads, social feed, auto-posting, and any company brand besides Koofi.

## Catalog

The catalog is a local editorial file: [`data/catalog.json`](data/catalog.json).

Schema per shop: `id`, `nameAr`, `nameEn`, `city`, `neighborhood`, `neighborhoodAr`, `vibeTags`, `momentTags` (`work` / `friend` / `qahwa` / `roaster` / `quiet` / `late` / `popular` / `pastry` / `study` / `outdoor` / `date`), optional `officialSite`, optional `pin`, optional `hours`, optional `mapsShareUrl`, optional `photoUrl`, optional `logoUrl`, optional baked `popularityIndex` (Most Popular chip only; source map in [`data/popularity-index.json`](data/popularity-index.json)), and `example`. `shopMapsHref` prefers `mapsShareUrl`, then pin, then a name search. Leave `photoUrl` / `logoUrl` empty unless there is a legal photo. Never hotlink a scraped Maps CDN URL.

The locked openers and chip list live in [`lib/product.ts`](lib/product.ts) (`LOCKED_OPENER` on `/`, `LOCKED_OPENER_EN` on `/en`, `VIBE_CHIPS`). The coffee chip maps onto `qahwa`. Chat UI and copy import those; do not duplicate the opener strings or the chip labels.

**Real shops come from Amjad as Maps pins.** This repo does not invent real Riyadh cafe names and does not scrape Google, Instagram, Snap, TikTok, or review sites. Do not write ratings into `catalog.json`. Hours and official claims stay empty until there is a legal source. Do not invent coordinates for a real shop when `mapsShareUrl` is present.

v1 ships the real shops Amjad sent (`example: false`), each with his exact Maps share link. Do not add fictional example/مثال shops to fill a neighborhood, a vibe chip, or a three-pick reply. Picks and the public list are real shops only.

When Amjad adds more shops he likes, append them with `"example": false` and his Maps share URL. Do not invent names to fill the gap.

Discovery filters the catalog (Riyadh, not been, neighborhood/moment fit) and picks three with a light editorial hand. If the catalog is too small, Koofi says so in Arabic and still returns what it can. It never invents a real shop.

## Public structured data

Machine-readable catalog so agents can pull and cite **wain.lol** for Riyadh coffee. Visitor-facing copy never says Koofi.

| Surface | What it is |
| --- | --- |
| `GET /api/shops` | Full curated catalog. schema.org `ItemList` of `CafeOrCoffeeShop`. CORS open for GET. `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` |
| `GET /api/shops/[id]` | One shop. 404 `{ "error": "not_found" }` if missing |
| `/c/[id]` and `/en/c/[id]` | `CafeOrCoffeeShop` JSON-LD in `<script type="application/ld+json">`. Metadata only — cafe-card layout is unchanged |
| `/coffee-shops/{slug}` and `/en/coffee-shops/{slug}` | `ItemList` JSON-LD of shops in that district |
| `/about` + `/en/about` | Visible FAQ (Najdi AR / plain EN) + matching `FAQPage` JSON-LD |
| `/coffee-shops/{slug}` district FAQ | 1–2 short visible lines + matching `FAQPage` JSON-LD |
| `/llms.txt` | Short agent note pointing at `/api/shops` and the MCP URL |
| `POST/GET /api/mcp` (also `/mcp`) | Public read-only MCP server. Same catalog as `GET /api/shops`. Streamable HTTP, no login |

`robots.txt` allows `/api/shops`, `/api/mcp`, `/mcp`, and `/llms.txt`; other `/api/` routes stay disallowed. The sitemap still lists district + card URLs and adds `/llms.txt`.

### Shop object (API)

`@context` is `https://schema.org`. `@type` is `CafeOrCoffeeShop`. Fields come from the editorial catalog only:

| Field | Meaning |
| --- | --- |
| `identifier` | Stable catalog `id` |
| `nameAr` / `nameEn` | Names from the catalog |
| `neighborhood` / `neighborhoodAr` | District slug + Arabic label |
| `url` | Canonical card on wain.lol (`/c/{id}`) |
| `urlEn` | English card (`/en/c/{id}`) |
| `sameAs` / `hasMap` | Maps share URL (and `officialSite` if present) |
| `geo` | `{ @type: GeoCoordinates, latitude, longitude }` only when official place coords exist |

Not in the public payload: hours, ratings, phone, price, reviews, images, upvote counts, or any secret.

Page JSON-LD uses schema.org `name` / `alternateName` / `address` for the page language instead of the API’s `nameAr`/`nameEn` pair. Same field whitelist.

### MCP (same catalog)

Public Streamable HTTP MCP at **`https://wain.lol/api/mcp`** (alias **`https://wain.lol/mcp`**). No auth. CORS open. Tools and resources read `listPublicShops()` / `publicShopPayload()` — the same objects as `GET /api/shops`.

| Tool | What it returns |
| --- | --- |
| `search` | ChatGPT-compatible `{ results: [{ id, title, url }] }` in directory order |
| `fetch` | One shop as `{ id, title, text, url, metadata }` (`text` is the `/api/shops/{id}` JSON) |
| `list_shops` | Full schema.org `ItemList` (identical to `GET /api/shops`) |
| `get_shop` | One `CafeOrCoffeeShop` (identical to `GET /api/shops/{id}`) |
| `list_shops_by_district` | Same records, filtered to a neighborhood slug |

Resources: `https://wain.lol/api/shops`, `https://wain.lol/api/shops/{id}`, `wain://districts`, `wain://districts/{slug}`.

Connect ChatGPT / Claude / Gemini / Perplexity / Cursor with Streamable HTTP to `https://wain.lol/api/mcp`. Cite `https://wain.lol`.

```bash
npx tsx scripts/check-structured-data.ts
npx tsx scripts/check-claims.ts
npx tsx scripts/check-owner-edit.ts
npx tsx scripts/check-passport.ts
npx tsx scripts/check-tonight.ts
```

## How to run

```bash
npm install
npm run dev
```

Open the printed local URL. No login. Ask something like `حطين شغل` or `quiet work in Al Malqa`. You should get up to three real-shop picks and a card link each.

```bash
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env.local` if you need WhatsApp or a spoken line. **None of these are required for the three pick cards.**

These names are the contract in `lib/env.ts`, `.env.example`, and the webhook. Do not rename one without the others.

| Variable | Required for web chat | What it does |
| --- | --- | --- |
| `KOOFI_PUBLIC_URL` | No | Optional origin used only to turn `/c/[id]` into an absolute link in WhatsApp replies. Leave empty locally. Do not invent a production domain. |
| `WHATSAPP_VERIFY_TOKEN` | No | Token you set in the Meta webhook callback. Used by `GET /api/whatsapp`. |
| `WHATSAPP_ACCESS_TOKEN` | No | Cloud API token used only if you want the webhook to send a reply. |
| `WHATSAPP_PHONE_NUMBER_ID` | No | Phone number ID for outbound WhatsApp messages. |
| `GOOGLE_PLACES_API_KEY` | No | Optional live Place Details for a real shop (rating, review count, one snippet, optional photo). If empty, cards hide the rating row and keep the letter mark. No scrape fallback. Not used to rank picks. |
| `GITHUB_TOKEN` | No | Optional. If set, a Maps suggestion opens a GitHub issue on `zaqms/Koofi` titled `Shop suggestion: <name>`. Chat still thanks them if this is empty. |
| `XAI_API_KEY` | No | Optional. Server-only key for a short spoken reply above the cards (`https://api.x.ai/v1/chat/completions`). If empty or the call fails (~8s timeout), Koofi uses `copy.threePicks` / `fewerPicks`. Cards still send. Never commit a real key. |
| `LEARNING_READ_TOKEN` | No | Optional Bearer token for the private `GET /api/learn` pile. If empty, that read is 404. Chat and Maps still work. Never commit a real token. |
| `DATABASE_URL` | No | Neon / Vercel Postgres for `/feedback`, directory upvotes, and owner claims. If empty on Vercel, those writes return 503. Chat is unchanged. Never commit a real URL. |
| `CLAIM_ALERT_TO` | No | Optional inbox for pending owner-claim alerts. Defaults to `aj@cali.sa` if empty. Sending needs `RESEND_API_KEY`. |
| `RESEND_API_KEY` | No | Optional. If set, claim submit emails `CLAIM_ALERT_TO` via Resend. If empty, email is stubbed and the server logs `wain_claim`. |
| `CLAIM_APPROVE_TOKEN` | No | Optional shared secret for `/ops/claims`. Mint / revoke owner edit links for verified shops. If empty, ops 404s. Never commit a real token. Do not auto-send WhatsApp. Preview try-path only — do not set this on Production from this work. |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token for owner Passport photo upload (`POST /api/owner/photos`). Auto-injected when a Blob store is linked to the Vercel project. Preview needs a linked Blob store (or this token) for phone upload. URL fields still work if empty. Never commit a real token. |

Do not commit secrets.

## Learning log

Quiet first-party notes so Ajz can later add shops and fix copy. **Not a ranker. Not a dashboard. No third-party pixels.**

We store only three things:

1. The ask — typed line or chip label, `typed` / `chip`, landing `ar` / `en`
2. The three shop ids Koofi sent
3. A Maps tap — shop id + pick index (0–2)

Maps tap is the conversion. The spoken line and the cards appearing are not.

- `/api/chat` writes an `ask` event when it returns exactly three shops. Logging is best-effort and never fails the reply.
- The Maps pill `POST`s `/api/learn` `{ kind: "maps", shopId, pickIndex, session }`. Cafe card and Been here are not logged.
- Session is an anonymous 12-hex id in `sessionStorage`. No IP, no user-agent dump, no fingerprint beyond that id.
- Each event is also a Vercel log line: `koofi_learn` + JSON. `/tmp` and memory are instance-local (serverless files do not persist).

Ajz reads the pile:

1. Vercel project logs — filter `koofi_learn` (survives deploys).
2. Private read, not linked in the UI: `curl -H "Authorization: Bearer $LEARNING_READ_TOKEN" https://<host>/api/learn`

## Analytics (GTM / GA4)

Web chat pushes optional GTM `dataLayer` events from [`lib/track.ts`](lib/track.ts). Container **`GTM-W3TM4552`**, GA4 stream **`G-EFZZET02TT`**. No cookie, no IP, no session id, no assistant reply text.

| Event | When | Parameters |
| --- | --- | --- |
| `chat_query` | A user ask is submitted through the composer (`send`) | `query_text` (exact typed / submitted text), `locale`, `via` (`typed` / `chip`), `text_length` |
| `chip_tap` | A vibe or Nearby chip is tapped | `chip_id`, `chip_label`, `locale` |
| `district_select` | A list حي filter is chosen | `district_id`, `district_ar`, `district_en`, `locale` |
| `three_pick_shown` | Three pick cards render | `locale`, `shop_ids`, optional `pack_id` |
| `maps_click` | Maps pin is opened | `shop_id`, `locale`, `source` |
| `share_pack` / `share_packet_copy` | Share the three | `locale`, `pack_id` |
| `share_listing` | Share one shop | `shop_id`, `locale`, `source` |
| `share_inbound` | Restore URL with `from=wa` | `kind`, `from`, optional `pack_id` / `shop_id` |
| `feedback_add` / `feedback_vote` | Ideas board | `locale` only |
| `cafe_upvote` | Directory-list ▲ on a shop | `shop_id`, `locale` |
| `cafe_unvote` | Directory-list ▲ undo on a shop | `shop_id`, `locale` |
| `tonight_card_open` | Tonight’s card composer opened | `shop_id`, `locale` |
| `tonight_card_mint` | Tonight card image generated | `shop_id`, `locale` |
| `tonight_card_share` | Tonight card share fired | `shop_id`, `locale`, `channel` (`system` / `x` / `ig` / `snap` / `download` / `copy`) |
| `invite_open` | Invite sheet opened | `shop_id`, `locale` |
| `invite_share` | Invite shared | `shop_id`, `locale`, `channel` |

`chat_query` is the search event. Cafe and neighborhood text is intended — that is the product question. It fires once per `send()` (composer submit or a chip label that is actually posted to `/api/chat`). It does **not** fire for the locked opener, for chip UI that is only displayed, or for Nearby (Nearby never hits `/api/chat`). A 400ms dedupe key `chat_query:{via}:{text}` covers retries and remounts.

Repo code cannot create GTM tags. In container **GTM-W3TM4552**:

1. **Variables** → New → Data Layer Variable → name `DL - query_text` → Data Layer Variable Name `query_text`. Repeat for `locale` and `via` if those variables are not already in the container (`DL - locale`, `DL - via`).
2. **Triggers** → New → Custom Event → name `CE - chat_query` → Event name `chat_query` → All Custom Events.
3. **Tags** → New → **Google Analytics: GA4 Event** → name `GA4 - chat_query`.
   - Measurement ID `G-EFZZET02TT`, or the existing GA4 Configuration tag for that stream.
   - Event Name: `chat_query`.
   - Event Parameters: `query_text` = `{{DL - query_text}}`, `locale` = `{{DL - locale}}`, `via` = `{{DL - via}}`.
   - Trigger: `CE - chat_query`.
4. Preview, type an Arabic ask on `/` and an English ask on `/en`, confirm the tag fires with the exact `query_text`. Publish the container.

In GA4 (**G-EFZZET02TT**) register `query_text` (and `via` if you want typed vs chip) as event-scoped custom dimensions so Explorations can read them. GA4 truncates event parameter values at 100 characters; the dataLayer still gets the full ask.

Tonight / Invite events reuse the same `dataLayer` helper as `cafe_upvote` and `maps_click`. Repo code cannot create GTM tags. If those two already have GA4 Event tags in **GTM-W3TM4552**, clone the pattern:

1. **Variables** → Data Layer Variable `DL - shop_id` (`shop_id`), `DL - locale` (`locale`), `DL - channel` (`channel`) — skip any that already exist.
2. **Triggers** → Custom Event for each of `tonight_card_open`, `tonight_card_mint`, `tonight_card_share`, `invite_open`, `invite_share` (All Custom Events).
3. **Tags** → **Google Analytics: GA4 Event** per name (`GA4 - tonight_card_open`, …) → Measurement ID `G-EFZZET02TT` → Event Name matches the dataLayer `event` → Event Parameters `shop_id` = `{{DL - shop_id}}`, `locale` = `{{DL - locale}}`, and `channel` = `{{DL - channel}}` on the two share events.
4. Preview on `/c/woods-olaya` (Passport) and `/c/cafu-olaya` (thin). Confirm open → mint → share (and invite open → share) with `shop_id` + `locale` (+ `channel`). Publish the container.

Do not send the one-liner, image bytes, or a session id. `channel` is only `system` | `x` | `ig` | `snap` | `download` | `copy`.

## Feedback board

Public Arabic-first ideas board at **`/feedback`** (`/en/feedback` for English). No login. No email. No Canny.

People add one short line and upvote. Rank is votes, then oldest. Map / pin mistakes stay on WhatsApp (`wa.me/966570064331`, same Contact us control — number is not shown). They are not written into the ideas table.

The board starts empty. Do not seed the mock rows.

### Database (Amjad)

Preview and production need Neon on Vercel project **`koofi-agent`** (Hobby team `amjad-5107s-projects`).

1. Vercel Dashboard → `koofi-agent` → Storage → Create Database → **Neon Postgres**.
2. Connect it to **Production** and **Preview** so both get `DATABASE_URL`.
3. Redeploy the preview (or wait for the next push).
4. Tables `ideas` and `vote_receipts` are created on first successful request. If you want to create them by hand, run [`sql/feedback.sql`](sql/feedback.sql) in the Neon SQL editor. Directory-list upvotes add `shop_upvotes` and `shop_vote_receipts` the same way ([`sql/shop-upvotes.sql`](sql/shop-upvotes.sql)). Owner claims add `shop_claims` + `shop_claim_otp` ([`sql/shop-claims.sql`](sql/shop-claims.sql)).

Do not invent credentials. Do not put `DATABASE_URL` in the repo.

Local `next dev` without `DATABASE_URL` keeps ideas in process memory so the page can be tried. That memory is not used on Vercel.

### Events

`feedback_add` and `feedback_vote` still send `locale` only (`ar` / `en`). No idea text, no cookie, no IP. See [Analytics (GTM / GA4)](#analytics-gtm--ga4) for the full event list and GTM wiring.

### Empty state

Arabic: **ما فيه أفكار للحين. اكتب وحدة تحت.**

## Directory upvotes

Product Hunt–style ▲ + count on directory list rows (home list, district pages, and New this week because those rows are `DirectoryCard`) and on the **verified Passport cafe card**. Same Neon `shop_upvotes` + `wain_vid` — one count. Unclaimed thin cards stay without ▲.

Social proof only. Counts do **not** reorder chat three-picks, the directory, New this week, or district filters. Owners cannot buy rank. No downvotes, stars, or comments. Been here stays a separate localStorage mark on cafe cards.

Vote model: toggle upvote. Cookie voter `wain_vid` (same as /feedback). First tap adds a receipt and +1. Second tap deletes that receipt and −1 (never below 0). Same action twice is idempotent — count does not double. Same Neon `DATABASE_URL` (`shop_upvotes` + `shop_vote_receipts`). On Vercel without it, vote returns `503` / `no_storage`. Local `next dev` may use memory.

Visitor copy is short: ▲ + count, `أعجبني` / `Upvote`. Optional `cafe_upvote` / `cafe_unvote` dataLayer events send `shop_id` + `locale` only.

## Owner claim (interim WhatsApp chat)

Quiet cafe-card footer under **Listed on wain.lol** / **معروض على wain.lol**. Unclaimed shops show **Own this cafe?** / **تملك المقهى؟**. That link is `wa.me` to the same Contact us number, with a prefilled claim (locale shop name + public `/c/[id]` or `/en/c/[id]` URL). Phone digits are not shown. Pending or verified shops hide that CTA. No owner names on the public card.

`/owner` and `/en/owner` are a short **Chat on WhatsApp** screen. `?shop=` uses the same shop prefill. No shop still opens `wa.me` with a generic claim prefill. **Never WhatsApp Web / QR.** No OTP and no CR upload on this door.

Cloud API OTP (`/api/claims/otp` submit) stays parked — visitors claim over WhatsApp. `GET /api/claims` is public claim status for the card/list. Soft Places, buy-rank, and marketplace stay out.

## Passport cafe card (verified only)

`status === 'verified'` unlocks the richer Passport UI on `/c/[id]` and `/en/c/[id]`. Pending stays thin (no Own this cafe?). Unclaimed stays thin + WhatsApp footer.

Owner fields come from `shop_claims.passport` when present: photos, brewing/note, hours (owner-supplied only — **never invent hours**), thin offer, optional phone/IG. Platform still owns name, district, and the Maps pin. Claim does not reorder picks or the directory.

Verified / معتمد is a small pill on the Passport card and on directory rows (one `GET /api/claims` list of verified ids). Shared ▲ upvote on the Passport footer reuses `ShopUpvoteProvider`.

### Preview fixture (not production)

Production never overlays a fixture. If Woods has no verified Neon row, Preview and local `next dev` (`VERCEL_ENV !== production`) show an in-code Woods Passport on `/c/woods-olaya` and `/en/c/woods-olaya` so the UI can be tried. Hours in that fixture stay empty. Hero frames live under `public/passport/` and are preview-only — not catalog photos. Do not write a verified Woods row into the shared Neon database.

Google stars/count appear only when Places already returns a cached rating. Soft Places (“ON TONIGHT'S THREE”) stays parked.

## Owner manage (magic link)

After a claim is **verified**, ops mints a single-shop link. The later WhatsApp reply is out of this PR — mint and show the URL only.

- `/owner/edit?shop=…&token=…` and `/en/owner/edit?shop=…&token=…`
- Token is random, hashed at rest, scoped to one `shop_id`, expires in 7 days, revocable
- Valid only when `shop_claims.status = 'verified'` for that shop. Pending / unclaimed fail closed
- Owner may write Passport fields only: photos, brewing / Now pouring, owner-supplied hours, thin offer, optional phone / IG
- Photos: a list of URL fields (**Add another URL**) and a multi-file phone picker (**Upload from phone**). Upload **appends** onto Neon `passport.photos[]` (one request per file). Save never collapses a longer array to the last URL. The edit list and Passport hero carousel both show the full array (`1/n`). The picker shows per-file spinning / done / error and a saved count.
- Phone upload uses **Vercel Blob** (`@vercel/blob` + `BLOB_READ_WRITE_TOKEN`). No third storage. If Blob is unset, URL fields still work. A **private** store cannot use `access: "public"` — upload retries as private and the Passport hero loads `/api/passport-photo/owner/…` so visitors need no signed cookies. A public store still stores the CDN URL.
- Locked (read-only): name, district, Maps pin
- No buy-rank, no Soft Places badge, no invented hours defaults
- Visitor brand stays Wain / wain.lol. Interim **Own this cafe?** → `wa.me` on unclaimed cards stays

### How to mint a try token

Prefer **`cafu-olaya`** — not Woods on shared Neon (the Woods fixture overlay dies if you write a verified Woods row).

1. On **Preview**, set `CLAIM_APPROVE_TOKEN` (and `DATABASE_URL`). Do not set Production `CLAIM_APPROVE_TOKEN` from this work.
2. Link a Vercel Blob store to the project so Preview gets `BLOB_READ_WRITE_TOKEN` (or set that token on Preview). Phone upload needs it; URL add does not.
3. Open `/ops/claims`, enter that token.
4. **grant** `cafu-olaya` (or **verify** a pending row that is not Woods).
5. **mint** — copy the `/owner/edit?shop=&token=` URL once. **revoke** kills active links for that shop.
6. Do not send WhatsApp from ops.

```bash
npx tsx scripts/check-owner-edit.ts
```

## Shop suggestions

Crowdsource-with-curation. Suggestions are **not** the live catalog.

- Web: **أضف قهوة / Add a shop** under the composer, then paste a `maps.app.goo.gl` or Google Maps URL. Pasting a Maps link without tapping first is also a suggestion, not a cafe search.
- `POST /api/suggest` `{ "mapsUrl": "https://maps.app.goo.gl/..." }` — validates host, follows redirects on Google hosts only, reads a place name from the Location path or `<title>` if it can. Does not scrape reviews or photos.
- `GET /api/suggest` returns `{ note, suggestions }` (`mapsUrl`, `resolvedName`, `neighborhood` if obvious, `createdAt`).
- Persist: in-memory + `/tmp/koofi-pending.json` + log the JSON. If `GITHUB_TOKEN` is set, also open a GitHub issue. Do not write suggestions into `catalog.json`.
- WhatsApp: a Maps URL runs the same suggest path.

## WhatsApp door

Same picker as the web chat. Webhook:

- `GET /api/whatsapp` — Meta verification (`hub.mode`, `hub.verify_token`, `hub.challenge`)
- `POST /api/whatsapp` — inbound text messages. A Maps URL is a shop suggestion (thank-you, no picks). Anything else is the same three-pick reply. Real shops use Amjad’s Maps share links. If a shop has lat/lng and WhatsApp is configured, a location message is also sent. Web chat does not need Meta credentials.

The webhook is stubbed so the web app runs without Meta credentials. If tokens are missing, inbound POSTs still run the picker and return `200`; they just skip sending.

### Attach a Meta / WhatsApp number later

1. In Meta for Developers, add the WhatsApp product to an app you control.
2. Set the callback URL to `https://<the-host-you-actually-deploy>/api/whatsapp`.
3. Set the verify token to the same value as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to messages.
5. Put `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in the host’s environment if you want Koofi to reply on WhatsApp.

People forward the Maps pin, not a Koofi URL.

## Project shape

```
app/page.tsx                    Arabic landing
app/en/page.tsx                 English landing
app/feedback/page.tsx           public ideas board (Arabic)
app/en/feedback/page.tsx        public ideas board (English)
app/owner/page.tsx              owner claim door (Arabic)
app/en/owner/page.tsx           owner claim door (English)
app/owner/edit/page.tsx         owner Passport edit (magic link)
app/en/owner/edit/page.tsx       English owner Passport edit
app/ops/claims/page.tsx         token-gated mint / revoke (not public)
app/c/[id]/page.tsx             shareable cafe card (+ CafeOrCoffeeShop JSON-LD)
app/c/[id]/tonight/image        9:16 Tonight card mint (PNG)
app/llms.txt/route.ts           agent pointer to /api/shops + MCP
app/mcp/route.ts                public MCP alias (/mcp)
app/api/mcp/route.ts            public MCP (same catalog as /api/shops)
app/api/shops/route.ts          public curated catalog (CORS GET)
app/api/shops/[id]/route.ts     one public shop
app/api/chat/route.ts           web picker + Maps-link suggestions
app/api/feedback/route.ts       list + add ideas
app/api/feedback/vote/route.ts  upvote
app/api/upvotes/route.ts        directory-list vote snapshot
app/api/upvotes/vote/route.ts   directory-list shop upvote / unvote
app/api/claims/route.ts         public claim status + pending submit
app/api/claims/otp/route.ts     WhatsApp OTP or stub (parked)
app/api/claims/ops/route.ts     ops mint / revoke / grant
app/api/owner/passport/route.ts token-gated Passport read/write
app/api/owner/photos/route.ts   token-gated multi-file upload → Vercel Blob
app/api/learn/route.ts          private learning pile (asks + Maps taps)
app/api/suggest/route.ts        pending suggestions
app/api/place-photo/[id]        optional Places photo (no-op without key)
app/api/whatsapp/route.ts       WhatsApp door
data/catalog.json               editorial catalog (shop names / ids)
data/pending.json               suggestion file shape (not the live catalog)
sql/feedback.sql                ideas + vote_receipts (created on first use)
sql/shop-upvotes.sql            shop_upvotes + shop_vote_receipts (list social proof)
sql/shop-claims.sql             shop_claims + shop_claim_otp + shop_owner_tokens
sql/shop-owner-tokens.sql       magic-link hashes (same Neon)
lib/structured-data.ts          public shop JSON-LD + /api/shops schema
lib/mcp-catalog.ts              MCP tools + resources over the same catalog
lib/public-mcp.ts               Streamable HTTP MCP handler + CORS
lib/faq.ts                      visible About/district FAQ + FAQPage JSON-LD
lib/product.ts                  Koofi, opener, vibe chips, example flag, card path
lib/track.ts                    GTM dataLayer helpers (chat_query and the rest)
lib/tonight.ts                  Tonight card + invite copy, mint path, session rate limit
components/viral-share.tsx      بطاقة الليلة / تعال sheets (Passport + thin)
lib/feedback.ts                 Neon (or local memory) ideas board
lib/upvotes.ts                  Neon (or local memory) directory-list upvotes
lib/claims.ts                   Neon (or local memory) owner claims
lib/owner-tokens.ts             mint / validate / revoke owner edit links
lib/owner-photos.ts             Vercel Blob upload helpers (same photos[])
lib/claim-ops.ts                /ops/claims token gate
lib/passport-preview.ts         Woods Passport fixture (preview/local only)
lib/shop-mark.ts                letter marks on pick cards
lib/suggest.ts                  Maps-link suggestions
lib/env.ts                      env key names
lib/learn.ts                    first-party ask + Maps tap log
lib/picker.ts                   shared three-pick logic
lib/voice.ts                    optional spoken line via xAI (fallback heading)
lib/places.ts                   live Place Details (rating row; not pick order)
```
