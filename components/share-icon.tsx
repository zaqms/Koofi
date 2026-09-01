type ShareIconProps = {
  className?: string;
};

/** Quiet share glyph next to شارك / Share. */
export function ShareIcon({ className }: ShareIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14V4m0 0 3.5 3.4M12 4 8.5 7.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 10.5H6.2A2.2 2.2 0 0 0 4 12.7v6.1A2.2 2.2 0 0 0 6.2 21h11.6a2.2 2.2 0 0 0 2.2-2.2v-6.1a2.2 2.2 0 0 0-2.2-2.2H17"
      />
    </svg>
  );
}
