import { OwnerEdit } from "@/components/owner-edit";
import { OwnerEditDenied } from "@/components/owner-edit-denied";
import { getShop } from "@/lib/catalog";
import { copy } from "@/lib/copy";
import { validateOwnerToken } from "@/lib/owner-tokens";
import { PRODUCT_NAME } from "@/lib/product";

export const dynamic = "force-dynamic";

type OwnerEditPageProps = {
  searchParams: Promise<{ shop?: string | string[]; token?: string | string[] }>;
};

function queryOne(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export async function generateMetadata() {
  return {
    title: `${copy.ownerEditTitle.en} · ${PRODUCT_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default async function EnglishOwnerEditPage({
  searchParams,
}: OwnerEditPageProps) {
  const params = await searchParams;
  const shopId = queryOne(params.shop);
  const token = queryOne(params.token);
  const session = await validateOwnerToken({ shopId, token });
  if (!session.ok || !token) {
    return <OwnerEditDenied language="en" error={session.ok ? "missing" : session.error} />;
  }
  const shop = getShop(session.shopId);
  if (!shop) {
    return <OwnerEditDenied language="en" error="not_found" />;
  }
  return (
    <OwnerEdit
      language="en"
      shop={shop}
      token={token}
      passport={session.passport}
    />
  );
}
