import { notFound } from "next/navigation";
import { HomeLanding } from "@/components/home-landing";
import {
  districtMetadata,
  districtStaticParams,
  resolveDistrictSlug,
} from "@/lib/district";
import { PRODUCT_NAME } from "@/lib/product";

type DistrictPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return districtStaticParams();
}

export async function generateMetadata({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = resolveDistrictSlug(slug);
  if (!district) {
    return { title: PRODUCT_NAME };
  }
  return districtMetadata(district, "ar");
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = resolveDistrictSlug(slug);
  if (!district) notFound();

  return <HomeLanding language="ar" district={district} />;
}
