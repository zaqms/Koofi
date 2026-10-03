import { notFound, redirect } from "next/navigation";
import { DistrictPage } from "@/components/district-page";
import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import { chipPageMetadata } from "@/lib/chip-page";
import { districtMetadata, resolveDistrictSlug } from "@/lib/district";
import { districtPageHidden, hiddenDistrictRedirect } from "@/lib/district-dictionary";
import { isDirectoryCategory } from "@/lib/directory-category";
import { TrendingThisWeekPage } from "@/components/trending-this-week-page";
import {
  categoryListingStaticParams,
  mostPopularMetadata,
} from "@/lib/most-popular";
import {
  chipIdFromCoffeeShopSlug,
  isCoffeeShopChipSlug,
  isMostPopularSlug,
  isTrendingSlug,
  PRODUCT_NAME,
} from "@/lib/product";
import { trendingMetadata } from "@/lib/trending-page";
import {
  districtItemListJsonLd,
  mostPopularItemListJsonLd,
} from "@/lib/structured-data";

type CategoryDistrictPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return categoryListingStaticParams();
}

export async function generateMetadata({ params }: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) {
    return { title: PRODUCT_NAME };
  }
  if (isMostPopularSlug(slug)) {
    return mostPopularMetadata("ar");
  }
  if (isTrendingSlug(slug)) {
    return trendingMetadata("ar");
  }
  if (isCoffeeShopChipSlug(slug)) {
    const chipId = chipIdFromCoffeeShopSlug(slug);
    if (!chipId) return { title: PRODUCT_NAME };
    return chipPageMetadata(chipId, "ar");
  }
  const district = resolveDistrictSlug(slug);
  if (!district || districtPageHidden(district)) {
    return { title: PRODUCT_NAME };
  }
  return districtMetadata(district, "ar", category);
}

export default async function CategoryDistrictPage({
  params,
}: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) notFound();
  if (isMostPopularSlug(slug)) {
    return (
      <>
        <JsonLd data={mostPopularItemListJsonLd("ar")} />
        <HomeLanding language="ar" listing="popular" />
      </>
    );
  }
  if (isTrendingSlug(slug)) {
    return <TrendingThisWeekPage language="ar" />;
  }
  if (isCoffeeShopChipSlug(slug)) {
    const chipId = chipIdFromCoffeeShopSlug(slug);
    if (!chipId) notFound();
    return <HomeLanding language="ar" selectedChipId={chipId} />;
  }
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();
  if (districtPageHidden(district)) redirect(hiddenDistrictRedirect("ar"));

  return (
    <>
      <JsonLd data={districtItemListJsonLd(district, "ar")} />
      <DistrictPage language="ar" district={district} />
    </>
  );
}
