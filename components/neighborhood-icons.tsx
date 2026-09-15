import type { ReactNode } from "react";
import type { NeighborhoodIconKind } from "@/lib/browse-neighborhoods";

type NeighborhoodIconProps = {
  kind: NeighborhoodIconKind;
  className?: string;
};

function IconFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-8"}
    >
      {children}
    </svg>
  );
}

export function NeighborhoodIcon({ kind, className }: NeighborhoodIconProps) {
  switch (kind) {
    case "fortress":
      return (
        <IconFrame className={className}>
          <path d="M4.8 19.6V10.2h14.4v9.4" />
          <path d="M4.8 10.2V7.1h2.4v3.1h2.4V7.1h2.4v3.1h2.4V7.1h2.4v3.1h2.4V7.1h2.4v3.1" />
          <path d="M10.2 19.6v-4.2a1.8 1.8 0 0 1 3.6 0v4.2" />
        </IconFrame>
      );
    case "towers":
      return (
        <IconFrame className={className}>
          <rect x="4.4" y="9.2" width="6.2" height="10.4" rx="0.6" />
          <rect x="11.6" y="4.8" width="8" height="14.8" rx="0.6" />
          <path d="M6.1 12h2.8M6.1 14.6h2.8M6.1 17.2h2.8" />
          <path d="M13.6 7.4h4M13.6 10.2h4M13.6 13h4M13.6 15.8h4" />
        </IconFrame>
      );
    case "flower":
      return (
        <IconFrame className={className}>
          <ellipse cx="12" cy="6.7" rx="1.55" ry="2.7" />
          <ellipse
            cx="12"
            cy="6.7"
            rx="1.55"
            ry="2.7"
            transform="rotate(60 12 12)"
          />
          <ellipse
            cx="12"
            cy="6.7"
            rx="1.55"
            ry="2.7"
            transform="rotate(120 12 12)"
          />
          <ellipse
            cx="12"
            cy="6.7"
            rx="1.55"
            ry="2.7"
            transform="rotate(180 12 12)"
          />
          <ellipse
            cx="12"
            cy="6.7"
            rx="1.55"
            ry="2.7"
            transform="rotate(240 12 12)"
          />
          <ellipse
            cx="12"
            cy="6.7"
            rx="1.55"
            ry="2.7"
            transform="rotate(300 12 12)"
          />
          <circle cx="12" cy="12" r="1.45" />
        </IconFrame>
      );
    case "palm":
      return (
        <IconFrame className={className}>
          <path d="M12 20.4V10.2" />
          <path d="M12 10.6C8.2 9.1 5.4 9.4 4.2 11.2c2.5-.1 4.6 1 6.1 2.8" />
          <path d="M12 10.6c3.8-1.5 6.6-1.2 7.8.6-2.5-.1-4.6 1-6.1 2.8" />
          <path d="M12 10.2C9.8 7.4 9.2 4.8 10.4 3.2c.8 2.2 2 3.8 3.2 4.8" />
          <path d="M12 10.2c2.2-2.8 2.8-5.4 1.6-7-0.8 2.2-2 3.8-3.2 4.8" />
          <path d="M12 11.2c-3.4.4-5.8 2.2-6.4 4.2 1.9-.8 3.9-.7 5.6.2" />
          <path d="M12 11.2c3.4.4 5.8 2.2 6.4 4.2-1.9-.8-3.9-.7-5.6.2" />
        </IconFrame>
      );
    case "building":
      return (
        <IconFrame className={className}>
          <rect x="6.6" y="4.8" width="10.8" height="14.8" rx="0.7" />
          <path d="M9 8h2M13 8h2M9 11.2h2M13 11.2h2M9 14.4h2M13 14.4h2" />
        </IconFrame>
      );
    case "landmark":
      return (
        <IconFrame className={className}>
          <path d="M12 20.6V4.2" />
          <path d="M12 4.2l1.05 2.6-1.05 1.15L10.95 6.8z" />
          <circle cx="12" cy="9.35" r="1.85" />
          <path d="M10.2 20.6h3.6" />
        </IconFrame>
      );
    case "waves":
      return (
        <IconFrame className={className}>
          <path d="M4.2 10c1.7 1.55 3.4 1.55 5.1 0s3.4-1.55 5.1 0 3.4 1.55 5.1 0" />
          <path d="M4.2 14.2c1.7 1.55 3.4 1.55 5.1 0s3.4-1.55 5.1 0 3.4 1.55 5.1 0" />
        </IconFrame>
      );
    case "tree":
      return (
        <IconFrame className={className}>
          <path d="M12 20.4v-6.4" />
          <path d="M12 14.2c-3-.2-5.1-2.4-5.1-5 0-2.7 2.3-4.8 5.1-4.8s5.1 2.1 5.1 4.8c0 2.6-2.1 4.8-5.1 5z" />
          <path d="M9.4 20.4h5.2" />
        </IconFrame>
      );
    case "dome":
      return (
        <IconFrame className={className}>
          <path d="M5.2 19.4V12.2h13.6v7.2" />
          <path d="M7 12.2a5 5 0 0 1 10 0" />
          <path d="M12 5.2v2.2" />
        </IconFrame>
      );
    case "diamond":
      return (
        <IconFrame className={className}>
          <path d="M12 4.6 19.4 12 12 19.4 4.6 12z" />
        </IconFrame>
      );
    case "pin":
      return (
        <IconFrame className={className}>
          <path d="M12 20.6s5.6-5.2 5.6-9.4a5.6 5.6 0 1 0-11.2 0c0 4.2 5.6 9.4 5.6 9.4z" />
          <circle cx="12" cy="11.1" r="1.6" />
        </IconFrame>
      );
    case "sail":
      return (
        <IconFrame className={className}>
          <path d="M5.8 17.6h12.4c.7 0 1.25.55 1.15 1.25l-.25.75H4.9l-.25-.75c-.1-.7.45-1.25 1.15-1.25z" />
          <path d="M11.5 17.4V5" />
          <path d="M11.5 5.2 17.4 14H11.5z" />
        </IconFrame>
      );
    default:
      return (
        <IconFrame className={className}>
          <circle cx="12" cy="12" r="6" />
        </IconFrame>
      );
  }
}
