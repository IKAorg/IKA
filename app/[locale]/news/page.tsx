import Link from "next/link";
import { Archive, Newspaper } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNewNews } from "@/lib/content/news-archive";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type NewsPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const newsLabels: Record<
  Locale,
  {
    newEyebrow: string;
    emptyTitle: string;
    emptyText: string;
    archiveTitle: string;
    archiveText: string;
    archiveAction: string;
  }
> = {
  en: {
    newEyebrow: "Current news",
    emptyTitle: "New IKA news will appear here.",
    emptyText:
      "New IKA articles will be published here. Historical reports remain available in the archive.",
    archiveTitle: "Old news archive",
    archiveText:
      "Historical IKA reports, organised by date and month.",
    archiveAction: "Open archive",
  },
  es: {
    newEyebrow: "Noticias actuales",
    emptyTitle: "Las nuevas noticias de IKA aparecerán aquí.",
    emptyText:
      "Las nuevas noticias de IKA se publicaran aqui. Los informes historicos siguen disponibles en el archivo.",
    archiveTitle: "Archivo de noticias antiguas",
    archiveText:
      "Informes historicos de IKA, organizados por fecha y mes.",
    archiveAction: "Abrir archivo",
  },
  it: {
    newEyebrow: "Notizie attuali",
    emptyTitle: "Le nuove notizie IKA appariranno qui.",
    emptyText:
      "Le nuove notizie IKA saranno pubblicate qui. I report storici restano disponibili nell'archivio.",
    archiveTitle: "Archivio vecchie notizie",
    archiveText:
      "Report storici IKA, organizzati per data e mese.",
    archiveAction: "Apri archivio",
  },
  fr: {
    newEyebrow: "Actualités courantes",
    emptyTitle: "Les nouvelles actualités IKA apparaîtront ici.",
    emptyText:
      "Les nouvelles actualites IKA seront publiees ici. Les rapports historiques restent disponibles dans l'archive.",
    archiveTitle: "Archive des anciennes actualités",
    archiveText:
      "Rapports historiques IKA, organises par date et par mois.",
    archiveAction: "Ouvrir l'archive",
  },
  ja: {
    newEyebrow: "現在のニュース",
    emptyTitle: "新しいIKAニュースはここに表示されます。",
    emptyText:
      "New IKA news will be published here. Historical reports remain available in the archive.",
    archiveTitle: "旧ニュースアーカイブ",
    archiveText:
      "Historical IKA reports, organised by date and month.",
    archiveAction: "アーカイブを開く",
  },
  zh: {
    newEyebrow: "当前新闻",
    emptyTitle: "新的 IKA 新闻将显示在这里。",
    emptyText:
      "New IKA news will be published here. Historical reports remain available in the archive.",
    archiveTitle: "旧新闻档案",
    archiveText: "从旧网站迁移的 IKA 历史报告，按日期和月份整理。",
    archiveAction: "打开档案",
  },
  cs: {
    newEyebrow: "Aktuální novinky",
    emptyTitle: "Nové zprávy IKA se zobrazí zde.",
    emptyText:
      "Nove zpravy IKA budou publikovany zde. Historicke zpravy zustavaji dostupne v archivu.",
    archiveTitle: "Archiv starých novinek",
    archiveText:
      "Historicke zpravy IKA usporadane podle data a mesice.",
    archiveAction: "Otevřít archiv",
  },
};

export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "news");
  const dictionary = getDictionary(safeLocale);
  const labels = newsLabels[safeLocale];
  const news = getNewNews();

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="flex flex-col gap-5 border-b border-[var(--line)] pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold">{content.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {content.intro}
          </p>
          <PublicContentBlocks blocks={content.blocks} />
        </div>
        <Link
          href={`/${safeLocale}/news/archive`}
          className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--ink-blue)]"
        >
          <Archive size={16} aria-hidden="true" />
          {labels.archiveAction}
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="border border-[var(--line)] bg-white p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center bg-[var(--accent)] text-white">
              <Newspaper size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {labels.newEyebrow}
              </p>
              <h2 className="text-2xl font-semibold">{labels.emptyTitle}</h2>
            </div>
          </div>

          {news.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {news.map((item) => (
                <article
                  key={item.slug}
                  className="border-t border-[var(--line)] pt-5"
                >
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    {item.date}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {item.excerpt}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">
              {labels.emptyText}
            </p>
          )}
        </div>

        <aside className="border border-[var(--line)] bg-[var(--background)] p-8">
          <h2 className="text-2xl font-semibold">{labels.archiveTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {labels.archiveText}
          </p>
          <Link
            href={`/${safeLocale}/news/archive`}
            className="mt-6 inline-flex items-center justify-center bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            {labels.archiveAction}
          </Link>
        </aside>
      </div>

      <div className="sr-only">{dictionary.nav.news}</div>
    </section>
  );
}
