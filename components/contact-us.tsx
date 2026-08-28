import { copy } from "@/lib/copy";
import { FEEDBACK_MAIL } from "@/lib/product";
import type { Language } from "@/lib/types";

type ContactUsProps = {
  language: Language;
};

const MAILTO = `mailto:${FEEDBACK_MAIL}`;

/** Mailto button plus the visible address so visitors can copy it. */
export function ContactUs({ language }: ContactUsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <a
        href={MAILTO}
        className="inline-flex min-h-11 items-center rounded-full bg-bean px-4 text-sm text-foam hover:bg-bean-deep"
      >
        {copy.contactUs[language]}
      </a>
      <a
        href={MAILTO}
        className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        dir="ltr"
      >
        {FEEDBACK_MAIL}
      </a>
    </div>
  );
}
