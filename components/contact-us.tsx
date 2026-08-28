import { copy } from "@/lib/copy";
import {
  CONTACT_WHATSAPP_HREF,
  CONTACT_WHATSAPP_NUMBER,
} from "@/lib/product";
import type { Language } from "@/lib/types";

type ContactUsProps = {
  language: Language;
};

/** WhatsApp click-to-chat plus the visible number so visitors can copy it. */
export function ContactUs({ language }: ContactUsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <a
        href={CONTACT_WHATSAPP_HREF}
        className="inline-flex min-h-11 items-center rounded-full bg-bean px-4 text-sm text-foam hover:bg-bean-deep"
      >
        {copy.contactUs[language]}
      </a>
      <a
        href={CONTACT_WHATSAPP_HREF}
        className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        dir="ltr"
      >
        {CONTACT_WHATSAPP_NUMBER}
      </a>
    </div>
  );
}
