import { handlePublicMcp, publicMcpOptionsResponse } from "@/lib/public-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return publicMcpOptionsResponse();
}

export function GET(request: Request) {
  return handlePublicMcp(request);
}

export function POST(request: Request) {
  return handlePublicMcp(request);
}

export function DELETE(request: Request) {
  return handlePublicMcp(request);
}
