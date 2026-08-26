import { canReadLearn } from "@/lib/learn";
import { listReports, recordReport } from "@/lib/report";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!canReadLearn(request)) {
    return new Response("not found", { status: 404 });
  }
  return Response.json(await listReports());
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
    const result = await recordReport({
      shopId: body.shopId,
      nameEn: body.nameEn,
      neighborhood: body.neighborhood,
      locale: body.locale,
      path: body.path,
      reason: body.reason,
      note: body.note,
    });
    if (!result.ok) {
      const status = result.error === "persist_failed" ? 503 : 400;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json({ ok: true, stored: result.stored });
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
}
