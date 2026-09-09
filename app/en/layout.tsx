import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    locale: "en_US",
  },
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return children;
}
