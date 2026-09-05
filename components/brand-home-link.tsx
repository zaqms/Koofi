import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type BrandHomeLinkProps = {
  language: Language;
  className?: string;
  onClick?: ComponentPropsWithoutRef<typeof Link>["onClick"];
};

/** Latin PNG wordmark back to the locale homepage. Quiet Beta under the mark. */
export function BrandHomeLink({
  language,
  className,
  onClick,
}: BrandHomeLinkProps) {
  return (
    <Link
      href={homePath(language)}
      onClick={onClick}
      className={
        className
          ? `inline-flex shrink-0 flex-col items-start justify-center gap-0.5 ${className}`
          : "inline-flex shrink-0 flex-col items-start justify-center gap-0.5"
      }
      dir="ltr"
    >
      <BrandWordmark size="nav" />
      <span className="text-xs font-normal leading-none text-ink-soft">
        Beta
      </span>
    </Link>
  );
}
