import { notFound } from "next/navigation";
import { CafeCardPageView } from "@/components/cafe-card-page";
import { getShop, listRealShops } from "@/lib/catalog";
import { PRODUCT_NAME } from "@/lib/product";

type CardPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

function inboundFrom(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export function generateStaticParams() {
  return listRealShops().map((shop) => ({ id: shop.id }));
}

export async function generateMetadata({ params }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) {
    return { title: `${PRODUCT_NAME} · البطاقة` };
  }

  return {
    title: `${shop.nameAr} · ${shop.nameEn}`,
    description: `${shop.neighborhoodAr} · ${shop.vibeTags.join("، ")}`,
  };
}

export default async function CafeCardPage({ params, searchParams }: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) notFound();

  return (
    <CafeCardPageView
      shop={shop}
      language="ar"
      inboundFrom={inboundFrom((await searchParams).from)}
    />
  );
}
