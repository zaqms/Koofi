import type { ReactNode } from "react";

type ListingActionFaceProps = {
  label: string;
  children: ReactNode;
};

/** Rounded-square icon + label under it. Shared by Map and Share. */
export function ListingActionFace({ label, children }: ListingActionFaceProps) {
  return (
    <>
      <span className="inline-flex size-11 items-center justify-center rounded-[10px] border border-wain-divider bg-foam">
        {children}
      </span>
      <span className="text-[11px] leading-none">{label}</span>
    </>
  );
}

export const listingActionClassName =
  "notranslate flex w-11 shrink-0 flex-col items-center gap-1 text-wain-soft-taupe hover:text-ink";
