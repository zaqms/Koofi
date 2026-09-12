import { notFound } from "next/navigation";
import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import { chipPageMetadata } from "@/lib/chip-page";
import { districtMetadata, resolveDistrictSlug } from "@/lib/district";
import { isDirectoryCategory } from "@/lib/directory-category";
import {
  categoryListingStaticParams,
  mostPopularMetadata,
} from "@/lib/most-popular";
import {
  isCoffeeShopChipSlug,
  isMostPopularSlug,
  PRODUCT_NAME,
} from "@/lib/product";
import {
  districtItemListJsonLd,
  mostPopularItemListJsonLd,
} from "@/lib/structured-data";

type CategoryDistrictPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return categoryListingStaticParams();
}

export async function generateMetadata({ params }: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) {
    return { title: PRODUCT_NAME };
  }
  if (isMostPopularSlug(slug)) {
    return mostPopularMetadata("en");
  }
  if (isCoffeeShopChipSlug(slug)) {
    return chipPageMetadata(slug, "en");
  }
  const district = resolveDistrictSlug(slug);
  if (!district) {
    return { title: `${PRODUCT_NAME} · Coffee shops` };
  }
  return districtMetadata(district, "en", category);
}

export default async function EnglishCategoryDistrictPage({
  params,
}: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) notFound();
  if (isMostPopularSlug(slug)) {
    return (
      <>
        <JsonLd data={mostPopularItemListJsonLd("en")} />
        <HomeLanding language="en" listing="popular" />
      </>
    );
  }
  if (isCoffeeShopChipSlug(slug)) {
    return <HomeLanding language="en" selectedChipId={slug} />;
  }
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();

  return (
    <>
      <JsonLd data={districtItemListJsonLd(district, "en")} />
      <HomeLanding language="en" district={district} />
    </>
  );
}
