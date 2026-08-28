import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type BrandHomeLinkProps = {
  language: Language;
  className?: string;
};

/** Latin PNG wordmark back to the locale homepage. */
export function BrandHomeLink({ language, className }: BrandHomeLinkProps) {
  return (
    <Link
      href={homePath(language)}
      className={
        className
          ? `inline-flex items-center ${className}`
          : "inline-flex items-center"
      }
      dir="ltr"
    >
      <BrandWordmark />
    </Link>
  );
}
