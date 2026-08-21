import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { PRODUCT_NAME } from "@/lib/product";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-koofi",
  display: "swap",
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: "وين القهوة الحين — ثلاث قهاوي، وسبب لكل وحدة. الرياض.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="h-dvh overflow-hidden bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
