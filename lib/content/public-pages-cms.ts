import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";
import {
  getPublicPageContent,
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
};

export async function getEditablePublicPageContent(
  locale: Locale,
  page: PublicPageKey,
): Promise<PublicPageContent> {
  const fallback = getPublicPageContent(locale, page);
  const url = getSupabaseProjectUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return fallback;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("pages")
    .select(
      "page_key,status,page_translations(title,summary,seo_title,seo_description)",
    )
    .eq("page_key", page)
    .eq("status", "published")
    .eq("page_translations.language_code", locale)
    .maybeSingle<CmsPageRow>();

  const translation = data?.page_translations?.[0];

  if (error || !translation) {
    return fallback;
  }

  return {
    ...fallback,
    title: translation.title || fallback.title,
    intro: translation.summary || fallback.intro,
  };
}
