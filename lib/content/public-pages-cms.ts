import type { Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  getPublicPageContent,
  type TextBlock,
  type PublicPageContent,
  type PublicPageKey,
} from "@/lib/i18n/public-pages";

type CmsPageTranslationRow = {
  title: string;
  summary: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type CmsPageRow = {
  page_key: PublicPageKey;
  status: string;
  page_translations: CmsPageTranslationRow[];
  content_blocks: Array<{
    language_code: Locale | null;
    block_type: string;
    sort_order: number;
    data: {
      title?: string;
      text?: string;
      image?: string;
      alt?: string;
      items?: string[];
      note?: string;
    };
    is_visible: boolean;
  }>;
};

export async function getEditablePublicPageContent(
  locale: Locale,
  page: PublicPageKey,
): Promise<PublicPageContent> {
  const fallback = getPublicPageContent(locale, page);
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("pages")
    .select(
      "page_key,status,page_translations(title,summary,seo_title,seo_description),content_blocks(language_code,block_type,sort_order,data,is_visible)",
    )
    .eq("page_key", page)
    .eq("status", "published")
    .eq("page_translations.language_code", locale)
    .maybeSingle<CmsPageRow>();

  const translation = data?.page_translations?.[0];

  if (error || !translation) {
    return fallback;
  }

  const blocks = getCmsBlocks(data?.content_blocks ?? [], locale);

  return {
    ...fallback,
    title: translation.title || fallback.title,
    intro: translation.summary || fallback.intro,
    blocks: blocks.length > 0 ? blocks : fallback.blocks,
    hasCmsBlocks: blocks.length > 0,
  };
}

function getCmsBlocks(
  blocks: CmsPageRow["content_blocks"],
  locale: Locale,
): TextBlock[] {
  return blocks
    .filter(
      (block) =>
        block.block_type === "text_section" &&
        block.language_code === locale &&
        block.is_visible,
    )
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((block) => ({
      title: block.data.title ?? "",
      text: block.data.text ?? "",
      image: block.data.image,
      alt: block.data.alt,
      items: block.data.items,
      note: block.data.note,
    }))
    .filter(
      (block) =>
        block.title ||
        block.text ||
        block.image ||
        block.items?.length ||
        block.note,
    );
}
