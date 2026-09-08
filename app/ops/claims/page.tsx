import { cookies } from "next/headers";
import { DocumentLocale } from "@/components/document-locale";
import { CLAIM_APPROVE_COOKIE, approveTokenConfigured, tokenEquals } from "@/lib/claim-ops";
import { listPendingClaims } from "@/lib/claims";
import { getShop } from "@/lib/catalog";
import { OPS_CLAIMS_PATH, PRODUCT_NAME } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `ops · ${PRODUCT_NAME}`,
  robots: { index: false, follow: false },
};

type OpsPageProps = {
  searchParams: Promise<{ err?: string | string[]; ok?: string | string[] }>;
};

function queryOne(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

function notice(err?: string, ok?: string): string | undefined {
  if (ok === "verify") return "verified";
  if (ok === "reject") return "rejected (none)";
  if (err === "bad") return "bad token";
  if (err === "not_found") return "no pending row";
  if (err === "not_pending") return "not pending";
  if (err === "no_storage") return "no storage";
  if (err === "rate_limited") return "rate limited";
  if (err === "bad_action") return "bad action";
  return undefined;
}

export default async function OpsClaimsPage({ searchParams }: OpsPageProps) {
  const params = await searchParams;
  const banner = notice(queryOne(params.err), queryOne(params.ok));
  const configured = approveTokenConfigured();
  const store = await cookies();
  const authed = tokenEquals(store.get(CLAIM_APPROVE_COOKIE)?.value);

  let claims: Awaited<ReturnType<typeof listPendingClaims>> | null = null;
  if (authed) {
    claims = await listPendingClaims();
  }

  return (
    <main dir="ltr" lang="en" className="mx-auto max-w-3xl p-4 font-mono text-sm text-ink">
      <DocumentLocale language="en" />
      <h1 className="text-base font-medium">claims ops</h1>
      <p className="mt-1 text-ink-soft">
        token gate. pending → verified (or reject → none). not a product page.
      </p>
      {banner ? <p className="mt-3">{banner}</p> : null}

      {!configured ? (
        <p className="mt-6">CLAIM_APPROVE_TOKEN is not set.</p>
      ) : !authed ? (
        <form
          method="post"
          action="/api/claims/approve/session"
          className="mt-6 flex flex-col gap-2"
        >
          <label htmlFor="token">token</label>
          <input
            id="token"
            name="token"
            type="password"
            autoComplete="current-password"
            className="border border-line bg-foam px-2 py-1"
          />
          <button type="submit" className="w-fit border border-line px-3 py-1">
            enter
          </button>
        </form>
      ) : (
        <section className="mt-6">
          <form method="post" action="/api/claims/approve/session">
            <input type="hidden" name="action" value="logout" />
            <button type="submit" className="border border-line px-2 py-0.5 text-xs">
              leave
            </button>
          </form>

          {!claims?.ok ? (
            <p className="mt-4">{claims?.error ?? "no storage"}</p>
          ) : claims.claims.length === 0 ? (
            <p className="mt-4">none pending</p>
          ) : (
            <table className="mt-4 w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-1 pr-3 font-medium">shop_id</th>
                  <th className="py-1 pr-3 font-medium">phone</th>
                  <th className="py-1 pr-3 font-medium">proof</th>
                  <th className="py-1 pr-3 font-medium">created_at</th>
                  <th className="py-1 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {claims.claims.map((row) => {
                  const shop = getShop(row.shopId);
                  const label = shop
                    ? `${row.shopId} · ${shop.nameEn}`
                    : row.shopId;
                  return (
                    <tr key={row.shopId} className="border-b border-line align-top">
                      <td className="py-2 pr-3">
                        <div>{label}</div>
                      </td>
                      <td className="py-2 pr-3" dir="ltr">
                        {row.ownerPhoneE164}
                      </td>
                      <td className="py-2 pr-3 break-all">
                        {row.proofAssetUrl ?? "—"}
                      </td>
                      <td className="py-2 pr-3">{row.createdAt}</td>
                      <td className="py-2">
                        <div className="flex flex-col gap-1">
                          <form method="post" action="/api/claims/approve">
                            <input type="hidden" name="shopId" value={row.shopId} />
                            <input type="hidden" name="action" value="verify" />
                            <button type="submit" className="border border-line px-2 py-0.5">
                              verify
                            </button>
                          </form>
                          <form method="post" action="/api/claims/approve">
                            <input type="hidden" name="shopId" value={row.shopId} />
                            <input type="hidden" name="action" value="reject" />
                            <button type="submit" className="border border-line px-2 py-0.5">
                              reject
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
      <p className="mt-8 text-xs text-ink-soft">{OPS_CLAIMS_PATH}</p>
    </main>
  );
}
