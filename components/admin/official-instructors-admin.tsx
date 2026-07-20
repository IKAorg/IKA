"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ImagePlus,
  Languages,
  Loader2,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { adminLocales } from "@/lib/admin/admin-locales";
import {
  getChiefInstructorCopy,
  getOfficialInstructorsAdminCopy,
} from "@/lib/admin/official-instructors-copy";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type InstructorRow = {
  id: string;
  full_name: string;
  grade: string | null;
  country_name: string;
  chief_note: string | null;
  chief_note_translations?: Partial<Record<Locale, { note: string }>> | null;
  photo_url: string | null;
  photo_alt: string | null;
  sort_order: number;
  is_visible: boolean;
  is_chief_instructor: boolean;
};

type InstructorForm = {
  id?: string;
  fullName: string;
  grade: string;
  countryName: string;
  chiefNoteTranslations: Partial<Record<Locale, { note: string }>>;
  photoUrl: string;
  photoAlt: string;
  sortOrder: string;
  isVisible: boolean;
  isChiefInstructor: boolean;
};

function createEmptyForm(): InstructorForm {
  return {
    fullName: "",
    grade: "",
    countryName: "",
    chiefNoteTranslations: {},
    photoUrl: "",
    photoAlt: "",
    sortOrder: "100",
    isVisible: true,
    isChiefInstructor: false,
  };
}

export function OfficialInstructorsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const copy = useMemo(() => getOfficialInstructorsAdminCopy(initialLocale), [initialLocale]);
  const chiefCopy = useMemo(
    () => getChiefInstructorCopy(initialLocale),
    [initialLocale],
  );
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<InstructorRow[]>([]);
  const [form, setForm] = useState<InstructorForm>(createEmptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [chiefNoteLocale, setChiefNoteLocale] = useState<Locale>(initialLocale);
  const [message, setMessage] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("official_instructors")
      .select("id,full_name,grade,country_name,chief_note,chief_note_translations,photo_url,photo_alt,sort_order,is_visible,is_chief_instructor")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setItems([]);
      setMessage(error.message);
    } else {
      setItems((data ?? []) as InstructorRow[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void loadItems();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadItems();
      } else {
        setItems([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadItems, supabase]);

  async function saveInstructor() {
    if (!form.fullName.trim() || !form.countryName.trim()) {
      setMessage(copy.required);
      return;
    }

    setSaving(true);
    setMessage("");

    const chiefNoteTranslations = form.chiefNoteTranslations;
    const legacyChiefNote =
      chiefNoteTranslations.es?.note ||
      chiefNoteTranslations.en?.note ||
      Object.values(chiefNoteTranslations)[0]?.note ||
      null;

    const payload = {
      full_name: form.fullName.trim(),
      grade: form.grade.trim() || null,
      country_name: form.countryName.trim(),
      chief_note: form.isChiefInstructor ? legacyChiefNote : null,
      chief_note_translations: form.isChiefInstructor ? chiefNoteTranslations : {},
      photo_url: form.photoUrl.trim() || null,
      photo_alt: form.photoAlt.trim() || null,
      sort_order: Number.parseInt(form.sortOrder, 10) || 100,
      is_visible: form.isVisible,
      is_chief_instructor: form.isChiefInstructor,
    };

    if (form.isChiefInstructor) {
      const resetChief = await supabase
        .from("official_instructors")
        .update({ is_chief_instructor: false })
        .neq("id", form.id ?? "00000000-0000-0000-0000-000000000000")
        .eq("is_chief_instructor", true);

      if (resetChief.error) {
        setMessage(resetChief.error.message);
        setSaving(false);
        return;
      }
    }

    const query = form.id
      ? supabase.from("official_instructors").update(payload).eq("id", form.id)
      : supabase.from("official_instructors").insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(form.id ? copy.updated : copy.created);
    setForm(createEmptyForm());
    await loadItems();
    setSaving(false);
  }

  async function deleteInstructor(id: string) {
    const { error } = await supabase
      .from("official_instructors")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (form.id === id) {
      setForm(createEmptyForm());
    }

    setMessage(copy.deleted);
    await loadItems();
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImage);
      return;
    }

    setUploading(true);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.78,
      maxBytes: 420 * 1024,
      outputType: "image/webp",
      fileNameBase: file.name,
    });

    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    const safeName = slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || "instructor";
    const storagePath = `official-instructors/${uniqueId}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("public-media")
      .upload(storagePath, optimizedFile, {
        cacheControl: "31536000",
        contentType: optimizedFile.type,
        upsert: true,
      });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("public-media")
      .getPublicUrl(storagePath);

    setForm((current) => ({
      ...current,
      photoUrl: data.publicUrl,
      photoAlt: current.photoAlt || current.fullName,
    }));
    setUploading(false);
  }

  async function translateChiefNoteFromSpanish() {
    const source = form.chiefNoteTranslations.es ?? { note: "" };

    if (!source.note.trim()) {
      setMessage(copy.chiefNoteNeedsSpanish);
      return;
    }

    setTranslating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/translate-chief-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocale: "es",
          source,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: string;
            translations?: Array<{ locale: Locale; note: string }>;
          }
        | null;

      if (!response.ok || !result?.translations) {
        throw new Error(result?.error ?? copy.chiefNoteTranslationFailed);
      }

      setForm((current) => {
        const nextTranslations = { ...current.chiefNoteTranslations };

        for (const item of result.translations ?? []) {
          nextTranslations[item.locale] = { note: item.note };
        }

        return {
          ...current,
          chiefNoteTranslations: nextTranslations,
        };
      });

      setMessage(copy.chiefNoteTranslationReady);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : copy.chiefNoteTranslationFailed,
      );
    } finally {
      setTranslating(false);
    }
  }

  const chiefNoteValue = form.chiefNoteTranslations[chiefNoteLocale]?.note ?? "";

  if (!session) {
    return (
      <section className="mt-8 border border-[var(--line)] bg-white p-5">
        <h2 className="text-2xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{copy.loginFirst}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 border border-[var(--line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <UserPlus size={22} className="mt-1 text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            CMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {copy.intro}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            {copy.name}
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              className="border border-[var(--line)] px-3 py-2 font-normal"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              {copy.grade}
              <input
                value={form.grade}
                onChange={(event) =>
                  setForm((current) => ({ ...current, grade: event.target.value }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {copy.country}
              <input
                value={form.countryName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    countryName: event.target.value,
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              {copy.order}
              <input
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {copy.visible}
              <select
                value={form.isVisible ? "yes" : "no"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isVisible: event.target.value === "yes",
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              >
                <option value="yes">{copy.yes}</option>
                <option value="no">{copy.no}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              {chiefCopy.label}
              <select
                value={form.isChiefInstructor ? "yes" : "no"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isChiefInstructor: event.target.value === "yes",
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              >
                <option value="no">{copy.no}</option>
                <option value="yes">{copy.yes}</option>
              </select>
            </label>
          </div>

          {form.isChiefInstructor ? (
            <div className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={translateChiefNoteFromSpanish}
                  disabled={translating || saving || uploading}
                  className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {translating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Languages size={16} />
                  )}
                  {copy.translateChiefNote}
                </button>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {copy.translateChiefNoteHelp}
                </p>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                {copy.language}
                <select
                  value={chiefNoteLocale}
                  onChange={(event) =>
                    setChiefNoteLocale(event.target.value as Locale)
                  }
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                >
                  {adminLocales.map((locale) => (
                    <option key={locale.value} value={locale.value}>
                      {locale.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                {copy.chiefNote}
                <textarea
                  rows={4}
                  value={chiefNoteValue}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      chiefNoteTranslations: {
                        ...current.chiefNoteTranslations,
                        [chiefNoteLocale]: {
                          note: event.target.value,
                        },
                      },
                    }))
                  }
                  className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-semibold">
            {copy.photoAlt}
            <input
              value={form.photoAlt}
              onChange={(event) =>
                setForm((current) => ({ ...current, photoAlt: event.target.value }))
              }
              className="border border-[var(--line)] px-3 py-2 font-normal"
            />
          </label>

          <div className="grid gap-2 text-sm font-semibold">
            <span>{copy.photo}</span>
            <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
              {form.photoUrl ? (
                <div className="relative mb-3 h-48 overflow-hidden border border-[var(--line)] bg-white">
                  <Image
                    src={form.photoUrl}
                    alt={form.photoAlt || form.fullName || copy.previewAlt}
                    fill
                    sizes="(min-width: 1280px) 420px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-32 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {copy.noPhoto}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {form.photoUrl ? copy.changePhoto : copy.uploadPhoto}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) {
                        void uploadPhoto(file);
                      }
                    }}
                  />
                </label>

                {form.photoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        photoUrl: "",
                      }))
                    }
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    <X size={16} />
                    {copy.removePhoto}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void saveInstructor()}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {form.id ? copy.saveChanges : copy.create}
            </button>
            <button
              type="button"
              onClick={() => setForm(createEmptyForm())}
              className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
            >
              <X size={16} />
              {copy.reset}
            </button>
          </div>

          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
          ) : null}
        </div>

        <div className="grid gap-4">
          <h3 className="text-xl font-semibold">{copy.listTitle}</h3>
          {loading ? (
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
              {copy.loading}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
              {copy.empty}
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex items-start gap-4">
                  {item.photo_url ? (
                    <Image
                      src={item.photo_url}
                      alt={item.photo_alt ?? item.full_name}
                      width={88}
                      height={88}
                      className="size-22 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="flex size-22 shrink-0 items-center justify-center bg-white text-xl font-semibold text-[var(--ink-blue)]">
                      {getInitials(item.full_name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold">{item.full_name}</h4>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.country_name}
                      {item.grade ? ` · ${item.grade}` : ""}
                    </p>
                    {item.is_chief_instructor ? (
                      <>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                          {chiefCopy.badge}
                        </p>
                        {(item.chief_note_translations?.es?.note ??
                          item.chief_note ??
                          Object.values(item.chief_note_translations ?? {})[0]?.note) ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {item.chief_note_translations?.es?.note ??
                              item.chief_note ??
                              Object.values(item.chief_note_translations ?? {})[0]?.note}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      {item.is_visible ? copy.published : copy.hidden}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: item.id,
                        fullName: item.full_name,
                        grade: item.grade ?? "",
                        countryName: item.country_name,
                        chiefNoteTranslations:
                          item.chief_note_translations && typeof item.chief_note_translations === "object"
                            ? item.chief_note_translations
                            : item.chief_note
                              ? { es: { note: item.chief_note } }
                              : {},
                        photoUrl: item.photo_url ?? "",
                        photoAlt: item.photo_alt ?? "",
                        sortOrder: String(item.sort_order),
                        isVisible: item.is_visible,
                        isChiefInstructor: item.is_chief_instructor,
                      })
                    }
                    className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    {copy.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteInstructor(item.id)}
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                  >
                    <Trash2 size={16} />
                    {copy.delete}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
