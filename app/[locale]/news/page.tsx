import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";
import { getLatestReports } from "@/lib/content/latest-reports";
import { getDictionary } from "@/lib/i18n/dictionaries";

type NewsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = getPublicPageContent(safeLocale, "news");
  const dictionary = getDictionary(safeLocale);
  const latestReports = getLatestReports(safeLocale);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <Link
        href={`/${safeLocale}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {dictionary.nav.home}
      </Link>

      <div className="mt-8 flex flex-col gap-5 border-b border-[var(--line)] pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold">{content.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {content.intro}
          </p>
        </div>
        <Link
          href={`/${safeLocale}/contact`}
          className="inline-flex items-center justify-center bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          {dictionary.nav.contact}
        </Link>
      </div>

      <div className="mt-10 grid gap-6">
        {latestReports.map((report) => (
          <article
            key={report.title}
            id={report.slug}
            className="grid overflow-hidden border border-[var(--line)] bg-white lg:grid-cols-[0.42fr_0.58fr]"
          >
            <div
              className="min-h-[260px] bg-cover bg-center"
              style={{ backgroundImage: `url(${report.image})` }}
              aria-hidden="true"
            />
            <div className="flex flex-col justify-between p-6">
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">
                  {report.date}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  {report.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                  {report.excerpt}
                </p>
              </div>
              <a
                href={`/${safeLocale}/news#${report.slug}`}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-blue)]"
              >
                {dictionary.home.reportCardAction}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
