import { Chat } from "@/components/chat";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { SiteFooter } from "@/components/site-footer";
import { listDirectoryShops } from "@/lib/catalog";
import { listNewThisWeekShops } from "@/lib/new-this-week";
import { LOCKED_OPENER_EN, PRODUCT_NAME } from "@/lib/product";

export const metadata = {
  title: PRODUCT_NAME,
  description: LOCKED_OPENER_EN,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  openGraph: {
    title: PRODUCT_NAME,
    description: LOCKED_OPENER_EN,
    siteName: PRODUCT_NAME,
    locale: "en_US",
    type: "website",
    url: "/en",
  },
  twitter: {
    card: "summary",
    title: PRODUCT_NAME,
    description: LOCKED_OPENER_EN,
  },
};

export default function EnglishHome() {
  return (
    <main className="min-h-dvh">
      <Chat landing="en" />
      <NewThisWeek language="en" shops={listNewThisWeekShops()} />
      <ShopDirectory language="en" shops={listDirectoryShops()} />
      <SiteFooter language="en" />
    </main>
  );
}
