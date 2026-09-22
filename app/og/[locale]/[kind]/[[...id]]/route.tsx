import { listingOpenGraphImage } from "@/lib/listing-og-image";
import { listingOgCopy, type ListingOgSpec } from "@/lib/listing-og";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";

type OgRouteProps = {
  params: Promise<{ locale: string; kind: string; id?: string[] }>;
};

function languageFrom(locale: string): Language | null {
  if (locale === "ar" || locale === "en") return locale;
  return null;
}

function specFrom(
  kind: string,
  language: Language,
  id: string[] | undefined,
): ListingOgSpec | null {
  const extra = id ?? [];
  if (kind === "home" || kind === "popular") {
    if (extra.length > 0) return null;
    return { kind, language };
  }
  if ((kind === "chip" || kind === "district") && extra.length === 1) {
    return { kind, language, id: extra[0] };
  }
  return null;
}

export async function GET(_request: Request, context: OgRouteProps) {
  const { locale, kind, id } = await context.params;
  const language = languageFrom(locale);
  if (!language) return new Response("not found", { status: 404 });
  const spec = specFrom(kind, language, id);
  if (!spec) return new Response("not found", { status: 404 });
  const copy = listingOgCopy(spec);
  if (!copy) return new Response("not found", { status: 404 });
  return listingOpenGraphImage(copy);
}
