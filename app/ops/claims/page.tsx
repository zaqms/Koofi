import { cookies } from "next/headers";
import { DocumentLocale } from "@/components/document-locale";
import { getShop } from "@/lib/catalog";
import {
  CLAIM_APPROVE_COOKIE,
  approveTokenConfigured,
  tokenEquals,
} from "@/lib/claim-ops";
import { listPendingClaims, listVerifiedClaims } from "@/lib/claims";
import { OPS_CLAIMS_PATH, PRODUCT_NAME } from "@/lib/product";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `ops · ${PRODUCT_NAME}`,
  robots: { index: false, follow: false },
};

type OpsPageProps = {
  searchParams: Promise<{
    err?: string | string[];
    ok?: string | string[];
    link?: string | string[];
  }>;
};

function queryOne(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

function notice(err?: string, ok?: string): string | undefined {
  if (ok === "mint") return "minted — copy the link once. do not WhatsApp-send from here.";
  if (ok === "revoke") return "revoked active links for that shop";
  if (ok === "grant") return "verified (or already verified)";
  if (ok === "verify") return "pending → verified";
  if (err === "bad") return "bad token";
  if (err === "not_found") return "shop not found";
  if (err === "not_pending") return "not pending";
  if (err === "not_verified") return "not verified — grant or verify first";
  if (err === "no_storage") return "no storage";
  if (err === "rate_limited") return "rate limited";
  if (err === "bad_action") return "bad action";
  return err || ok;
}

export default async function OpsClaimsPage({ searchParams }: OpsPageProps) {
  const params = await searchParams;
  const banner = notice(queryOne(params.err), queryOne(params.ok));
  const minted = queryOne(params.link);
  const configured = approveTokenConfigured();
  const store = await cookies();
  const authed = tokenEquals(store.get(CLAIM_APPROVE_COOKIE)?.value);

  let pending: Awaited<ReturnType<typeof listPendingClaims>> | null = null;
  let verified: Awaited<ReturnType<typeof listVerifiedClaims>> | null = null;
  if (authed) {
    pending = await listPendingClaims();
    verified = await listVerifiedClaims();
  }

  return (
    <main dir="ltr" lang="en" className="mx-auto max-w-3xl p-4 font-mono text-sm text-ink">
      <DocumentLocale language="en" />
      <h1 className="text-base font-medium">claims ops</h1>
      <p className="mt-1 text-ink-soft">
        token gate. mint a 7-day owner edit link for a verified shop. show the
        URL — do not auto-send WhatsApp.
      </p>
      {banner ? <p className="mt-3">{banner}</p> : null}
      {minted ? (
        <p className="mt-3 break-all rounded border border-gold/40 bg-passport-wash px-3 py-2 text-xs">
          {minted}
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-6">CLAIM_APPROVE_TOKEN is not set.</p>
      ) : !authed ? (
        <form
          method="post"
          action="/api/claims/ops/session"
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
          <form method="post" action="/api/claims/ops/session">
            <input type="hidden" name="action" value="logout" />
            <button type="submit" className="border border-line px-2 py-0.5 text-xs">
              leave
            </button>
          </form>

          <h2 className="mt-6 text-sm font-medium">grant verified</h2>
          <p className="mt-1 text-xs text-ink-soft">
            catalog shop_id only. prefer a non-Woods shop on shared Neon so the
            Woods Passport fixture stays a preview overlay.
          </p>
          <form method="post" action="/api/claims/ops" className="mt-2 flex gap-2">
            <input type="hidden" name="action" value="grant" />
            <input
              name="shopId"
              placeholder="cafu-olaya"
              className="min-w-0 flex-1 border border-line bg-foam px-2 py-1"
            />
            <button type="submit" className="border border-line px-2 py-1">
              grant
            </button>
          </form>

          <h2 className="mt-8 text-sm font-medium">pending</h2>
          {!pending?.ok ? (
            <p className="mt-2">{pending?.error ?? "no storage"}</p>
          ) : pending.claims.length === 0 ? (
            <p className="mt-2 text-ink-soft">none pending</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-1 pr-3 font-medium">shop_id</th>
                  <th className="py-1 pr-3 font-medium">phone</th>
                  <th className="py-1 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {pending.claims.map((row) => (
                  <tr key={row.shopId} className="border-b border-line">
                    <td className="py-2 pr-3">{row.shopId}</td>
                    <td className="py-2 pr-3" dir="ltr">
                      {row.ownerPhoneE164}
                    </td>
                    <td className="py-2">
                      <form method="post" action="/api/claims/ops">
                        <input type="hidden" name="shopId" value={row.shopId} />
                        <input type="hidden" name="action" value="verify" />
                        <button type="submit" className="border border-line px-2 py-0.5">
                          verify
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 className="mt-8 text-sm font-medium">verified — mint link</h2>
          {!verified?.ok ? (
            <p className="mt-2">{verified?.error ?? "no storage"}</p>
          ) : verified.claims.length === 0 ? (
            <p className="mt-2 text-ink-soft">none verified</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-1 pr-3 font-medium">shop</th>
                  <th className="py-1 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {verified.claims.map((row) => {
                  const shop = getShop(row.shopId);
                  const label = shop
                    ? `${row.shopId} · ${shop.nameEn}`
                    : row.shopId;
                  return (
                    <tr key={row.shopId} className="border-b border-line align-top">
                      <td className="py-2 pr-3">{label}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          <form method="post" action="/api/claims/ops">
                            <input type="hidden" name="shopId" value={row.shopId} />
                            <input type="hidden" name="action" value="mint" />
                            <button type="submit" className="border border-gold px-2 py-0.5 text-gold-deep">
                              mint
                            </button>
                          </form>
                          <form method="post" action="/api/claims/ops">
                            <input type="hidden" name="shopId" value={row.shopId} />
                            <input type="hidden" name="action" value="revoke" />
                            <button type="submit" className="border border-line px-2 py-0.5">
                              revoke
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
