import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { BrandHomeLink } from "@/components/brand-home-link";
import { copy } from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import {
  claimWhatsAppHref,
  homePath,
  ownerClaimPath,
  ownerPath,
  shopClaimWhatsAppHref,
  shopDisplayName,
} from "@/lib/product";
import type { Language, NeighborhoodId } from "@/lib/types";

export type OwnerCatalogOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoodAr: string;
  neighborhood: string;
};

type OwnerClaimProps = {
  language: Language;
  shop?: OwnerCatalogOption;
};

/** Interim claim door: wa.me chat only. No OTP or CR upload. */
export function OwnerClaim({ language, shop }: OwnerClaimProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const localeHref = shop ? ownerClaimPath(shop.id, other) : ownerPath(other);
  const waHref = shop
    ? shopClaimWhatsAppHref(shop, language)
    : claimWhatsAppHref({ language });
  const selectedLabel = shop ? shopDisplayName(shop, language) : "";
  const selectedArea = shop
    ? language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood as NeighborhoodId, "en")
    : "";

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md px-4 py-6"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <header className="flex items-center justify-between gap-3">
        <BrandHomeLink language={language} className="text-lg font-semibold" />
        <Link
          href={localeHref}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.switchLanguage[language]}
        </Link>
      </header>

      <section className="mt-8">
        {shop ? (
          <>
            <p className="text-xs text-ink-soft">{copy.ownerConfirmed[language]}</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-none tracking-tight">
              {selectedLabel}
            </h1>
            {selectedArea ? (
              <p className="mt-3 text-sm leading-7 text-ink-soft">{selectedArea}</p>
            ) : null}
          </>
        ) : (
          <h1 className="text-[2rem] font-bold leading-none tracking-tight">
            {copy.ownerTitle[language]}
          </h1>
        )}
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          {copy.ownerLead[language]}
        </p>
      </section>

      <p className="mt-8">
        <a
          href={waHref}
          className="inline-flex min-h-12 items-center rounded-2xl bg-bean px-4 text-sm text-foam hover:bg-bean-deep"
        >
          {copy.ownerChatWhatsApp[language]}
        </a>
      </p>

      <p className="mt-8">
        <Link
          href={homePath(language)}
          className="text-sm text-bean hover:text-bean-deep"
        >
          {copy.backToChat[language]}
        </Link>
      </p>
    </main>
  );
}
