import { sitemapXmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";

export function GET() {
  return sitemapXmlResponse();
}
