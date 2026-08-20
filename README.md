# Koofi

A consumer agent for one job: **where should I go for coffee right now, and why?**

People talk to it on a thin web chat, or later on WhatsApp. It is not an app-store app, not a marketing site, not a marketplace, and not a leads tool.

Owner: **Amjad Puliyali**. The real shop list still comes from him.

## What it does

- Opens with the locked line: **اي قهوة ناوي تروح؟**
- They answer with a vibe or a neighborhood.
- Koofi sends **exactly three** cafe picks when it can, each with a one-line why, plus a shareable card link.
- Riyadh only. First neighborhoods: Hittin (هيتين), Al Malqa (الملقا), Al Nakheel (النخيل), Al Yasmin (الياسمين), Olaya (العليا).
- Arabic in (Gulf / Saudi casual). Reply in the language they used. English if they switch. RTL-first.
- Reason over rating. No stars. Neighborhood and moment over “best in Riyadh”.
- **Been here** on the web (`localStorage`) so we stop offering that place as new.
- Shareable card at `/c/[id]`: name AR/EN, neighborhood, pin, hours only if we have them from a legal source, vibe tags. A link, not an app. Cards can ship with no photo.

## What v1 leaves out

App store app, browse-the-city marketing site, rest of KSA, reviews/stars, booking, ordering, delivery, loyalty, shop dashboard, ads, inbound leads, social feed, auto-posting, and any company brand besides Koofi.

## Catalog

The catalog is a local editorial file: [`data/catalog.json`](data/catalog.json).

Schema per shop: `id`, `nameAr`, `nameEn`, `city`, `neighborhood`, `neighborhoodAr`, `vibeTags`, `momentTags` (`work` / `friend` / `qahwa` / `roaster` / `quiet` / `late`), optional `officialSite`, optional `pin`, optional `hours`, and `example`.

**The real list is still coming from Amjad.** The real shop list is still waiting. This repo does not invent real Riyadh cafe names and does not scrape Google, Instagram, Snap, TikTok, or review sites. Hours, ratings, and official claims stay empty until there is a legal source.

v1 ships:

- an empty **real** catalog
- **three fictional example shops** (`example: true`, names like Example Roaster) so the chat can be demonstrated
- those shops are labeled **مثال / Example** in the UI

When Amjad adds shops he likes (target 30–40), append them with `"example": false`. Do not invent names to fill the gap.

Discovery filters the catalog (Riyadh, not been, neighborhood/moment fit) and picks three with a light editorial hand. If the catalog is too small, Koofi says so in Arabic and still returns what it can. It never invents a real shop.

## How to run

```bash
npm install
npm run dev
```

Open the printed local URL. No login. Ask something like `هيتين شغل` or `quiet work in Al Malqa`. You should get up to three example picks and a card link each.

```bash
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env.local` if you need WhatsApp later. **None of these are required for the web chat.**

These names are the contract in `lib/env.ts`, `.env.example`, and the webhook. Do not rename one without the others.

| Variable | Required for web chat | What it does |
| --- | --- | --- |
| `KOOFI_PUBLIC_URL` | No | Optional origin used only to turn `/c/[id]` into an absolute link in WhatsApp replies. Leave empty locally. Do not invent a production domain. |
| `WHATSAPP_VERIFY_TOKEN` | No | Token you set in the Meta webhook callback. Used by `GET /api/whatsapp`. |
| `WHATSAPP_ACCESS_TOKEN` | No | Cloud API token used only if you want the webhook to send a reply. |
| `WHATSAPP_PHONE_NUMBER_ID` | No | Phone number ID for outbound WhatsApp messages. |

Do not commit secrets.

## WhatsApp door

Same picker as the web chat. Webhook:

- `GET /api/whatsapp` — Meta verification (`hub.mode`, `hub.verify_token`, `hub.challenge`)
- `POST /api/whatsapp` — inbound text messages, then the same three-pick reply

The webhook is stubbed so the web app runs without Meta credentials. If tokens are missing, inbound POSTs still run the picker and return `200`; they just skip sending.

### Attach a Meta / WhatsApp number later

1. In Meta for Developers, add the WhatsApp product to an app you control.
2. Set the callback URL to `https://<the-host-you-actually-deploy>/api/whatsapp`.
3. Set the verify token to the same value as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to messages.
5. Put `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in the host’s environment if you want Koofi to reply on WhatsApp.
6. Optionally set `KOOFI_PUBLIC_URL` to that same host so card links in WhatsApp are absolute.

Directions on a card hand off to the user’s maps app when a pin exists.

## Project shape

```
app/page.tsx              thin web chat
app/c/[id]/page.tsx       shareable cafe card
app/api/chat/route.ts     web picker
app/api/whatsapp/route.ts WhatsApp door
data/catalog.json         editorial catalog (shop names / ids)
lib/product.ts            Koofi, opener, example flag, card path
lib/env.ts                WhatsApp env key names
lib/picker.ts             shared three-pick logic
```
