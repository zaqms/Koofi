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
      strokeWidth="1.35"
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
          <path d="M5.2 19.4V9.6l2.1-1.8h9.4l2.1 1.8v9.8" />
          <path d="M5.2 9.6h2.15V7.4h2.1v2.2h2.15V7.4h2.1v2.2h2.15V7.4h2.1v2.2" />
          <path d="M10.4 19.4v-4.1a1.6 1.6 0 0 1 3.2 0v4.1" />
        </IconFrame>
      );
    case "towers":
      return (
        <IconFrame className={className}>
          <path d="M4.8 19.2V9.4h5.2v9.8" />
          <path d="M10.6 19.2V5.6h8.6v13.6" />
          <path d="M6.2 11.6h2.2M6.2 14.2h2.2M6.2 16.8h2.2" />
          <path d="M13 8.2h3.6M13 11h3.6M13 13.8h3.6M13 16.6h3.6" />
        </IconFrame>
      );
    case "flower":
      return (
        <IconFrame className={className}>
          <circle cx="12" cy="12" r="1.45" />
          <path d="M12 5.2c1.25 1.55 1.25 3.2 0 4.15-1.25-.95-1.25-2.6 0-4.15z" />
          <path d="M12 14.65c1.25 1.55 1.25 3.2 0 4.15-1.25-.95-1.25-2.6 0-4.15z" />
          <path d="M5.2 12c1.55-1.25 3.2-1.25 4.15 0-1.25.95-2.6 1.25-4.15 0z" />
          <path d="M14.65 12c1.55-1.25 3.2-1.25 4.15 0-1.25.95-2.6 1.25-4.15 0z" />
          <path d="M7.15 7.15c1.95.4 3.1 1.7 2.7 3.05-1.35-.4-2.65-1.55-2.7-3.05z" />
          <path d="M16.85 7.15c-1.95.4-3.1 1.7-2.7 3.05 1.35-.4 2.65-1.55 2.7-3.05z" />
          <path d="M7.15 16.85c1.95-.4 3.1-1.7 2.7-3.05-1.35.4-2.65 1.55-2.7 3.05z" />
          <path d="M16.85 16.85c-1.95-.4-3.1-1.7-2.7-3.05 1.35.4 2.65 1.55 2.7 3.05z" />
        </IconFrame>
      );
    case "palm":
      return (
        <IconFrame className={className}>
          <path d="M12 20.2V10.6" />
          <path d="M12 11.2c-2.4-1.2-5.2-1.1-7.1.4 2.2.15 4.1 1.15 5.4 2.8" />
          <path d="M12 11.2c2.4-1.2 5.2-1.1 7.1.4-2.2.15-4.1 1.15-5.4 2.8" />
          <path d="M12 10.4c-1.6-2.3-1.9-5.1-.8-7.2 1 2.1 2.4 3.7 3.4 4.6" />
          <path d="M12 10.4c1.6-2.3 1.9-5.1.8-7.2-1 2.1-2.4 3.7-3.4 4.6" />
          <path d="M12 11c-3.1.15-5.4 1.7-6.2 3.8 1.8-.7 3.7-.7 5.5.1" />
          <path d="M12 11c3.1.15 5.4 1.7 6.2 3.8-1.8-.7-3.7-.7-5.5.1" />
        </IconFrame>
      );
    case "building":
      return (
        <IconFrame className={className}>
          <path d="M7.2 19.4V6.6h9.6v12.8" />
          <path d="M9.2 9h1.5M13.3 9h1.5M9.2 12h1.5M13.3 12h1.5M9.2 15h1.5M13.3 15h1.5" />
        </IconFrame>
      );
    case "landmark":
      return (
        <IconFrame className={className}>
          <path d="M12 20.5V4.4" />
          <path d="M12 4.4l.7 2.4-.7 1.3-.7-1.3z" />
          <circle cx="12" cy="9.15" r="1.7" />
          <path d="M10.6 20.5h2.8" />
        </IconFrame>
      );
    case "waves":
      return (
        <IconFrame className={className}>
          <path d="M4.4 10.2c1.6 1.5 3.2 1.5 4.8 0s3.2-1.5 4.8 0 3.2 1.5 4.8 0" />
          <path d="M4.4 14.2c1.6 1.5 3.2 1.5 4.8 0s3.2-1.5 4.8 0 3.2 1.5 4.8 0" />
        </IconFrame>
      );
    case "tree":
      return (
        <IconFrame className={className}>
          <path d="M12 20.2v-6.2" />
          <path d="M12 14c-2.8-.2-4.8-2.2-4.8-4.6 0-2.5 2.1-4.4 4.8-4.4s4.8 1.9 4.8 4.4c0 2.4-2 4.4-4.8 4.6z" />
          <path d="M9.6 20.2h4.8" />
        </IconFrame>
      );
    case "dome":
      return (
        <IconFrame className={className}>
          <path d="M5.4 19.2V12h13.2v7.2" />
          <path d="M7.2 12a4.8 4.8 0 0 1 9.6 0" />
          <path d="M12 5.4V7.2" />
        </IconFrame>
      );
    case "diamond":
      return (
        <IconFrame className={className}>
          <path d="M12 4.8 19.2 12 12 19.2 4.8 12z" />
        </IconFrame>
      );
    case "pin":
      return (
        <IconFrame className={className}>
          <path d="M12 20.4s5.4-5.1 5.4-9.2a5.4 5.4 0 1 0-10.8 0c0 4.1 5.4 9.2 5.4 9.2z" />
          <circle cx="12" cy="11" r="1.55" />
        </IconFrame>
      );
    case "sail":
      return (
        <IconFrame className={className}>
          <path d="M6.4 17.6h11.2c.7 0 1.3.6 1.2 1.3l-.2.7H5.4l-.2-.7c-.1-.7.5-1.3 1.2-1.3z" />
          <path d="M11.6 17.4V5.2" />
          <path d="M11.6 5.4 17 13.8H11.6z" />
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
