import Image from "next/image";
import { PRODUCT_NAME } from "@/lib/product";

/** Cropped locked Latin mark. Intrinsic size after whitespace trim. */
export const LATIN_WORDMARK = {
  src: "/brand/wain-lol-wordmark.png",
  width: 1058,
  height: 234,
} as const;

type BrandWordmarkProps = {
  className?: string;
  priority?: boolean;
};

/**
 * Locked heavier black `wain.lol` PNG. Height follows `1em` so it sits with
 * the current text wordmark, not a banner. No stretch, no recolor.
 */
export function BrandWordmark({ className, priority = false }: BrandWordmarkProps) {
  return (
    <span
      className={
        className
          ? `inline-block h-[1em] max-w-full ${className}`
          : "inline-block h-[1em] max-w-full"
      }
      style={{
        aspectRatio: `${LATIN_WORDMARK.width} / ${LATIN_WORDMARK.height}`,
      }}
    >
      <Image
        src={LATIN_WORDMARK.src}
        alt={PRODUCT_NAME}
        width={LATIN_WORDMARK.width}
        height={LATIN_WORDMARK.height}
        unoptimized
        priority={priority}
        className="h-full w-full object-contain object-left"
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
