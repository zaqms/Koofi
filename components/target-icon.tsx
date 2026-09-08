type TargetIconProps = {
  className?: string;
};

/** Gold-mono crosshair for the Passport Maps CTA. */
export function TargetIcon({ className }: TargetIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
