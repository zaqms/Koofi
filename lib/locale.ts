import type { Language } from "./types";

export const LOCALE_HEADER = "x-wain-locale";

export function localeFromPathname(pathname: string): Language {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
}

export function localeFromRequestHeaders(headerList: Headers): Language {
  const raw = headerList.get(LOCALE_HEADER);
  if (raw === "en" || raw === "ar") return raw;
  return "ar";
}

export function htmlDir(language: Language): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}

export function htmlLang(language: Language): "ar" | "en" {
  return language;
}

export function pageAlternates(path: string, arPath: string, enPath: string) {
  return {
    canonical: path,
    languages: {
      "ar-SA": arPath,
      en: enPath,
    },
  };
}
