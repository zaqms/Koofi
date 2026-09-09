import {
  CAFE_OG_CONTENT_TYPE,
  CAFE_OG_SIZE,
  cafeOpenGraphImage,
} from "@/lib/cafe-og-image";
import { PRODUCT_NAME } from "@/lib/product";

export const alt = PRODUCT_NAME;
export const size = CAFE_OG_SIZE;
export const contentType = CAFE_OG_CONTENT_TYPE;

type ImageProps = {
  params: Promise<{ id: string }>;
};

export default function EnglishCafeOgImage(props: ImageProps) {
  return cafeOpenGraphImage(props, "en");
}
