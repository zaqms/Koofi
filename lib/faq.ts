import { neighborhoodLabel } from "./neighborhoods";
import { aboutPath, districtPath, PUBLIC_SITE_URL } from "./product";
import { SCHEMA_CONTEXT } from "./structured-data";
import type { Language, NeighborhoodId } from "./types";

export type FaqItem = {
  q: string;
  a: string;
};

export type FaqPageJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "FAQPage";
  url: string;
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
};

/** Visible About FAQ. Najdi AR / plain EN. Same strings go into FAQPage JSON-LD. */
export function aboutFaqs(language: Language): FaqItem[] {
  if (language === "ar") {
    return [
      {
        q: "وش هو wain.lol؟",
        a: "دليل قهوة في الرياض. تسأل، يعطيك ثلاث قهاوي وسبب لكل وحدة.",
      },
      {
        q: "كيف يطلع الثلاث؟",
        a: "تكتب حي أو جو، أو تضغط شيب. يطلع لك ثلاث من القائمة، وكل وحدة عليها خريطة قوقل. ما نرتّب بالنجوم.",
      },
      {
        q: "الرياض بس ولا فيه مدن ثانية؟",
        a: "الرياض بس. باقي المملكة بعد ما انفتحت.",
      },
      {
        q: "كيف أضيف قهوة؟",
        a: "من «أضف قهوة»، ارمي رابط قوقل ماب. نشوفها، وإذا مشت مع القائمة نضيفها. ما تدخل لحاله.",
      },
      {
        q: "فيه توصيل أو طلب من التطبيق؟",
        a: "لا. مو توصيل، ومو سوق. رابط، مو متجر.",
      },
      {
        q: "أقدر أتفرج على الحي؟",
        a: "إي. القائمة تحت الشات حسب الحي.",
      },
    ];
  }

  return [
    {
      q: "What is wain.lol?",
      a: "A Riyadh coffee guide. You ask, it gives you three cafes and a reason for each.",
    },
    {
      q: "How do the picks work?",
      a: "Type a neighborhood or a vibe, or tap a chip. You get three from the list, each with a Google Maps pin. We don't rank by stars.",
    },
    {
      q: "Is it only Riyadh?",
      a: "Yes. Riyadh only. Nowhere else in KSA yet.",
    },
    {
      q: "How do I add a cafe?",
      a: "Tap “Add a coffee shop” and drop a Google Maps link. We'll look at it, and add it if it fits the list. It doesn't go live on its own.",
    },
    {
      q: "Do you deliver or take orders?",
      a: "No. Not delivery, not a marketplace. A link, not a store.",
    },
    {
      q: "Can I browse by neighborhood?",
      a: "Yes. The list under chat is by neighborhood.",
    },
  ];
}

/** 1–2 short lines kept for later copy. Not rendered on district pages. */
export function districtFaqs(
  district: NeighborhoodId,
  language: Language,
): FaqItem[] {
  const name = neighborhoodLabel(district, language);
  if (language === "ar") {
    return [
      {
        q: `قهوة في ${name}؟`,
        a: `إي — هذي القائمة اللي نحبها في ${name}.`,
      },
      {
        q: "كيف أطلع ثلاث قهاوي؟",
        a: "اسأل فوق: حي أو جو، ويطلع لك ثلاث مع خريطة قوقل.",
      },
    ];
  }

  return [
    {
      q: `Coffee in ${name}?`,
      a: `Yes — this is the curated list for ${name}.`,
    },
    {
      q: "How do I get three picks?",
      a: "Ask above — a neighborhood or a vibe — and you get three with Maps pins.",
    },
  ];
}

export function faqPageJsonLd(items: readonly FaqItem[], url: string): FaqPageJsonLd {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    url,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function aboutFaqJsonLd(language: Language): FaqPageJsonLd {
  return faqPageJsonLd(
    aboutFaqs(language),
    `${PUBLIC_SITE_URL}${aboutPath(language)}`,
  );
}

export function districtFaqJsonLd(
  district: NeighborhoodId,
  language: Language,
): FaqPageJsonLd {
  return faqPageJsonLd(
    districtFaqs(district, language),
    `${PUBLIC_SITE_URL}${districtPath(district, language)}`,
  );
}

export function faqHeading(language: Language): string {
  return language === "ar" ? "أسئلة" : "FAQ";
}
