"use client";

import { useEffect, useState } from "react";
import { BeenButton } from "@/components/been-button";
import { markBeenHere, readBeenIds } from "@/lib/been";

type CardBeenProps = {
  shopId: string;
};

export function CardBeen({ shopId }: CardBeenProps) {
  const [been, setBeen] = useState(false);

  useEffect(() => {
    setBeen(readBeenIds().includes(shopId));
  }, [shopId]);

  return (
    <div className="pt-1">
      <BeenButton
        marked={been}
        language="ar"
        onMark={() => {
          markBeenHere(shopId);
          setBeen(true);
        }}
      />
    </div>
  );
}
