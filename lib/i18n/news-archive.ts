import type { Locale } from "./config";

export const archiveLabels: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    all: string;
    months: string;
    category: string;
    read: string;
    noImage: string;
  }
> = {
  en: {
    eyebrow: "Old news archive",
    title: "Historical IKA news",
    intro:
      "Archive of reports migrated from the previous IKA website. New articles will be published in the main news section from the admin panel.",
    all: "All",
    months: "Archives",
    category: "Category",
    read: "Open old news",
    noImage: "Archive",
  },
  es: {
    eyebrow: "Archivo de noticias antiguas",
    title: "Noticias históricas de IKA",
    intro:
      "Archivo de informes migrados desde la web anterior de IKA. Las noticias nuevas se publicarán en la sección principal desde el panel de administración.",
    all: "Todas",
    months: "Archivos",
    category: "Categoría",
    read: "Abrir noticia antigua",
    noImage: "Archivo",
  },
  it: {
    eyebrow: "Archivio vecchie notizie",
    title: "Notizie storiche IKA",
    intro:
      "Archivio dei report migrati dal precedente sito IKA. I nuovi articoli saranno pubblicati nella sezione notizie principale dal pannello admin.",
    all: "Tutte",
    months: "Archivi",
    category: "Categoria",
    read: "Apri vecchia notizia",
    noImage: "Archivio",
  },
  fr: {
    eyebrow: "Archive des anciennes actualités",
    title: "Actualités historiques IKA",
    intro:
      "Archive des rapports migrés depuis l'ancien site IKA. Les nouveaux articles seront publiés dans la section actualités principale depuis l'administration.",
    all: "Toutes",
    months: "Archives",
    category: "Catégorie",
    read: "Ouvrir l'ancienne actualité",
    noImage: "Archive",
  },
  ja: {
    eyebrow: "旧ニュースアーカイブ",
    title: "IKA過去ニュース",
    intro:
      "以前のIKAウェブサイトから移行したレポートのアーカイブです。新しい記事は管理画面からメインニュースに公開されます。",
    all: "すべて",
    months: "アーカイブ",
    category: "カテゴリー",
    read: "旧ニュースを開く",
    noImage: "アーカイブ",
  },
  zh: {
    eyebrow: "旧新闻档案",
    title: "IKA 历史新闻",
    intro:
      "从旧 IKA 网站迁移的报告档案。新文章将从管理面板发布到主新闻区域。",
    all: "全部",
    months: "档案",
    category: "类别",
    read: "打开旧新闻",
    noImage: "档案",
  },
  cs: {
    eyebrow: "Archiv starých novinek",
    title: "Historické novinky IKA",
    intro:
      "Archiv zpráv převedených z předchozího webu IKA. Nové články budou publikovány v hlavní sekci novinek z administračního panelu.",
    all: "Vše",
    months: "Archiv",
    category: "Kategorie",
    read: "Otevřít starou novinku",
    noImage: "Archiv",
  },
};
