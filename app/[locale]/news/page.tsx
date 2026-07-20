import Link from "next/link";
import { Archive, Newspaper } from "lucide-react";
import Image from "next/image";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNewNews } from "@/lib/content/news-archive";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type NewsPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const newsLabels: Partial<
  Record<
    Locale,
    {
      newEyebrow: string;
      emptyTitle: string;
      emptyText: string;
      archiveTitle: string;
      archiveText: string;
      archiveAction: string;
      readAction: string;
    }
  >
> = {
  en: {
    newEyebrow: "Current news",
    emptyTitle: "No news at the moment.",
    emptyText:
      
      "When we have new IKA news, it will appear in this section. Keep visiting us to discover our latest updates.",
    archiveTitle: "Old news archive",
    archiveText: "Historical IKA reports, organised by date and month.",
    archiveAction: "Open archive",
    readAction: "Read news",
  },
  es: {
    newEyebrow: "Noticias actuales",
    emptyTitle: "Por ahora no hay noticias.",
    emptyText:
      
      "Cuando tengamos nuevas noticias de IKA apareceran en esta seccion. No dejes de visitarnos para conocer nuestras novedades.",
    archiveTitle: "Archivo de noticias antiguas",
    archiveText: "Informes historicos de IKA, organizados por fecha y mes.",
    archiveAction: "Abrir archivo",
    readAction: "Leer noticia",
  },
  it: {
    newEyebrow: "Notizie attuali",
    emptyTitle: "Per ora non ci sono notizie.",
    emptyText:
      
      "Quando avremo nuove notizie IKA, appariranno in questa sezione. Continua a visitarci per scoprire i nostri aggiornamenti.",
    archiveTitle: "Archivio vecchie notizie",
    archiveText: "Report storici IKA, organizzati per data e mese.",
    archiveAction: "Apri archivio",
    readAction: "Leggi notizia",
  },
  fr: {
    newEyebrow: "Actualites courantes",
    emptyTitle: "Aucune actualite pour le moment.",
    emptyText:
      
      "Lorsque nous aurons de nouvelles actualites IKA, elles apparaitront dans cette section. Revenez nous voir pour decouvrir nos nouveautes.",
    archiveTitle: "Archive des anciennes actualites",
    archiveText: "Rapports historiques IKA, organises par date et par mois.",
    archiveAction: "Ouvrir l'archive",
    readAction: "Lire l'actualite",
  },
  ja: {
    newEyebrow: "\u73fe\u5728\u306e\u30cb\u30e5\u30fc\u30b9",
    emptyTitle: "\u73fe\u5728\u304a\u77e5\u3089\u305b\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
    emptyText:
      "\u0049\u004b\u0041 \u306e\u65b0\u3057\u3044\u30cb\u30e5\u30fc\u30b9\u304c\u516c\u958b\u3055\u308c\u308b\u3068\u3001\u3053\u306e\u30bb\u30af\u30b7\u30e7\u30f3\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002\u6700\u65b0\u60c5\u5831\u3092\u305c\u3072\u307e\u305f\u3054\u89a7\u304f\u3060\u3055\u3044\u3002",
    archiveTitle: "\u904e\u53bb\u306e\u30cb\u30e5\u30fc\u30b9\u30a2\u30fc\u30ab\u30a4\u30d6",
    archiveText: "\u0049\u004b\u0041 \u306e\u904e\u53bb\u306e\u30ec\u30dd\u30fc\u30c8\u3092\u65e5\u4ed8\u3068\u6708\u3054\u3068\u306b\u307e\u3068\u3081\u3066\u3044\u307e\u3059\u3002",
    archiveAction: "\u30a2\u30fc\u30ab\u30a4\u30d6\u3092\u958b\u304f",
    readAction: "\u8a18\u4e8b\u3092\u8aad\u3080",
  },
  zh: {
    newEyebrow: "\u5f53\u524d\u65b0\u95fb",
    emptyTitle: "\u76ee\u524d\u6682\u65e0\u65b0\u95fb\u3002",
    emptyText:
      "\u5f53\u6211\u4eec\u6709\u65b0\u7684 IKA \u8d44\u8baf\u65f6\uff0c\u5b83\u4eec\u5c06\u51fa\u73b0\u5728\u8fd9\u4e2a\u680f\u76ee\u4e2d\u3002\u8bf7\u7ee7\u7eed\u5173\u6ce8\u6211\u4eec\uff0c\u4e86\u89e3\u6700\u65b0\u52a8\u6001\u3002",
    archiveTitle: "\u65e7\u65b0\u95fb\u5f52\u6863",
    archiveText: "\u0049\u004b\u0041 \u7684\u5386\u53f2\u62a5\u544a\uff0c\u6309\u65e5\u671f\u548c\u6708\u4efd\u6574\u7406\u3002",
    archiveAction: "\u6253\u5f00\u5f52\u6863",
    readAction: "\u9605\u8bfb\u65b0\u95fb",
  },
  cs: {
    newEyebrow: "Aktualni novinky",
    emptyTitle: "Prozatim zde nejsou zadne novinky.",
    emptyText:
      
      "Jakmile budeme mit nove zpravy IKA, objevi se v teto sekci. Vracejte se k nam pro dalsi novinky.",
    archiveTitle: "Archiv starych novinek",
    archiveText: "Historicke zpravy IKA usporadane podle data a mesice.",
    archiveAction: "Otevrit archiv",
    readAction: "Cist novinku",
  },
  id: {
    newEyebrow: "Berita terkini",
    emptyTitle: "Belum ada berita untuk saat ini.",
    emptyText:
      
      "Saat ada berita baru dari IKA, berita itu akan muncul di bagian ini. Tetap kunjungi kami untuk mengetahui pembaruan terbaru.",
    archiveTitle: "Arsip berita lama",
    archiveText: "Laporan historis IKA, diatur berdasarkan tanggal dan bulan.",
    archiveAction: "Buka arsip",
    readAction: "Baca berita",
  },
  ms: {
    newEyebrow: "Berita semasa",
    emptyTitle: "Belum ada berita buat masa ini.",
    emptyText:
      
      "Apabila ada berita baharu daripada IKA, ia akan dipaparkan di bahagian ini. Terus kunjungi kami untuk mengetahui perkembangan terkini.",
    archiveTitle: "Arkib berita lama",
    archiveText: "Laporan sejarah IKA, disusun mengikut tarikh dan bulan.",
    archiveAction: "Buka arkib",
    readAction: "Baca berita",
  },
  eu: {
    newEyebrow: "Egungo albisteak",
    emptyTitle: "Oraingoz ez dago albisterik.",
    emptyText:
      
      "IKAren albiste berriak ditugunean, atal honetan agertuko dira. Jarraitu gu bisitatzen gure azken berriak ezagutzeko.",
    archiveTitle: "Albiste zaharren artxiboa",
    archiveText: "IKAren txosten historikoak, dataren eta hilaren arabera antolatuta.",
    archiveAction: "Artxiboa ireki",
    readAction: "Albistea irakurri",
  },
  pt: {
    newEyebrow: "Noticias atuais",
    emptyTitle: "De momento nao ha noticias.",
    emptyText:
      
      "Quando tivermos novas noticias da IKA, elas aparecerao nesta secao. Continue a visitar-nos para conhecer as nossas novidades.",
    archiveTitle: "Arquivo de noticias antigas",
    archiveText: "Relatorios historicos da IKA, organizados por data e mes.",
    archiveAction: "Abrir arquivo",
    readAction: "Ler noticia",
  },
  de: {
    newEyebrow: "Aktuelle Nachrichten",
    emptyTitle: "Im Moment gibt es keine Nachrichten.",
    emptyText:
      
      "Sobald es neue IKA-Nachrichten gibt, erscheinen sie in diesem Bereich. Besuchen Sie uns weiter, um unsere Neuigkeiten zu entdecken.",
    archiveTitle: "Archiv alter Nachrichten",
    archiveText: "Historische IKA-Berichte, geordnet nach Datum und Monat.",
    archiveAction: "Archiv offnen",
    readAction: "Nachricht lesen",
  },
};

export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "news");
  const dictionary = getDictionary(safeLocale);
  const labels = newsLabels[safeLocale] ?? newsLabels[defaultLocale]!;
  const news = await getNewNews(safeLocale);

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
              <h2 className="text-2xl font-semibold">
                {news.length > 0 ? labels.newEyebrow : labels.emptyTitle}
              </h2>
            </div>
          </div>

          {news.length > 0 ? (
            <div className="mt-8 grid gap-5">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden border border-[var(--line)] bg-[var(--paper)]"
                >
                  {item.image ? (
                    <div className="bg-[var(--paper)] p-4 sm:p-5">
                      <div className="relative min-h-[240px] overflow-hidden border border-[var(--line)] bg-white sm:min-h-[320px]">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 900px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="p-5 sm:p-6">
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {item.date}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                      {item.excerpt}
                    </p>
                    <Link
                      href={`/${safeLocale}/news/archive/item/${item.slug}`}
                      className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink-blue)]"
                    >
                      {labels.readAction}
                    </Link>
                  </div>
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
