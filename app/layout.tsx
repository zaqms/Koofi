import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { htmlDir, htmlLang, localeFromRequestHeaders } from "@/lib/locale";
import { ANALYTICS_REDACT_BOOTSTRAP, TRACKERS_HEADER } from "@/lib/analytics-redact";
import { RedactedAnalytics } from "@/components/redacted-analytics";
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

const GTM_ID = "GTM-W3TM4552";

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
  // بيننا invite pages (/h/*) load no GTM (GA4 + X + OpenAI pixels) and no
  // DataFast: those tags read document.location directly. See proxy.ts.
  const trackers = headerList.get(TRACKERS_HEADER) !== "off";
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
        {trackers ? (
          <script dangerouslySetInnerHTML={{ __html: ANALYTICS_REDACT_BOOTSTRAP }} />
        ) : null}
        {trackers ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        ) : null}
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        {trackers ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <CityProvider>{children}</CityProvider>
        <RedactedAnalytics />
      </body>
      {trackers ? (
        <Script
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
          data-website-id="dfid_qZyLQNdTVNdYA3lB44WTe"
          data-domain="wain.lol"
        />
      ) : null}
    </html>
  );
}
