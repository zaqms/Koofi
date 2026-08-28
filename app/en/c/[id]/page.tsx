import { notFound } from "next/navigation";
import { CafeCardPageView } from "@/components/cafe-card-page";
import { getShop, listRealShops } from "@/lib/catalog";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { PRODUCT_NAME } from "@/lib/product";

type CardPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return listRealShops().map((shop) => ({ id: shop.id }));
}

export async function generateMetadata({ params }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) {
    return { title: `${PRODUCT_NAME} · Cafe card` };
  }

  return {
    title: `${shop.nameEn} · ${PRODUCT_NAME}`,
    description: `${shop.nameEn} · ${neighborhoodLabel(shop.neighborhood, "en")}`,
  };
}

export default async function EnglishCafeCardPage({ params }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) notFound();

  return <CafeCardPageView shop={shop} language="en" />;
}
