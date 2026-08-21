import { Chat } from "@/components/chat";
import { LOCKED_OPENER_EN, PRODUCT_NAME } from "@/lib/product";

export const metadata = {
  title: PRODUCT_NAME,
  description: LOCKED_OPENER_EN,
};

export default function EnglishHome() {
  return (
    <main className="h-dvh overflow-hidden">
      <Chat landing="en" />
    </main>
  );
}
