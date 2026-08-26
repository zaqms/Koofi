import { canReadLearn } from "@/lib/learn";
import { listReports, recordReport } from "@/lib/report";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!canReadLearn(request)) {
    return new Response("not found", { status: 404 });
  }
  return Response.json(listReports());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      shopId?: unknown;
      nameEn?: unknown;
      neighborhood?: unknown;
      locale?: unknown;
      path?: unknown;
      reason?: unknown;
      note?: unknown;
    };
    const result = recordReport({
      shopId: body.shopId,
      nameEn: body.nameEn,
      neighborhood: body.neighborhood,
      locale: body.locale,
      path: body.path,
      reason: body.reason,
      note: body.note,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
}
