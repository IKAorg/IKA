import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale, locales } from "@/lib/i18n/config";
import {
  getArchiveMonthLabel,
  getArchiveNews,
  getArchiveNewsItem,
} from "@/lib/content/news-archive";
import { archiveLabels } from "@/lib/i18n/news-archive";
import { getDictionary } from "@/lib/i18n/dictionaries";

type ArchiveItemPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getArchiveNews(locale).map((item) => ({ locale, slug: item.slug })),
  );
}

export default async function ArchiveItemPage({
  params,
}: ArchiveItemPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const item = getArchiveNewsItem(locale, slug);

  if (!item) {
    notFound();
  }

  const labels = archiveLabels[locale];
  const dictionary = getDictionary(locale);

  return (
    <article className="mx-auto max-w-5xl px-5 py-14">
      <Link
        href={`/${locale}/news/archive/${item.month}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {getArchiveMonthLabel(item.month, locale)}
      </Link>

      <div className="mt-8 border border-[var(--line)] bg-white">
        {item.image ? (
          <div
            className="min-h-[360px] bg-cover bg-center"
            style={{ backgroundImage: `url(${item.image})` }}
            aria-hidden="true"
          />
        ) : null}

        <div className="p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {labels.eyebrow}
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
            {item.date}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            {item.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            {item.excerpt}
          </p>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
            <Link
              href={`/${locale}/news/archive`}
              className="inline-flex border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-blue)]"
            >
              {labels.title}
            </Link>
            <Link
              href={`/${locale}/news`}
              className="inline-flex border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-blue)]"
            >
              {dictionary.nav.news}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
