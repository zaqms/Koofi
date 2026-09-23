import Link from "next/link";
import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

function Arrow({ point }: { point: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {point === "right" ? (
        <path d="M3.2 8h9.2M8.6 3.8 13 8l-4.4 4.2" />
      ) : (
        <path d="M12.8 8H3.6M7.4 3.8 3 8l4.4 4.2" />
      )}
    </svg>
  );
}

type ViewAllLinkProps = {
  href: string;
  language: Language;
};

/** Same lightweight “View all” control as the neighborhood strip. */
export function ViewAllLink({ href, language }: ViewAllLinkProps) {
  const rtl = language === "ar";
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 pt-1 text-[13px] leading-5 text-ink-soft"
    >
      <span>{copy.viewAllNeighborhoods[language]}</span>
      <Arrow point={rtl ? "left" : "right"} />
    </Link>
  );
}
