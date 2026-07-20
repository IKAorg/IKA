import type { Locale } from "./config";
import { extendedArchiveLabels } from "./extended-public-locales";

export const archiveLabels: Partial<
  Record<
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
  >
> = {
  en: {
    eyebrow: "Old news archive",
    title: "Historical IKA news",
    intro:
      "Archive of historical IKA reports, organised by date and month.",
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
      "Archivo de informes historicos de IKA, organizados por fecha y mes.",
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
      "Archivio dei report storici IKA, organizzati per data e mese.",
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
      "Archive des rapports historiques IKA, organisee par date et par mois.",
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
      "Historical IKA reports, organised by date and month.",
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
      "Historical IKA reports, organised by date and month.",
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
      "Archiv historickych zprav IKA usporadany podle data a mesice.",
    all: "Vše",
    months: "Archiv",
    category: "Kategorie",
    read: "Otevřít starou novinku",
    noImage: "Archiv",
  },
};

Object.assign(archiveLabels, extendedArchiveLabels);
