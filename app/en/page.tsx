import { Chat } from "@/components/chat";
import { ShopDirectory } from "@/components/shop-directory";
import { listDirectoryShops } from "@/lib/catalog";
import { LOCKED_OPENER_EN, PRODUCT_NAME } from "@/lib/product";

export const metadata = {
  title: PRODUCT_NAME,
  description: LOCKED_OPENER_EN,
};

export default function EnglishHome() {
  return (
    <main className="min-h-dvh">
      <Chat landing="en" />
      <ShopDirectory language="en" shops={listDirectoryShops()} />
    </main>
  );
}
