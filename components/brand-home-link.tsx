import Link from "next/link";
import { PRODUCT_NAME, homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type BrandHomeLinkProps = {
  language: Language;
  className?: string;
};

/** Wordmark back to the locale homepage. */
export function BrandHomeLink({ language, className }: BrandHomeLinkProps) {
  return (
    <Link href={homePath(language)} className={className}>
      {PRODUCT_NAME}
    </Link>
  );
}
