import type { ComponentPropsWithoutRef } from "react";

type MapsLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
};

/** External Maps CTA. Always leaves Koofi open in the current tab. */
export function MapsLink({ href, children, ...props }: MapsLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
