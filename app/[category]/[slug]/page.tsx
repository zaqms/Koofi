import { notFound } from "next/navigation";
import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import {
  categoryDistrictStaticParams,
  districtMetadata,
  resolveDistrictSlug,
} from "@/lib/district";
import { isDirectoryCategory } from "@/lib/directory-category";
import { districtFaqJsonLd } from "@/lib/faq";
import { PRODUCT_NAME } from "@/lib/product";
import { districtItemListJsonLd } from "@/lib/structured-data";

type CategoryDistrictPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return categoryDistrictStaticParams();
}

export async function generateMetadata({ params }: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) {
    return { title: PRODUCT_NAME };
  }
  const district = resolveDistrictSlug(slug);
  if (!district) {
    return { title: PRODUCT_NAME };
  }
  return districtMetadata(district, "ar", category);
}

export default async function CategoryDistrictPage({
  params,
}: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) notFound();
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();

  return (
    <>
      <JsonLd data={districtItemListJsonLd(district, "ar")} />
      <JsonLd data={districtFaqJsonLd(district, "ar")} />
      <HomeLanding language="ar" district={district} />
    </>
  );
}
