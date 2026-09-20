"use client";

import { ResultsFeedbackBlock } from "@/components/results-feedback";
import type { MeetHalfwayFeedbackSource } from "@/lib/track";
import type { Language } from "@/lib/types";

type MeetHalfwayFeedbackProps = {
  language: Language;
  resetKey: string;
  packId?: string;
  source?: MeetHalfwayFeedbackSource;
  count?: number;
  shopIds?: string[];
};

export function MeetHalfwayFeedback({
  language,
  resetKey,
  packId,
  source,
  count,
  shopIds,
}: MeetHalfwayFeedbackProps) {
  return (
    <ResultsFeedbackBlock
      language={language}
      preset="halfway"
      resetKey={resetKey}
      halfwaySource={source}
      packId={packId}
      count={count}
      shopIds={shopIds}
    />
  );
}
