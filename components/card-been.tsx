"use client";

import { BeenButton } from "@/components/been-button";
import { useBeenIds } from "@/lib/been";

type CardBeenProps = {
  shopId: string;
};

export function CardBeen({ shopId }: CardBeenProps) {
  const been = useBeenIds();

  return (
    <div className="pt-1">
      <BeenButton
        marked={been.has(shopId)}
        language="ar"
        onMark={() => been.mark(shopId)}
      />
    </div>
  );
}
