"use client";

import { BeenButton } from "@/components/been-button";
import { useBeenIds } from "@/lib/been";
import type { Language } from "@/lib/types";

type CardBeenProps = {
  shopId: string;
  language?: Language;
};

export function CardBeen({ shopId, language = "ar" }: CardBeenProps) {
  const been = useBeenIds();

  return (
    <div className="pt-1">
      <BeenButton
        marked={been.has(shopId)}
        language={language}
        onMark={() => been.mark(shopId)}
      />
    </div>
  );
}
