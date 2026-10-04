import Link from "next/link";
import { FIXED_LIST_IDS, type FixedListId } from "@/lib/fixed-list-ids";
import { chipSharePath, discoveryCategoryLabel } from "@/lib/product";
import type { Language } from "@/lib/types";

type FixedListPillsProps = {
  language: Language;
  /** Current list. District pages pass null and link all four. */
  current: FixedListId | null;
};

/** Sibling row. On a list page, the other three. On a district page, all four. */
export function FixedListPills({ language, current }: FixedListPillsProps) {
  const ids = FIXED_LIST_IDS.filter((id) => id !== current);
  return (
    <nav
      className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      aria-label={language === "ar" ? "قوائم القهاوي" : "Coffee shop lists"}
      data-fixed-list-nav=""
    >
      {ids.map((id) => (
        <Link
          key={id}
          href={chipSharePath(id, language)}
          data-fixed-list-link={id}
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-line bg-foam px-3 text-[13px] leading-none text-ink"
        >
          {discoveryCategoryLabel(id, language)}
        </Link>
      ))}
    </nav>
  );
}

type FixedListFooterLinksProps = {
  language: Language;
  className: string;
};

/** One footer line. All four lists, on every page that uses the site footer. */
export function FixedListFooterLinks({
  language,
  className,
}: FixedListFooterLinksProps) {
  return (
    <p
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"
      data-fixed-list-footer=""
    >
      {FIXED_LIST_IDS.map((id) => (
        <Link
          key={id}
          href={chipSharePath(id, language)}
          className={className}
          data-fixed-list-footer-link={id}
        >
          {discoveryCategoryLabel(id, language)}
        </Link>
      ))}
    </p>
  );
}
