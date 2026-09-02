import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

export function GET() {
  return sitemapXmlResponse();
}
