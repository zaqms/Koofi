"use client";

import { useEffect } from "react";
import type { Language } from "@/lib/types";

type DocumentLocaleProps = {
  language: Language;
};

/** Keep html lang/dir on cafe-card pages after Chat unmounts. */
export function DocumentLocale({ language }: DocumentLocaleProps) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  return null;
}
