import { Chat } from "@/components/chat";
import { ShopDirectory } from "@/components/shop-directory";
import { listDirectoryShops } from "@/lib/catalog";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <Chat landing="ar" />
      <ShopDirectory language="ar" shops={listDirectoryShops()} />
    </main>
  );
}
