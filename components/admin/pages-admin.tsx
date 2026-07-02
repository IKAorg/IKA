"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FilePenLine, Languages, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n/config";
import {
  getAboutSections,
  getPublicPageContent,
  type PublicPageKey,
} from "@/lib/i18n/public-pages";

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
  content_blocks: ContentBlockRow[];
};

type ContentBlockRow = {
  id: string;
  language_code: Locale | null;
  block_type: string;
  sort_order: number;
  is_visible: boolean;
  data: {
    title?: string;
    text?: string;
    image?: string;
    alt?: string;
    items?: string[];
    note?: string;
  };
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
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");

  const loadPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select(
        "id,page_key,status,template_key,page_translations(language_code,title,slug,summary,seo_title,seo_description),content_blocks(id,language_code,block_type,sort_order,is_visible,data)",
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

  async function addBlock() {
    if (!form.pageId) {
      setMessage("Guarda la página antes de añadir secciones.");
      return;
    }

    const blocks = getSelectedBlocks(
      pages,
      form.pageId,
      form.pageKey,
      form.locale,
    );
    const { error } = await supabase.from("content_blocks").insert({
      page_id: form.pageId,
      language_code: form.locale,
      block_type: "text_section",
      sort_order: (blocks.at(-1)?.sort_order ?? 0) + 100,
      is_visible: true,
      data: { title: "Nueva sección", text: "" },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Sección añadida.");
    await loadPages();
  }

  async function saveBlock(block: ContentBlockRow) {
    if (!form.pageId) {
      setMessage("Guarda la página antes de guardar secciones.");
      return;
    }

    const payload = {
      page_id: form.pageId,
      language_code: form.locale,
      block_type: "text_section",
      sort_order: block.sort_order,
      is_visible: block.is_visible,
      data: block.data,
    };

    const { error } = block.id.startsWith("fallback-")
      ? await supabase.from("content_blocks").insert(payload)
      : await supabase
          .from("content_blocks")
          .update({
            sort_order: block.sort_order,
            is_visible: block.is_visible,
            data: block.data,
          })
          .eq("id", block.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Sección guardada.");
    await loadPages();
  }

  async function saveAllBlocks() {
    if (!form.pageId) {
      setMessage("Guarda la página antes de importar secciones.");
      return;
    }

    const blocks = getSelectedBlocks(
      pages,
      form.pageId,
      form.pageKey,
      form.locale,
    ).filter((block) => block.id.startsWith("fallback-"));

    if (blocks.length === 0) {
      setMessage("No hay contenido base pendiente de importar.");
      return;
    }

    const { error } = await supabase.from("content_blocks").insert(
      blocks.map((block) => ({
        page_id: form.pageId,
        language_code: form.locale,
        block_type: "text_section",
        sort_order: block.sort_order,
        is_visible: block.is_visible,
        data: block.data,
      })),
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Contenido base importado al CMS.");
    await loadPages();
  }

  async function deleteBlock(blockId: string) {
    if (blockId.startsWith("fallback-")) {
      setMessage("Guarda primero esta sección para poder eliminarla del CMS.");
      return;
    }

    const { error } = await supabase
      .from("content_blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Sección eliminada.");
    await loadPages();
  }

  async function translateToAllLanguages() {
    if (!form.pageId) {
      setMessage("Guarda la página antes de traducir.");
      return;
    }

    setTranslating(true);

    try {
      const response = await fetch("/api/admin/translate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: form.pageId,
          sourceLocale: form.locale,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      setMessage(result.message ?? result.error ?? "Traducción finalizada.");
      await loadPages();
    } catch {
      setMessage("No se pudo conectar con el servicio de traducción.");
    } finally {
      setTranslating(false);
    }
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

  const selectedBlocks = getSelectedBlocks(
    pages,
    form.pageId,
    form.pageKey,
    form.locale,
  );

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
        <button
          onClick={translateToAllLanguages}
          disabled={translating || loading || !form.pageId}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold disabled:opacity-50"
        >
          {translating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          Traducir a todos los idiomas
        </button>
        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-8 border-t border-[var(--line)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Secciones de la página</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Añade, modifica, oculta o elimina bloques visibles de esta página
              e idioma.
            </p>
          </div>
          <button
            onClick={addBlock}
            disabled={!form.pageId}
            className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={16} />
            Añadir sección
          </button>
          <button
            onClick={saveAllBlocks}
            disabled={
              !form.pageId ||
              !selectedBlocks.some((block) => block.id.startsWith("fallback-"))
            }
            className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 font-semibold disabled:opacity-50"
          >
            <Save size={16} />
            Importar contenido base
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {selectedBlocks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Esta página aún no tiene secciones CMS para este idioma.
            </p>
          ) : (
            selectedBlocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={(nextBlock) =>
                  setPages((current) =>
                    updateLocalBlock(current, form.pageId, nextBlock),
                  )
                }
                onSave={() => saveBlock(block)}
                onDelete={() => deleteBlock(block.id)}
              />
            ))
          )}
        </div>
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

function BlockEditor({
  block,
  onChange,
  onSave,
  onDelete,
}: {
  block: ContentBlockRow;
  onChange: (block: ContentBlockRow) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4">
      {block.id.startsWith("fallback-") ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Contenido base importable
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[1fr_140px_150px]">
        <TextInput
          label="Título de sección"
          value={block.data.title ?? ""}
          onChange={(value) =>
            onChange({
              ...block,
              data: { ...block.data, title: value },
            })
          }
        />

        <TextInput
          label="Orden"
          value={String(block.sort_order)}
          onChange={(value) =>
            onChange({
              ...block,
              sort_order: Number.parseInt(value, 10) || 0,
            })
          }
        />

        <label className="grid gap-2 text-sm font-semibold">
          Visible
          <select
            value={block.is_visible ? "yes" : "no"}
            onChange={(event) =>
              onChange({
                ...block,
                is_visible: event.target.value === "yes",
              })
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TextInput
          label="Imagen / URL"
          value={block.data.image ?? ""}
          onChange={(value) =>
            onChange({
              ...block,
              data: { ...block.data, image: value || undefined },
            })
          }
        />
        <TextInput
          label="Texto alternativo de la imagen"
          value={block.data.alt ?? ""}
          onChange={(value) =>
            onChange({
              ...block,
              data: { ...block.data, alt: value || undefined },
            })
          }
        />
      </div>

      {block.data.image ? (
        <div className="relative h-48 overflow-hidden border border-[var(--line)] bg-white">
          <Image
            src={block.data.image}
            alt={block.data.alt || block.data.title || "Imagen de sección"}
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <TextArea
        label="Texto"
        value={block.data.text ?? ""}
        onChange={(value) =>
          onChange({
            ...block,
            data: { ...block.data, text: value },
          })
        }
      />

      <TextArea
        label="Subsecciones / puntos (una línea por punto)"
        value={(block.data.items ?? []).join("\n")}
        onChange={(value) =>
          onChange({
            ...block,
            data: {
              ...block.data,
              items: value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            },
          })
        }
      />

      <TextArea
        label="Nota inferior"
        value={block.data.note ?? ""}
        onChange={(value) =>
          onChange({
            ...block,
            data: { ...block.data, note: value || undefined },
          })
        }
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          <Save size={16} />
          Guardar sección
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </article>
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

function getSelectedBlocks(
  pages: PageRow[],
  pageId: string | undefined,
  pageKey: PublicPageKey,
  locale: Locale,
) {
  if (!pageId) {
    return getFallbackBlocks(pageKey, locale);
  }

  const localBlocks = (pages.find((page) => page.id === pageId)?.content_blocks ?? [])
    .filter(
      (block) =>
        block.language_code === locale && block.block_type === "text_section",
    )
    .sort((left, right) => left.sort_order - right.sort_order);

  const savedBlocks = localBlocks.filter(
    (block) => !block.id.startsWith("fallback-"),
  );

  if (savedBlocks.length > 0) {
    const savedOrders = new Set(savedBlocks.map((block) => block.sort_order));
    const missingFallbackBlocks = getFallbackBlocks(pageKey, locale).filter(
      (block) => !savedOrders.has(block.sort_order),
    );

    return [...localBlocks, ...missingFallbackBlocks].sort(
      (left, right) => left.sort_order - right.sort_order,
    );
  }

  const editedFallbackBlocks = new Map(
    localBlocks.map((block) => [block.id, block]),
  );

  return getFallbackBlocks(pageKey, locale).map(
    (block) => editedFallbackBlocks.get(block.id) ?? block,
  );
}

function getFallbackBlocks(pageKey: PublicPageKey, locale: Locale): ContentBlockRow[] {
  if (pageKey === "about") {
    return getAboutSections(locale).map((section, index) => ({
      id: `fallback-about-${index}`,
      language_code: locale,
      block_type: "text_section",
      sort_order: (index + 1) * 100,
      is_visible: true,
      data: {
        title: section.title,
        text: section.body.join("\n\n"),
        image: section.image,
        alt: section.title,
        items: section.bullets ?? [],
        note: section.note,
      },
    }));
  }

  const content = getPublicPageContent(locale, pageKey);

  if (content.blocks?.length) {
    return content.blocks.map((block, index) => ({
      id: `fallback-${pageKey}-${index}`,
      language_code: locale,
      block_type: "text_section",
      sort_order: (index + 1) * 100,
      is_visible: true,
      data: {
        title: block.title,
        text: block.text,
        image: block.image,
        alt: block.alt,
        items: block.items ?? [],
        note: block.note,
      },
    }));
  }

  if (content.steps?.length) {
    return content.steps.map((step, index) => ({
      id: `fallback-${pageKey}-${index}`,
      language_code: locale,
      block_type: "text_section",
      sort_order: (index + 1) * 100,
      is_visible: true,
      data: {
        title: `${step.number}. ${step.title}`,
        text: step.text,
      },
    }));
  }

  if (content.countries?.length) {
    return [
      {
        id: `fallback-${pageKey}-countries`,
        language_code: locale,
        block_type: "text_section",
        sort_order: 100,
        is_visible: true,
        data: {
          title: content.title,
          text: "",
          items: content.countries,
        },
      },
    ];
  }

  return [];
}

function updateLocalBlock(
  pages: PageRow[],
  pageId: string | undefined,
  nextBlock: ContentBlockRow,
) {
  if (!pageId) {
    return pages;
  }

  return pages.map((page) =>
    page.id === pageId
      ? {
          ...page,
          content_blocks: page.content_blocks.some(
            (block) => block.id === nextBlock.id,
          )
            ? page.content_blocks.map((block) =>
                block.id === nextBlock.id ? nextBlock : block,
              )
            : [...page.content_blocks, nextBlock],
        }
      : page,
  );
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
