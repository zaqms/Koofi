import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Script from "next/script";
import {
  PRODUCT_NAME,
  PUBLIC_SITE_URL,
  SOCIAL_SHARE_IMAGE,
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

const description = "وين القهوة الحين — ثلاث قهاوي، وسبب لكل وحدة. الرياض.";

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
    images: [SOCIAL_SHARE_IMAGE],
  },
  twitter: {
    card: SOCIAL_TWITTER_CARD,
    title: PRODUCT_NAME,
    description,
    images: [SOCIAL_SHARE_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <Analytics />
      </body>
      <Script
        src="https://datafa.st/js/script.js"
        strategy="afterInteractive"
        data-website-id="dfid_qZyLQNdTVNdYA3lB44WTe"
        data-domain="wain.lol"
      />
    </html>
  );
}
