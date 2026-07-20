import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type CmsNewsTranslation = {
  language_code: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
};

export type CmsNewsItem = {
  id: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  expires_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  created_at?: string | null;
  news_translations: CmsNewsTranslation[];
};

export type LocalizedCmsNewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  month: string;
  image: string;
  imageAlt: string;
  isExpired: boolean;
};

function formatNewsDate(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function monthKeyFromDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${month}-${year}`;
}

function pickTranslation(
  translations: CmsNewsTranslation[],
  locale: Locale,
) {
  return (
    translations.find((item) => item.language_code === locale) ??
    translations.find((item) => item.language_code === defaultLocale) ??
    translations[0] ??
    null
  );
}

function localizeNewsItem(item: CmsNewsItem, locale: Locale): LocalizedCmsNewsItem | null {
  const translation = pickTranslation(item.news_translations ?? [], locale);

  if (!translation?.slug || !translation.title) {
    return null;
  }

  return {
    id: item.id,
    slug: translation.slug,
    title: translation.title,
    excerpt: translation.excerpt ?? "",
    body: translation.body ?? "",
    date: formatNewsDate(item.published_at, locale),
    month: monthKeyFromDate(item.published_at),
    image: item.cover_image_url ?? "",
    imageAlt: item.cover_image_alt ?? translation.title,
    isExpired: isNewsExpired(item),
  };
}

export function isNewsExpired(item: Pick<CmsNewsItem, "status" | "expires_at">) {
  if (item.status === "archived") {
    return true;
  }

  if (!item.expires_at) {
    return false;
  }

  return new Date(item.expires_at).getTime() < Date.now();
}

export async function getPublishedCmsNewsRaw() {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("news")
    .select(
      "id,status,published_at,expires_at,cover_image_url,cover_image_alt,created_at,news_translations(language_code,title,slug,excerpt,body)",
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as CmsNewsItem[];
}

export async function getActiveCmsNews(locale: Locale) {
  const items = await getPublishedCmsNewsRaw();
  return items
    .filter((item) => !isNewsExpired(item))
    .map((item) => localizeNewsItem(item, locale))
    .filter(Boolean) as LocalizedCmsNewsItem[];
}

export async function getArchivedCmsNews(locale: Locale) {
  const items = await getPublishedCmsNewsRaw();
  return items
    .filter((item) => isNewsExpired(item))
    .map((item) => localizeNewsItem(item, locale))
    .filter(Boolean) as LocalizedCmsNewsItem[];
}

export async function getCmsNewsBySlug(locale: Locale, slug: string) {
  const items = await getPublishedCmsNewsRaw();
  const match = items.find((item) =>
    (item.news_translations ?? []).some((translation) => translation.slug === slug),
  );

  if (!match) {
    return null;
  }

  return localizeNewsItem(match, locale);
}

export async function getCmsArchiveMonths() {
  const items = await getPublishedCmsNewsRaw();
  return Array.from(
    new Set(
      items
        .filter((item) => isNewsExpired(item))
        .map((item) => monthKeyFromDate(item.published_at))
        .filter(Boolean),
    ),
  ).sort((left, right) => {
    const [leftMonth, leftYear] = left.split("-").map(Number);
    const [rightMonth, rightYear] = right.split("-").map(Number);
    return rightYear - leftYear || rightMonth - leftMonth;
  });
}

export function getMissingLocaleTranslations(
  source: Pick<CmsNewsTranslation, "title" | "excerpt" | "body">,
) {
  return locales.map((locale) => ({
    language_code: locale,
    title: locale === defaultLocale ? source.title : "",
    excerpt: locale === defaultLocale ? source.excerpt ?? "" : "",
    body: locale === defaultLocale ? source.body ?? "" : "",
  }));
}
