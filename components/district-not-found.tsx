import Link from "next/link";
import { DocumentLocale } from "@/components/document-locale";
import { copy } from "@/lib/copy";
import { homePath } from "@/lib/product";
import type { Language } from "@/lib/types";

type DistrictNotFoundProps = {
  language: Language;
};

export function DistrictNotFound({ language }: DistrictNotFoundProps) {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <DocumentLocale language={language} />
      <h1 className="text-xl font-semibold">{copy.districtMissing[language]}</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        {copy.districtMissingHint[language]}
      </p>
      <Link href={homePath(language)} className="mt-4 text-sm text-bean">
        {copy.backToChat[language]}
      </Link>
    </main>
  );
}
