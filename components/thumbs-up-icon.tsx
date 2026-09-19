type ThumbsUpIconProps = {
  className?: string;
  filled?: boolean;
};

/** Quiet outlined thumb-up for أعجبني / Upvote. Matches share / pin stroke. */
export function ThumbsUpIcon({ className, filled = false }: ThumbsUpIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      aria-hidden
    >
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.4 10.6h2.9v8.6H7.6c-1 0-1.8-.8-1.8-1.8v-5c0-1 .8-1.8 1.6-1.8Z"
      />
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 10.6V7.4c0-1.5 1-2.5 2.3-2.5 1 0 1.6.8 1.6 1.8v3.9h3.2c1.2 0 2.1.9 2 2.1l-.7 5.3c-.1 1.1-1.1 1.9-2.2 1.9h-6.2"
      />
    </svg>
  );
}
