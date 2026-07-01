import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive } from "lucide-react";
import { isLocale, locales } from "@/lib/i18n/config";
import {
  archiveMonths,
  getArchiveMonthLabel,
  getArchiveNewsByMonth,
  isArchiveMonth,
} from "@/lib/content/news-archive";
import { archiveLabels } from "@/lib/i18n/news-archive";
import { ArchiveSidebar } from "@/components/news/archive-sidebar";
import { getDictionary } from "@/lib/i18n/dictionaries";

type ArchiveMonthPageProps = {
  params: Promise<{ locale: string; month: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    archiveMonths.map((month) => ({ locale, month })),
  );
}

export default async function ArchiveMonthPage({
  params,
}: ArchiveMonthPageProps) {
  const { locale, month } = await params;

  if (!isLocale(locale) || !isArchiveMonth(month)) {
    notFound();
  }

  const labels = archiveLabels[locale];
  const dictionary = getDictionary(locale);
  const items = getArchiveNewsByMonth(locale, month);
  const monthLabel = getArchiveMonthLabel(month, locale);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <Link
        href={`/${locale}/news/archive`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {dictionary.nav.news}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {labels.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold">{monthLabel}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            {labels.intro}
          </p>

          <div className="mt-10 grid gap-6">
            {items.map((item) => (
              <article
                key={item.slug}
                id={item.slug}
                className="grid overflow-hidden border border-[var(--line)] bg-white lg:grid-cols-[0.36fr_0.64fr]"
              >
                {item.image ? (
                  <div
                    className="min-h-[230px] bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                    aria-hidden="true"
                  />
                ) : (
                  <div className="flex min-h-[230px] items-center justify-center bg-[var(--ink-blue)] text-white">
                    <div className="text-center">
                      <Archive className="mx-auto" size={28} aria-hidden="true" />
                      <span className="mt-3 block text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                        {labels.noImage}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {item.date}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight">
                      {item.title}
                    </h2>
                    <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                      {item.excerpt}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/news/archive/item/${item.slug}`}
                    className="mt-8 text-sm font-semibold text-[var(--ink-blue)]"
                  >
                    {labels.read}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <ArchiveSidebar
          locale={locale}
          activeMonth={month}
        />
      </div>
    </section>
  );
}
