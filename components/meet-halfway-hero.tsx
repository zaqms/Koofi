import { MapPinIcon } from "@/components/map-pin-icon";

function CoffeeCupIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="44"
      height="44"
      aria-hidden
      className="text-bean"
    >
      <rect
        x="14"
        y="10"
        width="20"
        height="6"
        rx="2"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M16 16h16c1.2 0 2.2 1 2.2 2.2v11.6A7.2 7.2 0 0 1 27 37h-6a7.2 7.2 0 0 1-7.2-7.2V18.2c0-1.2 1-2.2 2.2-2.2z"
        fill="#fffaf3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M34.2 20.5h2.4a3.6 3.6 0 0 1 0 7.2h-2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M15 39.5h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pin — cup — pin. One cup in the middle, never two cups. */
export function MeetHalfwayHero() {
  return (
    <div className="relative mx-auto flex w-full max-w-[16rem] items-center justify-between px-1 py-3 text-bean">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-1/2 border-t border-dashed border-bean/35"
      />
      <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-foam">
        <MapPinIcon />
      </span>
      <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-foam shadow-[0_0_0_1px_var(--line)]">
        <CoffeeCupIcon />
      </span>
      <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-foam">
        <MapPinIcon />
      </span>
    </div>
  );
}
