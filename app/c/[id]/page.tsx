import Link from "next/link";
import { notFound } from "next/navigation";
import { CafeCard } from "@/components/cafe-card";
import { getShop, listShops } from "@/lib/catalog";
import { copy, PRODUCT_NAME_AR } from "@/lib/copy";

type CardPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return listShops().map((shop) => ({ id: shop.id }));
}

export async function generateMetadata({ params }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) {
    return { title: `${PRODUCT_NAME_AR} · البطاقة` };
  }

  return {
    title: `${shop.nameAr} · ${shop.nameEn}`,
    description: `${shop.neighborhoodAr} · ${shop.vibeTags.join("، ")}`,
  };
}

export default async function CafeCardPage({ params }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) notFound();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-6">
      <p className="text-xs text-ink-soft">
        {PRODUCT_NAME_AR} · {copy.shareHint.ar}
      </p>
      <CafeCard shop={shop} />
      <p className="mt-6">
        <Link href="/" className="text-sm text-bean hover:text-bean-deep">
          {copy.backToChat.ar}
        </Link>
      </p>
    </main>
  );
}
