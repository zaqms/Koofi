import { notFound } from "next/navigation";
import { HomeLanding } from "@/components/home-landing";
import {
  categoryDistrictStaticParams,
  districtMetadata,
  resolveDistrictSlug,
} from "@/lib/district";
import { isDirectoryCategory } from "@/lib/directory-category";
import { PRODUCT_NAME } from "@/lib/product";

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
    return { title: `${PRODUCT_NAME} · Coffee shops` };
  }
  return districtMetadata(district, "en", category);
}

export default async function EnglishCategoryDistrictPage({
  params,
}: CategoryDistrictPageProps) {
  const { category, slug } = await params;
  if (!isDirectoryCategory(category)) notFound();
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();

  return <HomeLanding language="en" district={district} />;
}
