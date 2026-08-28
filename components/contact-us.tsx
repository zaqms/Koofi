import { copy } from "@/lib/copy";
import { CONTACT_WHATSAPP_HREF } from "@/lib/product";
import type { Language } from "@/lib/types";

type ContactUsProps = {
  language: Language;
};

/** WhatsApp click-to-chat. No phone number or email on this control. */
export function ContactUs({ language }: ContactUsProps) {
  return (
    <a
      href={CONTACT_WHATSAPP_HREF}
      className="inline-flex min-h-11 items-center rounded-full bg-bean px-4 text-sm text-foam hover:bg-bean-deep"
    >
      {copy.contactUs[language]}
    </a>
  );
}
