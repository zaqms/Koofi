"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { DocumentLocale } from "@/components/document-locale";
import { MapsLink } from "@/components/maps-link";
import type { PassportBrewingExtra, PassportOwnerFields } from "@/lib/claims-types";
import {
  copy,
  ownerEditErrorCopy,
  ownerEditSavedCountCopy,
  ownerEditUploadProgressCopy,
  ownerPhotoErrorCopy,
} from "@/lib/copy";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { cardPath, ownerEditPath, shopDisplayName } from "@/lib/product";
import { shopMapsHref } from "@/lib/public-url";
import type { Language, Shop } from "@/lib/types";

type OwnerEditProps = {
  language: Language;
  shop: Shop;
  token: string;
  passport: PassportOwnerFields;
};

export function OwnerEdit({ language, shop, token, passport }: OwnerEditProps) {
  const other: Language = language === "ar" ? "en" : "ar";
  const dir = language === "ar" ? "rtl" : "ltr";
  const area =
    language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood, "en");
  const [draft, setDraft] = useState<PassportOwnerFields>(() => ({
    ...passport,
    photos: asPhotoList(passport.photos),
  }));
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const photosRef = useRef(asPhotoList(passport.photos));
  const uploadsRef = useRef<UploadRow[]>([]);
  const filledPhotos = asPhotoList(draft.photos);
  const pendingUploads = uploads.filter((row) => row.status !== "done");
  const uploading = uploads.some(
    (row) => row.status === "queued" || row.status === "uploading",
  );
  const uploadStep = uploads.filter(
    (row) => row.status === "done" || row.status === "uploading",
  ).length;

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      for (const row of uploadsRef.current) {
        URL.revokeObjectURL(row.preview);
      }
    };
  }, []);

  function commitPhotos(photos: string[]) {
    const next = asPhotoList(photos);
    photosRef.current = next;
    setDraft((current) => ({ ...current, photos: next }));
  }

  useEffect(() => {
    photosRef.current = asPhotoList(draft.photos);
  }, [draft.photos]);

  const lockedName = shopDisplayName(shop, language);
  const mapsHref = shopMapsHref(shop);

  const extraRows = useMemo(
    () => (draft.brewingExtra.length > 0 ? draft.brewingExtra : [{ title: "", detail: "" }]),
    [draft.brewingExtra],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavedCount(null);
    setError(null);
    try {
      const fromDraft = asPhotoList(draft.photos);
      const fromRef = asPhotoList(photosRef.current);
      const photos = fromDraft.length >= fromRef.length ? fromDraft : fromRef;
      const res = await fetch("/api/owner/passport", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shop: shop.id,
          token,
          passport: {
            ...draft,
            photos,
            brewingNotes: draft.brewingNotes
              .map((item) => item.trim())
              .filter(Boolean),
            brewingExtra: draft.brewingExtra
              .map((item) => ({
                title: item.title.trim(),
                detail: item.detail.trim(),
              }))
              .filter((item) => item.title || item.detail),
          },
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        passport?: PassportOwnerFields;
      };
      if (!res.ok || !json.ok) {
        setError(
          json.error === "rate_limited"
            ? copy.feedbackRateLimited[language]
            : ownerEditErrorCopy(
                (json.error as
                  | "missing"
                  | "invalid"
                  | "expired"
                  | "revoked"
                  | "wrong_shop"
                  | "not_verified"
                  | "no_storage"
                  | "not_found") ?? "invalid",
                language,
              ),
        );
        return;
      }
      const savedPhotos = asPhotoList(json.passport?.photos);
      const nextPhotos = savedPhotos.length > 0 ? savedPhotos : photos;
      commitPhotos(nextPhotos);
      if (json.passport) {
        setDraft((current) => ({
          ...current,
          ...json.passport,
          photos: nextPhotos,
        }));
      }
      setSavedCount(nextPhotos.length);
    } catch {
      setError(copy.ownerNoStorage[language]);
    } finally {
      setSaving(false);
    }
  }

  async function onPickFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    setSavedCount(null);
    setError(null);
    const rows: UploadRow[] = picked.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      preview: URL.createObjectURL(file),
      status: "queued",
    }));
    setUploads((current) => {
      for (const row of current) {
        if (row.status !== "done") URL.revokeObjectURL(row.preview);
      }
      return rows;
    });

    let landedAny = false;
    for (const [index, file] of picked.entries()) {
      const rowId = rows[index].id;
      setUploads((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, status: "uploading" } : row,
        ),
      );
      try {
        const form = new FormData();
        form.set("shop", shop.id);
        form.set("token", token);
        form.append("files", file);
        form.append(`files-${index}`, file);
        const res = await fetch("/api/owner/photos", {
          method: "POST",
          body: form,
        });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          urls?: string[];
          passport?: PassportOwnerFields;
        };
        const savedPhotos = asPhotoList(json.passport?.photos);
        const urls = asPhotoList(json.urls);
        if (!res.ok || !json.ok || (savedPhotos.length === 0 && urls.length === 0)) {
          setUploads((current) =>
            current.map((row) =>
              row.id === rowId ? { ...row, status: "error" } : row,
            ),
          );
          setError(ownerPhotoErrorCopy(json.error ?? "invalid", language));
          continue;
        }
        landedAny = true;
        commitPhotos(
          savedPhotos.length > 0
            ? savedPhotos
            : [...photosRef.current, ...urls],
        );
        setUploads((current) => {
          const next = current.map((row) =>
            row.id === rowId ? { ...row, status: "done" as const } : row,
          );
          const done = next.find((row) => row.id === rowId);
          if (done) URL.revokeObjectURL(done.preview);
          return next;
        });
      } catch {
        setUploads((current) =>
          current.map((row) =>
            row.id === rowId ? { ...row, status: "error" } : row,
          ),
        );
        setError(copy.ownerEditNoBlob[language]);
      }
    }
    if (landedAny) setSavedCount(asPhotoList(photosRef.current).length);
  }

  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-md bg-charcoal px-3 py-4"
      dir={dir}
      lang={language}
    >
      <DocumentLocale language={language} />
      <article className="overflow-hidden rounded-[28px] border border-gold/35 bg-foam text-ink shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <header className="flex items-center justify-between gap-2 bg-charcoal px-4 py-3 text-[11px] text-foam">
          <Link href={cardPath(shop.id, language)} className="text-foam/90 hover:text-foam">
            {language === "en" ? "← " : null}
            {copy.ownerEditViewCard[language]}
            {language === "ar" ? " ←" : null}
          </Link>
          <p className="font-serif tracking-[0.14em] text-foam/90" dir="ltr">
            {copy.ownerEditTitle[language]}
          </p>
          <Link
            href={ownerEditPath(shop.id, token, other)}
            className="text-foam/80 underline-offset-2 hover:text-foam hover:underline"
          >
            {copy.switchLanguage[language]}
          </Link>
        </header>

        <form onSubmit={onSubmit} className="px-5 pb-5 pt-5">
          <section className="rounded-2xl border border-line bg-paper-deep/40 px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
              {copy.ownerEditLocked[language]}
            </p>
            <h1 className="mt-2 font-serif text-[1.65rem] leading-tight font-semibold">
              {shop.nameEn}
            </h1>
            <p className="mt-1 text-sm leading-6 text-ink-soft" dir="rtl">
              {shop.nameAr}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-gold px-2.5 py-1 text-[11px] leading-5 text-gold-deep">
                {area}
              </span>
              <span className="rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink-soft">
                {lockedName}
              </span>
            </div>
            <p className="mt-3 text-sm">
              <MapsLink
                href={mapsHref}
                shopId={shop.id}
                locale={language}
                source="card"
                className="text-gold underline-offset-2 hover:underline"
              >
                {copy.ownerEditPin[language]}
              </MapsLink>
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              {copy.ownerEditLead[language]}
            </p>
          </section>

          <FieldLabel>{copy.photosTab[language]}</FieldLabel>
          <p className="mt-1 text-[11px] leading-5 text-ink-soft">
            {copy.ownerEditPhotosHint[language]}
          </p>
          {filledPhotos.length > 0 || pendingUploads.length > 0 ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-gold-deep">
                <span>{copy.photosTab[language]}</span>
                <span dir="ltr">
                  1 / {filledPhotos.length + pendingUploads.length}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {filledPhotos.map((src, index) => (
                  <PhotoTile
                    key={`${src}-${index}`}
                    src={src}
                    status="done"
                    label={copy.ownerEditUploadDone[language]}
                  />
                ))}
                {pendingUploads.map((row) => (
                  <PhotoTile
                    key={row.id}
                    src={row.preview}
                    status={row.status}
                    label={
                      row.status === "error"
                        ? copy.ownerEditUploadFailed[language]
                        : copy.ownerEditUploading[language]
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-2 space-y-2">
            {(draft.photos.length > 0 ? draft.photos : [""]).map((photo, index) => (
              <div key={`photo-${index}`} className="flex gap-2">
                <input
                  value={photo}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      photos: replaceAt(current.photos, index, event.target.value, ""),
                    }))
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-foam px-3 text-sm"
                  dir="ltr"
                />
                <IconButton
                  label={copy.ownerEditRemove[language]}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      photos: current.photos.filter((_, item) => item !== index),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <AddButton
            onClick={() =>
              setDraft((current) => ({ ...current, photos: [...current.photos, ""] }))
            }
          >
            {copy.ownerEditAddUrl[language]}
          </AddButton>
        </form>
        <div className="px-5">
          <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-gold/50 bg-foam px-3 text-sm text-gold-deep hover:bg-passport-wash">
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={onPickFiles}
              className="sr-only"
            />
            {uploading
              ? ownerEditUploadProgressCopy(
                  Math.max(uploadStep, 1),
                  uploads.length,
                  language,
                )
              : copy.ownerEditUpload[language]}
          </label>
        </div>
        <form onSubmit={onSubmit} className="px-5 pb-5">

          <div className="mt-6 rounded-2xl border border-gold/40 bg-passport-wash px-4 py-4">
            <p className="text-[11px] tracking-[0.14em] text-gold uppercase">
              {copy.nowPouring[language]}
            </p>
            <label className="mt-3 block text-[11px] text-gold-deep">
              {copy.ownerEditBrewingTitle[language]}
            </label>
            <input
              value={draft.brewingTitle}
              onChange={(event) =>
                setDraft((current) => ({ ...current, brewingTitle: event.target.value }))
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gold/30 bg-foam px-3 font-serif text-base"
            />
            <label className="mt-3 block text-[11px] text-gold-deep">
              {copy.ownerEditBrewingDetail[language]}
            </label>
            <input
              value={draft.brewingDetail}
              onChange={(event) =>
                setDraft((current) => ({ ...current, brewingDetail: event.target.value }))
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gold/30 bg-foam px-3 text-sm"
            />
            <label className="mt-3 block text-[11px] text-gold-deep">
              {copy.ownerEditBrewingNotes[language]}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(draft.brewingNotes.length > 0 ? draft.brewingNotes : [""]).map(
                (note, index) => (
                  <div key={`note-${index}`} className="flex min-w-[7rem] flex-1 gap-1">
                    <input
                      value={note}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          brewingNotes: replaceAt(
                            current.brewingNotes,
                            index,
                            event.target.value,
                            "",
                          ),
                        }))
                      }
                      className="min-h-10 min-w-0 flex-1 rounded-full border border-gold/30 bg-foam px-3 text-[13px]"
                    />
                    <IconButton
                      label={copy.ownerEditRemove[language]}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          brewingNotes: current.brewingNotes.filter(
                            (_, item) => item !== index,
                          ),
                        }))
                      }
                    />
                  </div>
                ),
              )}
            </div>
            <AddButton
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  brewingNotes: [...current.brewingNotes, ""],
                }))
              }
            >
              {copy.ownerEditAdd[language]}
            </AddButton>
            <label className="mt-3 block text-[11px] text-gold-deep">
              {copy.ownerEditBrewingNote[language]}
            </label>
            <textarea
              value={draft.brewingNote}
              onChange={(event) =>
                setDraft((current) => ({ ...current, brewingNote: event.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-gold/30 bg-foam px-3 py-2 font-serif text-sm italic"
            />
            <p className="mt-4 text-[11px] text-gold-deep">
              {copy.ownerEditBrewingExtra[language]}
            </p>
            <div className="mt-2 space-y-2">
              {extraRows.map((item, index) => (
                <div key={`extra-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        brewingExtra: replaceExtra(
                          current.brewingExtra,
                          index,
                          "title",
                          event.target.value,
                        ),
                      }))
                    }
                    className="min-h-10 rounded-lg border border-gold/30 bg-foam px-3 font-serif text-sm"
                  />
                  <input
                    value={item.detail}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        brewingExtra: replaceExtra(
                          current.brewingExtra,
                          index,
                          "detail",
                          event.target.value,
                        ),
                      }))
                    }
                    className="min-h-10 rounded-lg border border-gold/30 bg-foam px-3 text-sm"
                  />
                  <IconButton
                    label={copy.ownerEditRemove[language]}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        brewingExtra: current.brewingExtra.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <AddButton
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  brewingExtra: [...current.brewingExtra, { title: "", detail: "" }],
                }))
              }
            >
              {copy.ownerEditAdd[language]}
            </AddButton>
          </div>

          <FieldLabel>{copy.ownerEditHours[language]}</FieldLabel>
          <p className="mt-1 text-[11px] leading-5 text-ink-soft">
            {copy.ownerEditHoursHint[language]}
          </p>
          <input
            value={draft.hours}
            onChange={(event) =>
              setDraft((current) => ({ ...current, hours: event.target.value }))
            }
            placeholder={copy.ownerEditHoursPlaceholder[language]}
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-foam px-3 text-sm"
          />

          <FieldLabel>{copy.ownerEditOffer[language]}</FieldLabel>
          <input
            value={draft.thinOffer}
            onChange={(event) =>
              setDraft((current) => ({ ...current, thinOffer: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-foam px-3 text-sm"
          />

          <FieldLabel>{copy.ownerEditPhone[language]}</FieldLabel>
          <input
            value={draft.phone}
            onChange={(event) =>
              setDraft((current) => ({ ...current, phone: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-foam px-3 text-sm"
            dir="ltr"
          />

          <FieldLabel>{copy.ownerEditIg[language]}</FieldLabel>
          <input
            value={draft.instagram}
            onChange={(event) =>
              setDraft((current) => ({ ...current, instagram: event.target.value }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-foam px-3 text-sm"
            dir="ltr"
          />

          {error ? (
            <p className="mt-4 text-sm leading-6 text-bean">{error}</p>
          ) : null}
          {savedCount !== null ? (
            <p className="mt-4 text-sm leading-6 text-gold-deep">
              {ownerEditSavedCountCopy(savedCount, language)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gold bg-passport-wash px-3 text-sm text-gold-deep hover:bg-foam disabled:opacity-60"
          >
            {copy.ownerEditSave[language]}
          </button>
        </form>
      </article>
    </main>
  );
}

type UploadRow = {
  id: string;
  name: string;
  preview: string;
  status: "queued" | "uploading" | "done" | "error";
};

function asPhotoList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function PhotoTile({
  src,
  status,
  label,
}: {
  src: string;
  status: "queued" | "uploading" | "done" | "error";
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-paper-deep">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="aspect-square w-full object-cover" />
      {status !== "done" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/50 px-1 text-center">
          {status === "error" ? (
            <span className="text-[11px] leading-4 text-foam">{label}</span>
          ) : (
            <>
              <span
                className="size-5 animate-spin rounded-full border-2 border-foam/30 border-t-foam"
                aria-hidden
              />
              <span className="mt-1 text-[10px] leading-4 text-foam">{label}</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mt-6 text-[11px] tracking-[0.14em] text-gold uppercase">
      {children}
    </p>
  );
}

function AddButton({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-[12px] text-gold hover:underline"
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="min-h-10 min-w-10 rounded-lg border border-line text-ink-soft"
    >
      ×
    </button>
  );
}

function replaceAt(list: string[], index: number, value: string, empty: string): string[] {
  const next = list.length > 0 ? [...list] : [empty];
  while (next.length <= index) next.push(empty);
  next[index] = value;
  return next;
}

function replaceExtra(
  list: PassportBrewingExtra[],
  index: number,
  key: "title" | "detail",
  value: string,
): PassportBrewingExtra[] {
  const next = list.length > 0 ? [...list] : [{ title: "", detail: "" }];
  while (next.length <= index) next.push({ title: "", detail: "" });
  next[index] = { ...next[index], [key]: value };
  return next;
}
