import { Chat } from "@/components/chat";
import { NewThisWeek } from "@/components/new-this-week";
import { ShopDirectory } from "@/components/shop-directory";
import { listDirectoryShops } from "@/lib/catalog";
import { listNewThisWeekShops } from "@/lib/new-this-week";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <Chat landing="ar" />
      <NewThisWeek language="ar" shops={listNewThisWeekShops()} />
      <ShopDirectory language="ar" shops={listDirectoryShops()} />
    </main>
  );
}
