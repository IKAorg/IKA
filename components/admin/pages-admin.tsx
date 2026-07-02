"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilePenLine, Loader2, Save } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n/config";
import type { PublicPageKey } from "@/lib/i18n/public-pages";

type ContentStatus = "draft" | "published" | "archived";

type PageTranslationRow = {
  language_code: Locale;
  title: string;
  slug: string;
  summary: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type PageRow = {
  id: string;
  page_key: PublicPageKey;
  status: ContentStatus;
  template_key: string;
  page_translations: PageTranslationRow[];
};

const editablePages: Array<{ key: PublicPageKey; label: string }> = [
  { key: "about", label: "About IKA" },
  { key: "philosophy", label: "Philosophy" },
  { key: "countries", label: "Countries" },
  { key: "dojos", label: "Dojos" },
  { key: "news", label: "News" },
  { key: "events", label: "Events" },
  { key: "join", label: "Join IKA" },
  { key: "contact", label: "Contact" },
  { key: "portal", label: "Portal" },
];

const editableLocales: Array<{ key: Locale; label: string }> = [
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
  { key: "it", label: "Italiano" },
  { key: "fr", label: "Français" },
  { key: "ja", label: "日本語" },
  { key: "zh", label: "中文" },
  { key: "cs", label: "Čeština" },
];

type PageForm = {
  pageId?: string;
  status: ContentStatus;
  pageKey: PublicPageKey;
  locale: Locale;
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
};

const defaultForm: PageForm = {
  status: "published",
  pageKey: "about",
  locale: "es",
  title: "",
  slug: "about",
  summary: "",
  seoTitle: "",
  seoDescription: "",
};

export function PagesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [form, setForm] = useState<PageForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select(
        "id,page_key,status,template_key,page_translations(language_code,title,slug,summary,seo_title,seo_description)",
      )
      .order("page_key", { ascending: true });

    if (error) {
      setMessage(error.message);
      setPages([]);
    } else {
      const rows = (data ?? []) as PageRow[];
      setPages(rows);
      setForm((current) =>
        hydratePageForm(current, rows, current.pageKey, current.locale),
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void loadPages();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadPages();
      } else {
        setPages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPages, supabase]);

  async function savePage() {
    setSaving(true);
    setMessage("");

    const pageResult = form.pageId
      ? await supabase
          .from("pages")
          .update({
            status: form.status,
            template_key: "default",
            published_at: form.status === "published" ? new Date().toISOString() : null,
          })
          .eq("id", form.pageId)
          .select("id")
          .single()
      : await supabase
          .from("pages")
          .insert({
            page_key: form.pageKey,
            status: form.status,
            template_key: "default",
            published_at: form.status === "published" ? new Date().toISOString() : null,
          })
          .select("id")
          .single();

    if (pageResult.error || !pageResult.data) {
      setMessage(pageResult.error?.message ?? "No se pudo guardar la página.");
      setSaving(false);
      return;
    }

    const pageId = pageResult.data.id as string;
    const { error } = await supabase.from("page_translations").upsert(
      {
        page_id: pageId,
        language_code: form.locale,
        title: form.title,
        slug: form.slug || slugify(form.title || form.pageKey),
        summary: form.summary || null,
        seo_title: form.seoTitle || null,
        seo_description: form.seoDescription || null,
      },
      { onConflict: "page_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Página guardada.");
    await loadPages();
    setSaving(false);
  }

  if (!session) {
    return (
      <section className="mt-8 border border-[var(--line)] bg-white p-5">
        <div className="flex items-start gap-3">
          <FilePenLine size={22} className="mt-1 text-[var(--accent)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              CMS
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Páginas públicas</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Entra primero en el admin para editar páginas.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 border border-[var(--line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <FilePenLine size={22} className="mt-1 text-[var(--accent)]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            CMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Páginas públicas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Edita el título, entradilla y SEO de cada sección pública. Las
            páginas publicadas se leen desde Supabase y se actualizan sin
            redeploy.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Página
          <select
            value={form.pageKey}
            onChange={(event) =>
              setForm((current) =>
                hydratePageForm(
                  {
                    ...current,
                    pageKey: event.target.value as PublicPageKey,
                    slug: event.target.value,
                  },
                  pages,
                  event.target.value as PublicPageKey,
                  current.locale,
                ),
              )
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            {editablePages.map((page) => (
              <option key={page.key} value={page.key}>
                {page.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Idioma
          <select
            value={form.locale}
            onChange={(event) =>
              setForm((current) =>
                hydratePageForm(
                  {
                    ...current,
                    locale: event.target.value as Locale,
                  },
                  pages,
                  current.pageKey,
                  event.target.value as Locale,
                ),
              )
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            {editableLocales.map((locale) => (
              <option key={locale.key} value={locale.key}>
                {locale.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Estado
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as ContentStatus,
              }))
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </label>

        <TextInput
          label="Slug"
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({ ...current, slug: slugify(value) }))
          }
        />

        <div className="lg:col-span-2">
          <TextInput
            label="Título público"
            value={form.title}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                title: value,
                slug: current.slug || slugify(value),
              }))
            }
          />
        </div>

        <div className="lg:col-span-2">
          <TextArea
            label="Entradilla / resumen visible"
            value={form.summary}
            onChange={(value) =>
              setForm((current) => ({ ...current, summary: value }))
            }
          />
        </div>

        <TextInput
          label="SEO title"
          value={form.seoTitle}
          onChange={(value) =>
            setForm((current) => ({ ...current, seoTitle: value }))
          }
        />

        <TextInput
          label="SEO description"
          value={form.seoDescription}
          onChange={(value) =>
            setForm((current) => ({ ...current, seoDescription: value }))
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={savePage}
          disabled={saving || loading || !form.title || !form.slug}
          className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar página
        </button>
        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
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

function hydratePageForm(
  current: PageForm,
  pages: PageRow[],
  pageKey: PublicPageKey,
  locale: Locale,
): PageForm {
  const page = pages.find((item) => item.page_key === pageKey);
  const translation = page?.page_translations.find(
    (item) => item.language_code === locale,
  );

  return {
    ...current,
    pageKey,
    locale,
    pageId: page?.id,
    status: page?.status ?? current.status,
    title: translation?.title ?? "",
    slug: translation?.slug ?? pageKey,
    summary: translation?.summary ?? "",
    seoTitle: translation?.seo_title ?? "",
    seoDescription: translation?.seo_description ?? "",
  };
}
