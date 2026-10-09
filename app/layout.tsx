import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import { ConsentManager } from "@/components/consent-manager";
import { consentBootstrapScript } from "@/lib/consent";
import { htmlDir, htmlLang, localeFromRequestHeaders } from "@/lib/locale";
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
  const language = localeFromRequestHeaders(await headers());
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
        {/* Consent first: Consent Mode v2 defaults denied; GTM loads only
            after Accept (lib/consent.ts). No tracker loads outside this gate. */}
        <script dangerouslySetInnerHTML={{ __html: consentBootstrapScript() }} />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <CityProvider>{children}</CityProvider>
        <ConsentManager language={language} />
      </body>
    </html>
  );
}
