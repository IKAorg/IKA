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
    cmsBadge: string;
  }
> = {
  en: {
    newEyebrow: "Current news",
    emptyTitle: "New IKA news will appear here.",
    emptyText:
      "This section is reserved for new articles published from the administration panel. The historical posts from the old website remain available in the archive.",
    archiveTitle: "Old news archive",
    archiveText:
      "Historical IKA reports migrated from the previous website, organised by date and month.",
    archiveAction: "Open archive",
    cmsBadge: "CMS ready",
  },
  es: {
    newEyebrow: "Noticias actuales",
    emptyTitle: "Las nuevas noticias de IKA aparecerán aquí.",
    emptyText:
      "Esta sección queda reservada para los artículos nuevos publicados desde el panel de administración. Las publicaciones históricas de la web antigua siguen disponibles en el archivo.",
    archiveTitle: "Archivo de noticias antiguas",
    archiveText:
      "Informes históricos de IKA migrados desde la web anterior, organizados por fecha y mes.",
    archiveAction: "Abrir archivo",
    cmsBadge: "Preparado para CMS",
  },
  it: {
    newEyebrow: "Notizie attuali",
    emptyTitle: "Le nuove notizie IKA appariranno qui.",
    emptyText:
      "Questa sezione è riservata agli articoli nuovi pubblicati dal pannello di amministrazione. I post storici del vecchio sito restano disponibili nell'archivio.",
    archiveTitle: "Archivio vecchie notizie",
    archiveText:
      "Report storici IKA migrati dal sito precedente, organizzati per data e mese.",
    archiveAction: "Apri archivio",
    cmsBadge: "Pronto per CMS",
  },
  fr: {
    newEyebrow: "Actualités courantes",
    emptyTitle: "Les nouvelles actualités IKA apparaîtront ici.",
    emptyText:
      "Cette section est réservée aux nouveaux articles publiés depuis le panneau d'administration. Les anciens posts du site précédent restent disponibles dans l'archive.",
    archiveTitle: "Archive des anciennes actualités",
    archiveText:
      "Rapports historiques IKA migrés depuis l'ancien site, organisés par date et par mois.",
    archiveAction: "Ouvrir l'archive",
    cmsBadge: "Prêt pour le CMS",
  },
  ja: {
    newEyebrow: "現在のニュース",
    emptyTitle: "新しいIKAニュースはここに表示されます。",
    emptyText:
      "このセクションは管理画面から公開される新しい記事用です。旧ウェブサイトの過去投稿はアーカイブで閲覧できます。",
    archiveTitle: "旧ニュースアーカイブ",
    archiveText:
      "以前のウェブサイトから移行したIKAの過去レポートを日付と月別に整理しています。",
    archiveAction: "アーカイブを開く",
    cmsBadge: "CMS準備済み",
  },
  zh: {
    newEyebrow: "当前新闻",
    emptyTitle: "新的 IKA 新闻将显示在这里。",
    emptyText:
      "该区域保留给从管理面板发布的新文章。旧网站的历史文章仍可在档案中查看。",
    archiveTitle: "旧新闻档案",
    archiveText: "从旧网站迁移的 IKA 历史报告，按日期和月份整理。",
    archiveAction: "打开档案",
    cmsBadge: "CMS 就绪",
  },
  cs: {
    newEyebrow: "Aktuální novinky",
    emptyTitle: "Nové zprávy IKA se zobrazí zde.",
    emptyText:
      "Tato sekce je vyhrazena pro nové články publikované z administračního panelu. Historické příspěvky ze starého webu zůstávají dostupné v archivu.",
    archiveTitle: "Archiv starých novinek",
    archiveText:
      "Historické zprávy IKA převedené z předchozího webu, uspořádané podle data a měsíce.",
    archiveAction: "Otevřít archiv",
    cmsBadge: "Připraveno pro CMS",
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
          <p className="inline-flex border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {labels.cmsBadge}
          </p>
          <h2 className="mt-5 text-2xl font-semibold">{labels.archiveTitle}</h2>
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
