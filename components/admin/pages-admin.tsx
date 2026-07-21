"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  FilePenLine,
  ImagePlus,
  Languages,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, localeLabels, type Locale } from "@/lib/i18n/config";
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
  { key: "countries", label: "Countries" },
  { key: "dojos", label: "Dojos" },
  { key: "news", label: "News" },
  { key: "events", label: "Events" },
  { key: "join", label: "Join IKA" },
  { key: "contact", label: "Contact" },
  { key: "portal", label: "Portal" },
];

const editableLocales: Array<{ key: Locale; label: string }> = (
  Object.entries(localeLabels) as Array<[Locale, string]>
).map(([key, label]) => ({ key, label }));

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

function createDefaultForm(locale: Locale): PageForm {
  return {
    status: "published",
    pageKey: "about",
    locale,
    title: "",
    slug: "about",
    summary: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function PagesAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const copy = pagesAdminCopy(initialLocale);
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [form, setForm] = useState<PageForm>(() =>
    createDefaultForm(initialLocale),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadingBlockImageId, setUploadingBlockImageId] = useState("");
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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

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
      setMessage(pageResult.error?.message ?? copy.savePageError);
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

    setMessage(copy.pageSaved);
    await loadPages();
    setSaving(false);
  }

  async function addBlock() {
    if (!form.pageId) {
      setMessage(copy.savePageBeforeAdd);
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
      data: { title: copy.newSection, text: "" },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(copy.sectionAdded);
    await loadPages();
  }

  async function saveBlock(block: ContentBlockRow) {
    if (!form.pageId) {
      setMessage(copy.savePageBeforeSaveSections);
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

    setMessage(copy.sectionSaved);
    await loadPages();
  }

  async function saveAllBlocks() {
    if (!form.pageId) {
      setMessage(copy.savePageBeforeImport);
      return;
    }

    const blocks = getSelectedBlocks(
      pages,
      form.pageId,
      form.pageKey,
      form.locale,
    ).filter((block) => block.id.startsWith("fallback-"));

    if (blocks.length === 0) {
      setMessage(copy.noBaseContent);
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

    setMessage(copy.baseImported);
    await loadPages();
  }

  async function deleteBlock(blockId: string) {
    if (blockId.startsWith("fallback-")) {
      setMessage(copy.saveSectionBeforeDelete);
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

    setMessage(copy.sectionDeleted);
    await loadPages();
  }

  async function uploadBlockImage(block: ContentBlockRow, file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImageFile);
      return;
    }

    setUploadingBlockImageId(block.id);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.8,
      maxBytes: 520 * 1024,
      outputType: "image/webp",
      fileNameBase: `${form.pageKey}-${file.name}`,
    });

    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const safePage = slugify(form.pageKey) || "page";
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(file.lastModified);
    const safeName =
      slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || `imagen-${uniqueId}`;
    const storagePath = `pages/${safePage}/${uniqueId}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("public-media")
      .upload(storagePath, optimizedFile, {
        cacheControl: "31536000",
        contentType: optimizedFile.type,
        upsert: true,
      });

    if (error) {
      setMessage(error.message);
      setUploadingBlockImageId("");
      return;
    }

    const { data } = supabase.storage
      .from("public-media")
      .getPublicUrl(storagePath);

    setPages((current) =>
      updateLocalBlock(current, form.pageId, {
        ...block,
        data: { ...block.data, image: data.publicUrl },
      }),
    );
    setUploadingBlockImageId("");
  }

  async function translateToAllLanguages() {
    if (!form.pageId) {
      setMessage(copy.savePageBeforeTranslate);
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

      setMessage(result.message ?? result.error ?? copy.translationFinished);
      await loadPages();
    } catch {
      setMessage(copy.translationConnectionError);
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
            <h2 className="mt-2 text-2xl font-semibold">{copy.publicPages}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {copy.loginFirst}
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
          <h2 className="mt-2 text-2xl font-semibold">{copy.publicPages}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {copy.intro}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          {copy.page}
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
                {copy.pageLabels[page.key]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          {copy.language}
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
          {copy.status}
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
            <option value="draft">{copy.draft}</option>
            <option value="published">{copy.published}</option>
            <option value="archived">{copy.archived}</option>
          </select>
        </label>

        <TextInput
          label={copy.slug}
          value={form.slug}
          onChange={(value) =>
            setForm((current) => ({ ...current, slug: slugify(value) }))
          }
        />

        <div className="lg:col-span-2">
          <TextInput
            label={copy.publicTitle}
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
            label={copy.visibleSummary}
            value={form.summary}
            onChange={(value) =>
              setForm((current) => ({ ...current, summary: value }))
            }
          />
        </div>

        <TextInput
          label={copy.seoTitle}
          value={form.seoTitle}
          onChange={(value) =>
            setForm((current) => ({ ...current, seoTitle: value }))
          }
        />

        <TextInput
          label={copy.seoDescription}
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
          {copy.savePage}
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
          {copy.translateAll}
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
            <h3 className="text-xl font-semibold">{copy.pageSections}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {copy.sectionsHelp}
            </p>
          </div>
          <button
            onClick={addBlock}
            disabled={!form.pageId}
            className="inline-flex items-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={16} />
            {copy.addSection}
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
            {copy.importBaseContent}
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {selectedBlocks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {copy.noSections}
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
                uploadingImage={uploadingBlockImageId === block.id}
                onUploadImage={(file) => uploadBlockImage(block, file)}
                copy={copy}
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
  uploadingImage,
  onUploadImage,
  copy,
}: {
  block: ContentBlockRow;
  onChange: (block: ContentBlockRow) => void;
  onSave: () => void;
  onDelete: () => void;
  uploadingImage: boolean;
  onUploadImage: (file: File) => void;
  copy: ReturnType<typeof pagesAdminCopy>;
}) {
  return (
    <article className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4">
      {block.id.startsWith("fallback-") ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          {copy.importableBaseContent}
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[1fr_140px_150px]">
        <TextInput
          label={copy.sectionTitle}
          value={block.data.title ?? ""}
          onChange={(value) =>
            onChange({
              ...block,
              data: { ...block.data, title: value },
            })
          }
        />

        <TextInput
          label={copy.order}
          value={String(block.sort_order)}
          onChange={(value) =>
            onChange({
              ...block,
              sort_order: Number.parseInt(value, 10) || 0,
            })
          }
        />

        <label className="grid gap-2 text-sm font-semibold">
          {copy.visible}
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
            <option value="yes">{copy.yes}</option>
            <option value="no">{copy.no}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ImageUploadField
          label={copy.image}
          value={block.data.image ?? ""}
          alt={block.data.alt || block.data.title || copy.sectionImageAlt}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onClear={() =>
            onChange({
              ...block,
              data: { ...block.data, image: undefined },
            })
          }
          copy={copy}
        />
        <TextInput
          label={copy.imageAltText}
          value={block.data.alt ?? ""}
          onChange={(value) =>
            onChange({
              ...block,
              data: { ...block.data, alt: value || undefined },
            })
          }
        />
      </div>

      <TextArea
        label={copy.text}
        value={block.data.text ?? ""}
        onChange={(value) =>
          onChange({
            ...block,
            data: { ...block.data, text: value },
          })
        }
      />

      <TextArea
        label={copy.items}
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
        label={copy.bottomNote}
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
          {copy.saveSection}
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
        >
          <Trash2 size={16} />
          {copy.delete}
        </button>
      </div>
    </article>
  );
}

function ImageUploadField({
  label,
  value,
  alt,
  uploading,
  onUpload,
  onClear,
  copy,
}: {
  label: string;
  value: string;
  alt: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
  copy: ReturnType<typeof pagesAdminCopy>;
}) {
  return (
    <div className="grid gap-2 text-sm font-semibold">
      <span>{label}</span>
      <div className="border border-[var(--line)] bg-white p-3">
        {value ? (
          <div className="relative mb-3 h-36 overflow-hidden border border-[var(--line)] bg-white">
            <Image
              src={value}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] bg-[var(--paper)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {copy.noImage}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
            {value ? copy.changeImage : copy.uploadImage}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  onUpload(file);
                }
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              <X size={16} />
              {copy.removeImage}
            </button>
          ) : null}
        </div>
      </div>
    </div>
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

function pagesAdminCopy(locale: Locale) {
  const es = locale === "es";

  return {
    loginFirst: es ? "Entra primero en el admin para editar paginas." : "Sign in to admin first to edit pages.",
    intro: es
      ? "Edita el titulo, entradilla y SEO de cada seccion publica. Las paginas publicadas se leen desde Supabase y se actualizan sin redeploy."
      : "Edit the title, intro, and SEO for each public section. Published pages are read from Supabase and updated without a redeploy.",
    savePageError: es ? "No se pudo guardar la pagina." : "The page could not be saved.",
    pageSaved: es ? "Pagina guardada." : "Page saved.",
    savePageBeforeAdd: es ? "Guarda la pagina antes de anadir secciones." : "Save the page before adding sections.",
    sectionAdded: es ? "Seccion anadida." : "Section added.",
    savePageBeforeSaveSections: es ? "Guarda la pagina antes de guardar secciones." : "Save the page before saving sections.",
    sectionSaved: es ? "Seccion guardada." : "Section saved.",
    savePageBeforeImport: es ? "Guarda la pagina antes de importar secciones." : "Save the page before importing sections.",
    noBaseContent: es ? "No hay contenido base pendiente de importar." : "There is no base content pending import.",
    baseImported: es ? "Contenido base importado al CMS." : "Base content imported into the CMS.",
    saveSectionBeforeDelete: es ? "Guarda primero esta seccion para poder eliminarla del CMS." : "Save this section first before deleting it from the CMS.",
    sectionDeleted: es ? "Seccion eliminada." : "Section deleted.",
    selectImageFile: es ? "Selecciona un archivo de imagen." : "Select an image file.",
    savePageBeforeTranslate: es ? "Guarda la pagina antes de traducir." : "Save the page before translating.",
    translationFinished: es ? "Traduccion finalizada." : "Translation finished.",
    translationConnectionError: es ? "No se pudo conectar con el servicio de traduccion." : "Could not connect to the translation service.",
    publicPages: es ? "Paginas publicas" : "Public pages",
    page: es ? "Pagina" : "Page",
    pageLabels: {
      about: es ? "Sobre IKA" : "About IKA",
      countries: es ? "Paises" : "Countries",
      dojos: "Dojos",
      news: es ? "Noticias" : "News",
      events: es ? "Eventos" : "Events",
      join: es ? "Unirse a IKA" : "Join IKA",
      contact: es ? "Contacto" : "Contact",
      portal: es ? "Portal" : "Portal",
    } as Record<PublicPageKey, string>,
    language: es ? "Idioma" : "Language",
    status: es ? "Estado" : "Status",
    draft: es ? "Borrador" : "Draft",
    published: es ? "Publicado" : "Published",
    archived: es ? "Archivado" : "Archived",
    slug: "Slug",
    publicTitle: es ? "Titulo publico" : "Public title",
    visibleSummary: es ? "Entradilla / resumen visible" : "Visible intro / summary",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    savePage: es ? "Guardar pagina" : "Save page",
    translateAll: es ? "Traducir a todos los idiomas" : "Translate to all languages",
    pageSections: es ? "Secciones de la pagina" : "Page sections",
    sectionsHelp: es
      ? "Anade, modifica, oculta o elimina bloques visibles de esta pagina e idioma."
      : "Add, edit, hide or delete visible blocks for this page and language.",
    addSection: es ? "Anadir seccion" : "Add section",
    newSection: es ? "Nueva seccion" : "New section",
    importBaseContent: es ? "Importar contenido base" : "Import base content",
    noSections: es ? "Esta pagina aun no tiene secciones CMS para este idioma." : "This page does not have CMS sections for this language yet.",
    importableBaseContent: es ? "Contenido base importable" : "Importable base content",
    sectionTitle: es ? "Titulo de seccion" : "Section title",
    order: es ? "Orden" : "Order",
    visible: es ? "Visible" : "Visible",
    yes: es ? "Si" : "Yes",
    no: es ? "No" : "No",
    image: es ? "Imagen" : "Image",
    sectionImageAlt: es ? "Imagen de seccion" : "Section image",
    imageAltText: es ? "Texto alternativo de la imagen" : "Image alt text",
    text: es ? "Texto" : "Text",
    items: es ? "Subsecciones / puntos (una linea por punto)" : "Subsections / points (one line per point)",
    bottomNote: es ? "Nota inferior" : "Bottom note",
    saveSection: es ? "Guardar seccion" : "Save section",
    delete: es ? "Eliminar" : "Delete",
    noImage: es ? "Sin imagen" : "No image",
    changeImage: es ? "Cambiar imagen" : "Change image",
    uploadImage: es ? "Subir imagen" : "Upload image",
    removeImage: es ? "Quitar imagen" : "Remove image",
  };
}
