import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { PRODUCT_NAME, PUBLIC_SITE_URL } from "@/lib/product";
import "./globals.css";

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
  },
  twitter: {
    card: "summary",
    title: PRODUCT_NAME,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
