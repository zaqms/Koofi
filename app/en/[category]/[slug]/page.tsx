import { notFound } from "next/navigation";
import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import { districtMetadata, resolveDistrictSlug } from "@/lib/district";
import { isDirectoryCategory } from "@/lib/directory-category";
import {
  categoryListingStaticParams,
  mostPopularMetadata,
} from "@/lib/most-popular";
import { isMostPopularSlug, PRODUCT_NAME } from "@/lib/product";
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
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();

  return (
    <>
      <JsonLd data={districtItemListJsonLd(district, "en")} />
      <HomeLanding language="en" district={district} />
    </>
  );
}
