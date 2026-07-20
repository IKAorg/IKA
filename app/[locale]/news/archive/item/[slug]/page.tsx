import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import {
  getArchiveMonthLabel,
  getArchiveNewsItem,
} from "@/lib/content/news-archive";
import {
  getArchiveDetail,
  getArchiveDetailHtml,
} from "@/lib/content/archive-details";
import { getCmsNewsBySlug } from "@/lib/content/news-cms";
import { archiveLabels } from "@/lib/i18n/news-archive";
import { getDictionary } from "@/lib/i18n/dictionaries";

type ArchiveItemPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ArchiveItemPage({
  params,
}: ArchiveItemPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const cmsItem = await getCmsNewsBySlug(locale, slug);

  if (cmsItem) {
    return (
      <article className="mx-auto max-w-6xl px-5 py-14">
        <Link
          href={`/${locale}/news/archive/${cmsItem.month}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {getArchiveMonthLabel(cmsItem.month, locale)}
        </Link>

        <div className="mt-8 border border-[var(--line)] bg-white">
          {cmsItem.image ? (
            <div className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6 sm:py-6">
              <div className="relative overflow-hidden border border-[var(--line)] bg-white">
                <div className="relative min-h-[260px] sm:min-h-[380px] lg:min-h-[520px]">
                  <Image
                    src={cmsItem.image}
                    alt={cmsItem.imageAlt || cmsItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="p-6 md:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {archiveLabels[locale]?.eyebrow ?? archiveLabels[defaultLocale]!.eyebrow}
            </p>
            <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
              {cmsItem.date}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              {cmsItem.title}
            </h1>
            <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-8 text-[var(--foreground)] sm:text-[1.05rem]">
              {cmsItem.body || cmsItem.excerpt}
            </div>

            <div className="mt-10 flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
              <Link
                href={`/${locale}/news/archive`}
                className="inline-flex border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-blue)]"
              >
                {archiveLabels[locale]?.title ?? archiveLabels[defaultLocale]!.title}
              </Link>
              <Link
                href={`/${locale}/news`}
                className="inline-flex border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-blue)]"
              >
                {getDictionary(locale).nav.news}
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const item = await getArchiveNewsItem(locale, slug);
  const detail = getArchiveDetail(locale, slug);

  if (!item || !detail) {
    notFound();
  }

  const labels = archiveLabels[locale] ?? archiveLabels[defaultLocale]!;
  const dictionary = getDictionary(locale);

  return (
    <article className="mx-auto max-w-6xl px-5 py-14">
      <Link
        href={`/${locale}/news/archive/${item.month}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {getArchiveMonthLabel(item.month, locale)}
      </Link>

      <div className="mt-8 border border-[var(--line)] bg-white">
        {detail.heroImage ? (
          <div className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6 sm:py-6">
            <div className="relative overflow-hidden border border-[var(--line)] bg-white">
              <div className="relative min-h-[260px] sm:min-h-[380px] lg:min-h-[520px]">
                <Image
                  src={detail.heroImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="p-6 md:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {labels.eyebrow}
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--accent)]">
            {item.date}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
            {item.title}
          </h1>
          <div
            className="archive-detail-content mt-8"
            dangerouslySetInnerHTML={{
              __html: getArchiveDetailHtml(detail, locale),
            }}
          />

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
