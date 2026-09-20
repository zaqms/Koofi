import { copy } from "./copy";
import type {
  ResultsFeedbackFeature,
  ResultsFeedbackReason,
  ResultsFeedbackSource,
} from "./track";
import type { Language } from "./types";

export type ResultsFeedbackPresetId =
  | "halfway"
  | "chat"
  | "search"
  | "category"
  | "cafe"
  | "zero";

export type ResultsFeedbackReasonRow = {
  id: ResultsFeedbackReason;
  label: string;
};

export type ResultsFeedbackPreset = {
  source: ResultsFeedbackSource;
  feature: ResultsFeedbackFeature;
  title: string;
  subtitle: string;
  yesLabel: string;
  noLabel: string;
  whyLabel: string;
  tellMoreLabel: string;
  doneLabel: string;
  thanksYes: string;
  thanksNo: string;
  reasons: ResultsFeedbackReasonRow[];
};

function sharedThanks(language: Language): string {
  return copy.resultsFeedbackThanks[language];
}

export function resultsFeedbackPreset(
  id: ResultsFeedbackPresetId,
  language: Language,
): ResultsFeedbackPreset {
  const tellMore = copy.resultsFeedbackTellMore[language];
  const done = copy.resultsFeedbackDone[language];
  const yes = copy.resultsFeedbackYes[language];
  const no = copy.resultsFeedbackNo[language];
  const why = copy.resultsFeedbackWhy[language];
  const thanks = sharedThanks(language);

  if (id === "halfway") {
    return {
      source: "halfway_results",
      feature: "halfway",
      title: copy.meetHalfwayFeedbackTitle[language],
      subtitle: copy.meetHalfwayFeedbackSub[language],
      yesLabel: copy.meetHalfwayFeedbackYes[language],
      noLabel: copy.meetHalfwayFeedbackNo[language],
      whyLabel: copy.meetHalfwayFeedbackWhy[language],
      tellMoreLabel: copy.meetHalfwayFeedbackTellMore[language],
      doneLabel: done,
      thanksYes: copy.meetHalfwayFeedbackThanksYes[language],
      thanksNo: copy.meetHalfwayFeedbackThanksNo[language],
      reasons: [
        { id: "too_far", label: copy.meetHalfwayFeedbackTooFar[language] },
        { id: "vibe", label: copy.meetHalfwayFeedbackVibe[language] },
        {
          id: "more_options",
          label: copy.meetHalfwayFeedbackMoreOptions[language],
        },
        { id: "other", label: copy.meetHalfwayFeedbackOther[language] },
      ],
    };
  }

  if (id === "search") {
    return {
      source: "search_results",
      feature: "search",
      title: copy.resultsFeedbackSearchTitle[language],
      subtitle: copy.resultsFeedbackSub[language],
      yesLabel: yes,
      noLabel: no,
      whyLabel: why,
      tellMoreLabel: tellMore,
      doneLabel: done,
      thanksYes: thanks,
      thanksNo: thanks,
      reasons: [
        { id: "too_far", label: copy.resultsFeedbackTooFar[language] },
        { id: "not_relevant", label: copy.resultsFeedbackNotRelevant[language] },
        { id: "vibe", label: copy.resultsFeedbackVibe[language] },
        { id: "more_options", label: copy.resultsFeedbackMoreOptions[language] },
        { id: "other", label: copy.resultsFeedbackOther[language] },
      ],
    };
  }

  if (id === "category") {
    return {
      source: "category_results",
      feature: "category",
      title: copy.resultsFeedbackTitle[language],
      subtitle: copy.resultsFeedbackSub[language],
      yesLabel: yes,
      noLabel: no,
      whyLabel: why,
      tellMoreLabel: tellMore,
      doneLabel: done,
      thanksYes: thanks,
      thanksNo: thanks,
      reasons: [
        { id: "too_far", label: copy.resultsFeedbackTooFar[language] },
        { id: "not_expected", label: copy.resultsFeedbackNotExpected[language] },
        { id: "more_options", label: copy.resultsFeedbackMoreOptions[language] },
        { id: "other", label: copy.resultsFeedbackOther[language] },
      ],
    };
  }

  if (id === "cafe") {
    return {
      source: "cafe_detail",
      feature: "cafe_detail",
      title: copy.resultsFeedbackCafeTitle[language],
      subtitle: copy.resultsFeedbackSub[language],
      yesLabel: yes,
      noLabel: copy.resultsFeedbackCafeNo[language],
      whyLabel: copy.resultsFeedbackCafeWhy[language],
      tellMoreLabel: tellMore,
      doneLabel: done,
      thanksYes: copy.resultsFeedbackCafeThanks[language],
      thanksNo: copy.resultsFeedbackCafeThanks[language],
      reasons: [
        { id: "location", label: copy.resultsFeedbackCafeLocation[language] },
        { id: "hours", label: copy.resultsFeedbackCafeHours[language] },
        { id: "seating", label: copy.resultsFeedbackCafeSeating[language] },
        { id: "category", label: copy.resultsFeedbackCafeCategory[language] },
        { id: "photos", label: copy.resultsFeedbackCafePhotos[language] },
        { id: "other", label: copy.resultsFeedbackOther[language] },
      ],
    };
  }

  if (id === "zero") {
    return {
      source: "zero_results",
      feature: "zero_results",
      title: copy.resultsFeedbackZeroTitle[language],
      subtitle: copy.resultsFeedbackZeroSub[language],
      yesLabel: yes,
      noLabel: no,
      whyLabel: why,
      tellMoreLabel: tellMore,
      doneLabel: done,
      thanksYes: thanks,
      thanksNo: thanks,
      reasons: [
        { id: "closer", label: copy.resultsFeedbackZeroCloser[language] },
        { id: "more_options", label: copy.resultsFeedbackZeroMore[language] },
        { id: "different_vibe", label: copy.resultsFeedbackZeroVibe[language] },
        {
          id: "different_category",
          label: copy.resultsFeedbackZeroCategory[language],
        },
        { id: "other", label: copy.resultsFeedbackOther[language] },
      ],
    };
  }

  return {
    source: "chat_results",
    feature: "chat",
    title: copy.resultsFeedbackTitle[language],
    subtitle: copy.resultsFeedbackSub[language],
    yesLabel: yes,
    noLabel: no,
    whyLabel: why,
    tellMoreLabel: tellMore,
    doneLabel: done,
    thanksYes: thanks,
    thanksNo: thanks,
    reasons: [
      { id: "too_far", label: copy.resultsFeedbackTooFar[language] },
      { id: "vibe", label: copy.resultsFeedbackVibe[language] },
      { id: "not_relevant", label: copy.resultsFeedbackNotRelevant[language] },
      { id: "more_options", label: copy.resultsFeedbackMoreOptions[language] },
      { id: "other", label: copy.resultsFeedbackOther[language] },
    ],
  };
}
