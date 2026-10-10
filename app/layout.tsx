import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import { ConsentManager } from "@/components/consent-manager";
import { CONSENT_AUTOLOAD_SCRIPT, consentBootstrapScript } from "@/lib/consent";
import { htmlDir, htmlLang, localeFromRequestHeaders } from "@/lib/locale";
import { ANALYTICS_REDACT_BOOTSTRAP, TRACKERS_HEADER } from "@/lib/analytics-redact";
import { CityProvider } from "@/lib/city-context";
import { cityLabel, DEFAULT_LIVE_CITY } from "@/lib/cities";
import { HIDE_CHAINS_STORAGE_KEY } from "@/lib/chain-filter";
import { listingOgImage } from "@/lib/listing-og";
import {
  LOCKED_OPENER,
  PRODUCT_NAME,
  PUBLIC_SITE_URL,
  SOCIAL_TWITTER_CARD,
} from "@/lib/product";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-koofi",
  display: "swap",
});

const passportSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-passport",
  display: "swap",
});

const description = `وين القهوة الحين — ثلاث قهاوي، وسبب لكل وحدة. ${cityLabel(DEFAULT_LIVE_CITY, "ar")}.`;
const homeOg = listingOgImage({ kind: "home", language: "ar" }, LOCKED_OPENER);

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: PRODUCT_NAME,
  description,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: PRODUCT_NAME,
    description,
    siteName: PRODUCT_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/",
    images: [homeOg],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: PRODUCT_NAME,
    description,
    images: [homeOg],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerList = await headers();
  const language = localeFromRequestHeaders(headerList);
  // GTM (GA4 + X + OpenAI + Google Ads) and DataFast load only after
  // Accept (lib/consent.ts) AND on a clean URL: not /h/*, /owner/edit or
  // /ops, and no query keys outside the allowlist. Those tags read
  // document.location directly. The proxy sets this header on every page
  // request; anything else fails closed. See proxy.ts and
  // lib/analytics-redact.ts.
  const trackers = headerList.get(TRACKERS_HEADER) === "on";
  return (
    <html
      lang={htmlLang(language)}
      dir={htmlDir(language)}
      className={`${plexArabic.variable} ${passportSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem(${JSON.stringify(HIDE_CHAINS_STORAGE_KEY)})==="1")document.documentElement.setAttribute("data-hide-chains","")}catch(e){}})();`,
          }}
        />
        {/* Consent first: Consent Mode v2 defaults denied, consent click
            guards; it is the only GTM loader (lib/consent.ts). GTM loads only
            after Accept AND where #252 allows trackers: the redaction
            bootstrap (clean URLs only) sets __wainTrackers and the /h/[invite]
            page_location; the autoload then honours a stored Accept. */}
        <script dangerouslySetInnerHTML={{ __html: consentBootstrapScript() }} />
        {trackers ? (
          <script dangerouslySetInnerHTML={{ __html: ANALYTICS_REDACT_BOOTSTRAP }} />
        ) : null}
        {trackers ? (
          <script dangerouslySetInnerHTML={{ __html: CONSENT_AUTOLOAD_SCRIPT }} />
        ) : null}
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <CityProvider>{children}</CityProvider>
        <ConsentManager language={language} trackers={trackers} />
      </body>
    </html>
  );
}
