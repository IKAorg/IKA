import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getArchiveNews } from "@/lib/content/news-archive";
import { archiveLabels } from "@/lib/i18n/news-archive";
import { ArchiveSidebar } from "@/components/news/archive-sidebar";

type ArchivePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const dictionary = getDictionary(safeLocale);
  const labels = archiveLabels[safeLocale];
  const archiveItems = getArchiveNews(safeLocale);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <Link
        href={`/${safeLocale}/news`}
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
          <h1 className="mt-4 text-4xl font-semibold">{labels.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            {labels.intro}
          </p>

          <div className="mt-10 grid gap-6">
            {archiveItems.map((item) => (
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
                  <a
                    href={`/${safeLocale}/news/archive#${item.slug}`}
                    className="mt-8 text-sm font-semibold text-[var(--ink-blue)]"
                  >
                    {labels.read}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <ArchiveSidebar locale={safeLocale} />
      </div>
    </section>
  );
}
