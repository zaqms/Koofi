type MapPinIconProps = {
  className?: string;
};

/** Quiet outlined pin. Replaces the Maps / الخريطة word on three-pick rows. */
export function MapPinIcon({ className }: MapPinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={className}
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M12 21s6.5-5.8 6.5-11a6.5 6.5 0 1 0-13 0c0 5.2 6.5 11 6.5 11z"
      />
      <circle
        cx="12"
        cy="10"
        r="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
