# Koofi

A consumer agent for one job: **where should I go for coffee right now, and why?**

People talk to it on a thin web chat, or later on WhatsApp. It is not an app-store app, not a marketing site, not a marketplace, and not a leads tool.

Owner: **Amjad Puliyali**. The real shop list still comes from him.

## What it does

- Two landings, same chat: **`/`** is Arabic (`اي قهوة ناوي تروح؟`, Arabic chips, RTL). **`/en`** is English (`Which coffee you heading to?`, English chips, LTR). Header switches with `EN` / `عربي`. Not a marketing site. Not both languages stacked in one bubble.
- Ten vibe chips under the opener, one label each. Tapping still returns **three** pick cards. Chips stay available above the composer so they can try another vibe without starting a new conversation. Typing the other language still flips the reply. WhatsApp has no chip UI; typing the same Arabic or English phrase maps the same way.
- They can also type a vibe or a neighborhood. A follow-up like `أبعد عن العليا` / `away from Olaya` gets another spoken line and a new three from the remaining catalog — not a general chat.
- Koofi sends **exactly three** cafe picks when it can. It does not collapse to a single shop card when three shops exist. A short spoken line sits above the cards (xAI chat completions, `grok-4.6`). The share unit is still the cards: name, one-line why, and a Google Maps pin. For a real shop the Maps click is Amjad’s `mapsShareUrl` short link, not a reconstructed lat/lng search. People forward that pin to go. The `/c/[id]` card is optional and secondary. If `XAI_API_KEY` is missing or the model call fails, the spoken line falls back to today’s heading copy. Cards still send.
- Riyadh only. Neighborhoods: Hittin (هيتين), Al Malqa (الملقا), Al Nakheel (النخيل), Al Yasmin (الياسمين), Olaya (العليا), Sulimaniyah (السليمانية), Al Wurud (الورود), Al Rabwah (الربوة), Al Rabi (الربيع), Al Masif (المصيف), Al Rahmaniyyah (الرحمانية).
- Arabic in (Gulf / Saudi casual). Reply in the language they used. English if they switch. RTL-first.
- Reason over rating. Neighborhood and moment still choose the three shops — never sort or pick by stars. A real shop card may show Google’s rating, review count, and one short snippet via Places. If `GOOGLE_PLACES_API_KEY` is missing or the lookup fails, the rating row is hidden. Do not scrape Maps.
- **Been here** on the web (`localStorage`) so we stop offering that place as new.
- Optional card at `/c/[id]`: name AR/EN, neighborhood, pin, hours only if we have them from a legal source, vibe tags. Do not ask people to share the Koofi URL.
- Each pick card has a small 44px letter mark from the shop name (IK, WO, …). A `photoUrl` is shown only if Amjad sets one. Do not scrape Maps photos.
- **أضف قهوة / Add a shop** sits under the composer, not in the chip row. Drop a Google Maps link. Koofi thanks them and stores a suggestion for Amjad — it does not go into `catalog.json`.

## What v1 leaves out

App store app, browse-the-city marketing site, rest of KSA, scraped reviews/stars, ranking by rating, booking, ordering, delivery, loyalty, shop dashboard, ads, inbound leads, social feed, auto-posting, and any company brand besides Koofi.

## Catalog

The catalog is a local editorial file: [`data/catalog.json`](data/catalog.json).

Schema per shop: `id`, `nameAr`, `nameEn`, `city`, `neighborhood`, `neighborhoodAr`, `vibeTags`, `momentTags` (`work` / `friend` / `qahwa` / `roaster` / `quiet` / `late` / `popular` / `pastry` / `study` / `outdoor` / `date`), optional `officialSite`, optional `pin`, optional `hours`, optional `mapsShareUrl`, optional `photoUrl`, optional `logoUrl`, and `example`. `shopMapsHref` prefers `mapsShareUrl`, then pin, then a name search. Leave `photoUrl` / `logoUrl` empty unless there is a legal photo. Never hotlink a scraped Maps CDN URL.

The locked openers and chip list live in [`lib/product.ts`](lib/product.ts) (`LOCKED_OPENER` on `/`, `LOCKED_OPENER_EN` on `/en`, `VIBE_CHIPS`). The coffee chip maps onto `qahwa`. Chat UI and copy import those; do not duplicate the opener strings or the chip labels.

**Real shops come from Amjad as Maps pins.** This repo does not invent real Riyadh cafe names and does not scrape Google, Instagram, Snap, TikTok, or review sites. Do not write ratings into `catalog.json`. Hours and official claims stay empty until there is a legal source. Do not invent coordinates for a real shop when `mapsShareUrl` is present.

v1 ships the real shops Amjad sent (`example: false`), each with his exact Maps share link. Do not add fictional example/مثال shops to fill a neighborhood, a vibe chip, or a three-pick reply. Picks and the public list are real shops only.

When Amjad adds more shops he likes, append them with `"example": false` and his Maps share URL. Do not invent names to fill the gap.

Discovery filters the catalog (Riyadh, not been, neighborhood/moment fit) and picks three with a light editorial hand. If the catalog is too small, Koofi says so in Arabic and still returns what it can. It never invents a real shop.

## How to run

```bash
npm install
npm run dev
```

Open the printed local URL. No login. Ask something like `هيتين شغل` or `quiet work in Al Malqa`. You should get up to three real-shop picks and a card link each.

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
app/c/[id]/page.tsx             shareable cafe card
app/api/chat/route.ts           web picker + Maps-link suggestions
app/api/learn/route.ts          private learning pile (asks + Maps taps)
app/api/suggest/route.ts        pending suggestions
app/api/place-photo/[id]        optional Places photo (no-op without key)
app/api/whatsapp/route.ts       WhatsApp door
data/catalog.json               editorial catalog (shop names / ids)
data/pending.json               suggestion file shape (not the live catalog)
lib/product.ts                  Koofi, opener, vibe chips, example flag, card path
lib/shop-mark.ts                letter marks on pick cards
lib/suggest.ts                  Maps-link suggestions
lib/env.ts                      env key names
lib/learn.ts                    first-party ask + Maps tap log
lib/picker.ts                   shared three-pick logic
lib/voice.ts                    optional spoken line via xAI (fallback heading)
lib/places.ts                   live Place Details (rating row; not pick order)
```
