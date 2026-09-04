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

  return <HomeLanding language="ar" district={district} />;
}
