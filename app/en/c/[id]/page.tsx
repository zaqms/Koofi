import { notFound } from "next/navigation";
import { CafeCardPageView } from "@/components/cafe-card-page";
import { JsonLd } from "@/components/json-ld";
import { getShop, listRealShops } from "@/lib/catalog";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { PRODUCT_NAME } from "@/lib/product";
import { shopJsonLd } from "@/lib/structured-data";

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
    return { title: `${PRODUCT_NAME} · Cafe card` };
  }

  return {
    title: `${shop.nameEn} · ${PRODUCT_NAME}`,
    description: `${shop.nameEn} · ${neighborhoodLabel(shop.neighborhood, "en")}`,
  };
}

export default async function EnglishCafeCardPage({
  params,
  searchParams,
}: CardPageProps) {
  const { id } = await params;
  const shop = getShop(id);
  if (!shop) notFound();

  return (
    <>
      <JsonLd data={shopJsonLd(shop, "en")} />
      <CafeCardPageView
        shop={shop}
        language="en"
        inboundFrom={inboundFrom((await searchParams).from)}
      />
    </>
  );
}
