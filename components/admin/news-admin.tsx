"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImagePlus, Languages, Loader2, Newspaper, Save, Trash2, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, localeLabels, locales, type Locale } from "@/lib/i18n/config";

type ContentStatus = "draft" | "published" | "archived";

type NewsTranslationRow = {
  language_code: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
};

type NewsRow = {
  id: string;
  status: ContentStatus;
  published_at: string | null;
  expires_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  news_translations: NewsTranslationRow[];
};

type NewsForm = {
  id?: string;
  locale: Locale;
  status: ContentStatus;
  publishedAt: string;
  expiresAt: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  coverImageAlt: string;
};

function createEmptyForm(locale: Locale): NewsForm {
  return {
    locale,
    status: "published",
    publishedAt: "",
    expiresAt: "",
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    coverImageUrl: "",
    coverImageAlt: "",
  };
}

export function NewsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const copy = getCopy(initialLocale);
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<NewsRow[]>([]);
  const [form, setForm] = useState<NewsForm>(() => createEmptyForm(initialLocale));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadNews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("news")
      .select(
        "id,status,published_at,expires_at,cover_image_url,cover_image_alt,news_translations(language_code,title,slug,excerpt,body)",
      )
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) {
      setMessage(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as NewsRow[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void loadNews();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadNews();
      } else {
        setItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadNews, supabase]);

  function hydrateForm(item: NewsRow, locale: Locale): NewsForm {
    const translation =
      item.news_translations.find((entry) => entry.language_code === locale) ??
      item.news_translations[0];

    return {
      id: item.id,
      locale,
      status: item.status,
      publishedAt: toDateTimeInput(item.published_at),
      expiresAt: toDateTimeInput(item.expires_at),
      title: translation?.title ?? "",
      slug: translation?.slug ?? "",
      excerpt: translation?.excerpt ?? "",
      body: translation?.body ?? "",
      coverImageUrl: item.cover_image_url ?? "",
      coverImageAlt: item.cover_image_alt ?? "",
    };
  }

  async function saveNews() {
    setSaving(true);
    setMessage("");

    const payload = {
      status: form.status,
      published_at: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString(),
      expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      cover_image_url: form.coverImageUrl || null,
      cover_image_alt: form.coverImageAlt || null,
    };

    const result = form.id
      ? await supabase.from("news").update(payload).eq("id", form.id).select("id").single()
      : await supabase.from("news").insert(payload).select("id").single();

    if (result.error || !result.data) {
      setMessage(result.error?.message ?? copy.saveError);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("news_translations").upsert(
      {
        news_id: result.data.id,
        language_code: form.locale,
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        body: form.body || null,
      },
      { onConflict: "news_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(copy.saved);
    setForm(createEmptyForm(form.locale));
    await loadNews();
    setSaving(false);
  }

  async function deleteNews(id: string) {
    const { error } = await supabase.from("news").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (form.id === id) {
      setForm(createEmptyForm(form.locale));
    }

    setMessage(copy.deleted);
    await loadNews();
  }

  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImage);
      return;
    }

    setUploading(true);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.8,
      maxBytes: 550 * 1024,
      outputType: "image/webp",
      fileNameBase: file.name,
    });
    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(file.lastModified);
    const safeName = slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || "news-cover";
    const storagePath = `news/${uniqueId}-${safeName}.${extension}`;

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

    const { data } = supabase.storage.from("public-media").getPublicUrl(storagePath);
    setForm((current) => ({ ...current, coverImageUrl: data.publicUrl }));
    setUploading(false);
  }

  async function translateToAllLanguages() {
    if (!form.id) {
      setMessage(copy.saveBeforeTranslate);
      return;
    }

    setTranslating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/translate-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: form.id,
          sourceLocale: form.locale,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      setMessage(result.message ?? result.error ?? copy.translated);
      await loadNews();
    } catch {
      setMessage(copy.translateConnectionError);
    } finally {
      setTranslating(false);
    }
  }

  if (!session) {
    return (
      <section className="mt-8 border border-[var(--line)] bg-white p-5">
        <div className="flex items-start gap-3">
          <Newspaper size={22} className="mt-1 text-[var(--accent)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">CMS</p>
            <h2 className="mt-2 text-2xl font-semibold">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{copy.loginFirst}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-start gap-3">
          <Newspaper size={22} className="mt-1 text-[var(--accent)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">CMS</p>
            <h2 className="mt-2 text-2xl font-semibold">{copy.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy.intro}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {loading ? <p className="text-sm text-[var(--muted)]">{copy.loading}</p> : null}
          {!loading && items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.empty}</p>
          ) : null}
          {items.map((item) => {
            const translation =
              item.news_translations.find((entry) => entry.language_code === form.locale) ??
              item.news_translations[0];
            return (
              <article key={item.id} className="border border-[var(--line)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {item.status}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{translation?.title ?? copy.untitled}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDate(item.published_at, form.locale)}
                      {item.expires_at ? ` - ${copy.expires}: ${formatDate(item.expires_at, form.locale)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(hydrateForm(item, form.locale))}
                      className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                    >
                      {copy.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteNews(item.id)}
                      className="border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                    >
                      {copy.delete}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article className="border border-[var(--line)] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            {copy.language}
            <select
              value={form.locale}
              onChange={(event) => {
                const nextLocale = event.target.value as Locale;
                if (form.id) {
                  const item = items.find((entry) => entry.id === form.id);
                  setForm(item ? hydrateForm(item, nextLocale) : { ...form, locale: nextLocale });
                } else {
                  setForm((current) => ({ ...current, locale: nextLocale }));
                }
              }}
              className="border border-[var(--line)] px-3 py-2 font-normal"
            >
              {locales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeLabels[locale]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            {copy.status}
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ContentStatus }))}
              className="border border-[var(--line)] px-3 py-2 font-normal"
            >
              <option value="draft">{copy.draft}</option>
              <option value="published">{copy.published}</option>
              <option value="archived">{copy.archived}</option>
            </select>
          </label>

          <TextInput label={copy.publishedAt} type="datetime-local" value={form.publishedAt} onChange={(value) => setForm((current) => ({ ...current, publishedAt: value }))} />
          <TextInput label={copy.expiresAt} type="datetime-local" value={form.expiresAt} onChange={(value) => setForm((current) => ({ ...current, expiresAt: value }))} />
        </div>

        <div className="mt-4 grid gap-4">
          <TextInput label={copy.newsTitle} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value, slug: current.slug || slugify(value) }))} />
          <TextInput label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: slugify(value) }))} />
          <TextArea label={copy.excerptLabel} value={form.excerpt} onChange={(value) => setForm((current) => ({ ...current, excerpt: value }))} />
          <TextArea label={copy.body} rows={10} value={form.body} onChange={(value) => setForm((current) => ({ ...current, body: value }))} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="grid gap-2 text-sm font-semibold">
            <span>{copy.coverImage}</span>
            <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
              {form.coverImageUrl ? (
                <div className="relative mb-3 h-44 overflow-hidden border border-[var(--line)] bg-white">
                  <Image
                    src={form.coverImageUrl}
                    alt={form.coverImageAlt || form.title || copy.coverImage}
                    fill
                    sizes="(min-width: 1024px) 360px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {copy.noImage}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {form.coverImageUrl ? copy.changeImage : copy.uploadImage}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) {
                        void uploadCover(file);
                      }
                    }}
                  />
                </label>
                {form.coverImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, coverImageUrl: "", coverImageAlt: "" }))}
                    className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                  >
                    <X size={16} />
                    {copy.removeImage}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <TextInput label={copy.imageAlt} value={form.coverImageAlt} onChange={(value) => setForm((current) => ({ ...current, coverImageAlt: value }))} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveNews()}
            disabled={saving || !form.title}
            className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {copy.save}
          </button>
          <button
            type="button"
            onClick={() => void translateToAllLanguages()}
            disabled={translating || !form.id}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold disabled:opacity-50"
          >
            {translating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
            {copy.translateAll}
          </button>
          <button
            type="button"
            onClick={() => setForm(createEmptyForm(form.locale))}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold"
          >
            <Trash2 size={16} />
            {copy.newItem}
          </button>
          {message ? <p className="text-sm font-semibold text-[var(--accent)]">{message}</p> : null}
        </div>
      </article>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function toDateTimeInput(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return locale === "es" ? "Sin fecha" : "No date";
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function getCopy(locale: Locale) {
  const es = locale === "es";
  return {
    title: es ? "Noticias y archivo" : "News and archive",
    intro: es
      ? "Crea noticias con imagen, fecha de publicacion y fecha de caducidad. Cuando caduquen pasaran al archivo automaticamente."
      : "Create news items with image, publication date, and expiry date. Once they expire, they move to the archive automatically.",
    loginFirst: es ? "Entra primero en el admin para editar noticias." : "Sign in to admin first to edit news.",
    loading: es ? "Cargando noticias..." : "Loading news...",
    empty: es ? "Todavia no hay noticias creadas en el CMS." : "There are no news items created in the CMS yet.",
    untitled: es ? "Noticia sin titulo" : "Untitled news",
    expires: es ? "Caduca" : "Expires",
    edit: es ? "Editar" : "Edit",
    delete: es ? "Eliminar" : "Delete",
    language: es ? "Idioma" : "Language",
    status: es ? "Estado" : "Status",
    draft: es ? "Borrador" : "Draft",
    published: es ? "Publicado" : "Published",
    archived: es ? "Archivado" : "Archived",
    publishedAt: es ? "Publicacion" : "Publication",
    expiresAt: es ? "Caducidad" : "Expiry",
    newsTitle: es ? "Titulo" : "Title",
    excerptLabel: es ? "Resumen" : "Excerpt",
    body: es ? "Cuerpo de la noticia" : "News body",
    coverImage: es ? "Imagen destacada" : "Featured image",
    noImage: es ? "Sin imagen" : "No image",
    uploadImage: es ? "Subir imagen" : "Upload image",
    changeImage: es ? "Cambiar imagen" : "Change image",
    removeImage: es ? "Quitar imagen" : "Remove image",
    imageAlt: es ? "Texto alternativo de imagen" : "Image alt text",
    save: es ? "Guardar noticia" : "Save news",
    translateAll: es ? "Traducir a todos los idiomas" : "Translate to all languages",
    newItem: es ? "Nueva noticia" : "New news item",
    saved: es ? "Noticia guardada." : "News item saved.",
    deleted: es ? "Noticia eliminada." : "News item deleted.",
    translated: es ? "Traduccion completada." : "Translation completed.",
    saveError: es ? "No se pudo guardar la noticia." : "The news item could not be saved.",
    selectImage: es ? "Selecciona un archivo de imagen." : "Select an image file.",
    saveBeforeTranslate: es ? "Guarda primero la noticia antes de traducirla." : "Save the news item before translating it.",
    translateConnectionError: es ? "No se pudo conectar con el servicio de traduccion." : "Could not connect to the translation service.",
  };
}
