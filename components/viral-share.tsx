"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { copy } from "@/lib/copy";
import { trackEvent } from "@/lib/track";
import {
  canMintTonight,
  canShareImageAndText,
  inviteShareText,
  recordTonightMint,
  sanitizeTonightLine,
  TONIGHT_LINE_MAX,
  TONIGHT_WATERMARK,
  tonightCardUrl,
  tonightFilename,
  tonightDistrict,
  tonightImagePath,
  tonightShareText,
  SHOW_TONIGHT_CARD,
} from "@/lib/tonight";
import type { Language, Shop } from "@/lib/types";

type ViralShareShop = Pick<
  Shop,
  "id" | "nameAr" | "nameEn" | "neighborhood" | "neighborhoodAr" | "photoUrl" | "logoUrl"
>;

type ViralShareActionsProps = {
  shop: ViralShareShop;
  language: Language;
  photo?: string | null;
  variant?: "passport" | "thin";
};

type SheetKind = "tonight" | "invite" | null;

function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function ViralShareActions({
  shop,
  language,
  photo = null,
  variant = "thin",
}: ViralShareActionsProps) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [inviteBlob, setInviteBlob] = useState<Blob | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteFallback, setInviteFallback] = useState(false);
  const inviteUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (inviteUrlRef.current) URL.revokeObjectURL(inviteUrlRef.current);
    };
  }, []);

  function openTonight() {
    trackEvent(
      "tonight_card_open",
      { shop_id: shop.id, locale: language },
      { dedupeKey: `tonight_card_open:${shop.id}:${language}` },
    );
    setSheet("tonight");
  }

  async function handleInviteClick() {
    trackEvent(
      "invite_open",
      { shop_id: shop.id, locale: language },
      { dedupeKey: `invite_open:${shop.id}:${language}` },
    );
    setInviteCopied(false);
    setInviteFallback(false);
    setInviteBlob(null);
    if (inviteUrlRef.current) {
      URL.revokeObjectURL(inviteUrlRef.current);
      inviteUrlRef.current = null;
      setInviteUrl(null);
    }
    setSheet("invite");
    const origin = window.location.origin;
    const text = inviteShareText({
      shop,
      language,
      cardUrl: tonightCardUrl(shop.id, language, origin),
    });
    const blob = await mintInviteImage(shop.id, language, photo);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    inviteUrlRef.current = url;
    setInviteBlob(blob);
    setInviteUrl(url);
    const result = await deliverBoth(
      blob,
      tonightFilename(shop.id),
      text,
      () => setInviteCopied(true),
      () => setInviteFallback(true),
    );
    if (result === "cancelled") return;
    trackEvent("invite_share", {
      shop_id: shop.id,
      locale: language,
      channel: "system",
    });
  }

  const tonightClass =
    variant === "passport"
      ? "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam"
      : "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam";
  const inviteClass = SHOW_TONIGHT_CARD
    ? variant === "passport"
      ? "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-gold px-3 text-sm text-gold hover:bg-passport-wash"
      : "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border border-gold px-3 text-sm text-gold hover:bg-passport-wash"
    : variant === "passport"
      ? "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam"
      : "inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam";

  return (
    <>
      <div className="flex items-center gap-2">
        {SHOW_TONIGHT_CARD ? (
          <button
            type="button"
            className={tonightClass}
            onClick={openTonight}
            lang={language}
          >
            {copy.tonightCard[language]}
          </button>
        ) : null}
        <button
          type="button"
          className={inviteClass}
          onClick={() => {
            void handleInviteClick();
          }}
          lang={language}
        >
          {copy.inviteCta[language]}
        </button>
      </div>
      {SHOW_TONIGHT_CARD && sheet === "tonight" ? (
        <TonightSheet
          shop={shop}
          language={language}
          photo={photo}
          variant={variant}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "invite" ? (
        <InviteSheet
          shop={shop}
          language={language}
          photo={photo}
          variant={variant}
          imageBlob={inviteBlob}
          imageUrl={inviteUrl}
          copied={inviteCopied}
          fallback={inviteFallback}
          onCopied={() => setInviteCopied(true)}
          onFallback={() => setInviteFallback(true)}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </>
  );
}

function TonightSheet({
  shop,
  language,
  photo,
  variant,
  onClose,
}: {
  shop: ViralShareShop;
  language: Language;
  photo: string | null;
  variant: "passport" | "thin";
  onClose: () => void;
}) {
  const [line, setLine] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [limited, setLimited] = useState(false);
  const [copied, setCopied] = useState(false);
  const dir = language === "ar" ? "rtl" : "ltr";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const cardUrl = tonightCardUrl(shop.id, language, origin);
  const cleanLine = sanitizeTonightLine(line);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  async function mint(): Promise<Blob | null> {
    const store = sessionStore();
    if (!store || !canMintTonight(shop.id, Date.now(), store)) {
      setLimited(true);
      return null;
    }
    setBusy(true);
    setLimited(false);
    try {
      const path = tonightImagePath(shop.id, {
        locale: language,
        line: cleanLine,
        photo: photo ?? undefined,
      });
      const response = await fetch(path);
      if (!response.ok) return null;
      const blob = await response.blob();
      recordTonightMint(shop.id, Date.now(), store);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageBlob(blob);
      setImageUrl(URL.createObjectURL(blob));
      trackEvent(
        "tonight_card_mint",
        { shop_id: shop.id, locale: language },
        { dedupeKey: `tonight_card_mint:${shop.id}:${cleanLine}` },
      );
      return blob;
    } finally {
      setBusy(false);
    }
  }

  const text = tonightShareText({
    shop,
    language,
    cardUrl,
    line: cleanLine,
  });

  return (
    <ShareSheet
      language={language}
      variant={variant}
      title={copy.tonightCard[language]}
      hint={copy.tonightHint[language]}
      onClose={onClose}
    >
      <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
        {copy.tonightEyebrow[language]}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{copy.tonightEphemeral[language]}</p>
      {imageUrl ? (
        // Full minted 9:16 card — contain, never crop the overlay/watermark.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="mx-auto mt-4 max-h-[min(46vh,22rem)] w-auto rounded-2xl"
        />
      ) : (
        <TonightPreview shop={shop} language={language} photo={photo} line={cleanLine} />
      )}
      <label className="mt-4 block text-[11px] text-ink-soft" htmlFor={`tonight-line-${shop.id}`}>
        {copy.tonightHint[language]}
      </label>
      <textarea
        id={`tonight-line-${shop.id}`}
        value={line}
        maxLength={TONIGHT_LINE_MAX}
        rows={2}
        dir={dir}
        placeholder={copy.tonightPlaceholder[language]}
        onChange={(event) => {
          setLine(event.target.value);
          setImageBlob(null);
          if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
            setImageUrl(null);
          }
        }}
        className="mt-1 w-full rounded-2xl border border-line bg-foam px-3 py-2 text-sm leading-6"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void mint();
        }}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam disabled:opacity-60"
      >
        {busy ? copy.looking[language] : copy.tonightMint[language]}
      </button>
      {limited ? (
        <p className="mt-2 text-sm text-ink-soft">{copy.tonightRateLimited[language]}</p>
      ) : null}
      {imageUrl ? (
        <p className="mt-2 text-sm text-ink-soft">{copy.tonightReady[language]}</p>
      ) : null}
      <ShareCopy text={text} />
      <QuietShareExtras
        language={language}
        shopId={shop.id}
        text={text}
        imageBlob={imageBlob}
        filename={tonightFilename(shop.id)}
        event="tonight_card_share"
        copied={copied}
        fallback={false}
        onCopied={() => setCopied(true)}
        ensureImage={async () => imageBlob ?? mint()}
      />
    </ShareSheet>
  );
}

function InviteSheet({
  shop,
  language,
  photo,
  variant,
  imageBlob,
  imageUrl,
  copied,
  fallback,
  onCopied,
  onFallback,
  onClose,
}: {
  shop: ViralShareShop;
  language: Language;
  photo: string | null;
  variant: "passport" | "thin";
  imageBlob: Blob | null;
  imageUrl: string | null;
  copied: boolean;
  fallback: boolean;
  onCopied: () => void;
  onFallback: () => void;
  onClose: () => void;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const cardUrl = tonightCardUrl(shop.id, language, origin);
  const text = inviteShareText({ shop, language, cardUrl });

  return (
    <ShareSheet
      language={language}
      variant={variant}
      title={copy.inviteTitle[language]}
      hint={copy.inviteHint[language]}
      onClose={onClose}
    >
      {imageUrl ? (
        // Minted story card — branded image travels with the invite copy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="mx-auto max-h-[min(46vh,22rem)] w-auto rounded-2xl"
        />
      ) : (
        <TonightPreview shop={shop} language={language} photo={photo} line="" />
      )}
      <ShareCopy text={text} />
      <QuietShareExtras
        language={language}
        shopId={shop.id}
        text={text}
        imageBlob={imageBlob}
        filename={tonightFilename(shop.id)}
        event="invite_share"
        copied={copied}
        fallback={fallback}
        onCopied={onCopied}
        onFallback={onFallback}
        ensureImage={async () => imageBlob}
      />
    </ShareSheet>
  );
}

function ShareSheet({
  language,
  variant,
  title,
  hint,
  onClose,
  children,
}: {
  language: Language;
  variant: "passport" | "thin";
  title: string;
  hint: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dir = language === "ar" ? "rtl" : "ltr";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/55 p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={copy.tonightClose[language]}
        onClick={onClose}
      />
      <section
        className={
          variant === "passport"
            ? "relative z-10 max-h-[min(92dvh,52rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-gold/35 bg-foam px-5 py-5 text-ink shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
            : "relative z-10 max-h-[min(92dvh,52rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-line bg-foam px-5 py-5 text-ink shadow-[0_12px_40px_rgba(28,20,16,0.12)]"
        }
        dir={dir}
        lang={language}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink-soft underline-offset-2 hover:underline"
          >
            {copy.tonightClose[language]}
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}

function TonightPreview({
  shop,
  language,
  photo,
  line,
}: {
  shop: ViralShareShop;
  language: Language;
  photo: string | null;
  line: string;
}) {
  const area = tonightDistrict(shop, language);
  const hero = photo ?? shop.photoUrl ?? shop.logoUrl;
  return (
    <div className="relative mx-auto mt-4 aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-2xl bg-passport-wash text-foam">
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-serif text-2xl tracking-[0.16em] text-gold-deep">
          {TONIGHT_WATERMARK}
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-charcoal/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 via-charcoal/55 to-transparent px-4 pb-4 pt-16">
        <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
          {copy.tonightEyebrow[language]}
        </p>
        <p className="mt-1 font-serif text-xl font-semibold text-foam">{shop.nameEn}</p>
        <p className="mt-1 text-sm text-passport-wash" dir="rtl">
          {shop.nameAr}
        </p>
        <p className="mt-3 inline-flex rounded-full border border-gold bg-charcoal/40 px-2.5 py-0.5 text-[11px] text-gold">
          {area}
        </p>
        {line ? <p className="mt-3 text-sm leading-6 text-foam">{line}</p> : null}
        <p className="mt-4 font-serif text-base tracking-[0.16em] text-gold">
          {TONIGHT_WATERMARK}
        </p>
      </div>
    </div>
  );
}

function ShareCopy({ text }: { text: string }) {
  return (
    <div className="mt-4">
      <p className="rounded-2xl bg-passport-wash px-3 py-3 text-sm leading-6 whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

async function mintInviteImage(
  shopId: string,
  language: Language,
  photo: string | null,
): Promise<Blob | null> {
  const store = sessionStore();
  if (!store || !canMintTonight(shopId, Date.now(), store)) return null;
  const path = tonightImagePath(shopId, {
    locale: language,
    photo: photo ?? undefined,
  });
  const response = await fetch(path);
  if (!response.ok) return null;
  const blob = await response.blob();
  recordTonightMint(shopId, Date.now(), store);
  return blob;
}

async function deliverBoth(
  blob: Blob,
  filename: string,
  text: string,
  onCopied: () => void,
  onFallback: () => void,
): Promise<"shared" | "fallback" | "cancelled"> {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const payload = { files: [file], text };
  if (typeof navigator.share === "function") {
    const allowed =
      typeof navigator.canShare !== "function" ||
      canShareImageAndText(
        (data) => navigator.canShare?.(data) === true,
        payload,
      );
    if (allowed) {
      try {
        await navigator.share(payload);
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return "cancelled";
        }
      }
    }
  }
  downloadBlob(blob, filename);
  try {
    await navigator.clipboard.writeText(text);
    onCopied();
  } catch {
    /* image still downloaded */
  }
  onFallback();
  return "fallback";
}

function QuietShareExtras({
  language,
  shopId,
  text,
  imageBlob,
  filename,
  event,
  copied,
  fallback,
  onCopied,
  onFallback,
  ensureImage,
}: {
  language: Language;
  shopId: string;
  text: string;
  imageBlob: Blob | null;
  filename: string;
  event: "tonight_card_share" | "invite_share";
  copied: boolean;
  fallback: boolean;
  onCopied: () => void;
  onFallback?: () => void;
  ensureImage: () => Promise<Blob | null>;
}) {
  async function onDownload() {
    const blob = imageBlob ?? (await ensureImage());
    if (!blob) return;
    downloadBlob(blob, filename);
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      /* image still downloaded */
    }
    onFallback?.();
    trackEvent(event, {
      shop_id: shopId,
      locale: language,
      channel: "download",
    });
  }

  async function onCopy() {
    const blob = imageBlob ?? (await ensureImage());
    if (!blob) return;
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
      trackEvent(event, {
        shop_id: shopId,
        locale: language,
        channel: "copy",
      });
    } catch {
      /* stay quiet */
    }
  }

  return (
    <div className="mt-4">
      <p className="text-center text-[11px] leading-5 text-ink-soft">
        <button
          type="button"
          onClick={() => {
            void onDownload();
          }}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          {copy.tonightDownload[language]}
        </button>
        <span aria-hidden="true"> · </span>
        <button
          type="button"
          onClick={() => {
            void onCopy();
          }}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          {copy.tonightCopyLink[language]}
        </button>
      </p>
      {copied ? (
        <p className="mt-2 text-center text-[11px] text-ink-soft">
          {copy.packetCopied[language]}
        </p>
      ) : null}
      {fallback ? (
        <p className="mt-2 text-center text-sm text-gold-deep">
          {copy.tonightFallback[language]}
        </p>
      ) : null}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
