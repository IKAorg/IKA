import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getArchiveDetail } from "./archive-details";
import { getLatestReports, type LatestReport } from "./latest-reports";

export type ArchiveNewsItem = LatestReport & {
  month: string;
};

const localImageBySlug: Record<string, string> = {
  "ika-seminar-in-sicily-june-2023": "/images/reports/sicily.webp",
  "ika-training-and-grading-in-indonesia-february-2023":
    "/images/reports/indonesia.webp",
  "grading-results": "/images/reports/grading.webp",
  "condolences-message": "/images/reports/condolences.webp",
  "porkemi-indonesia-accepted-to-national-olympic-committee":
    "/images/reports/porkemi.webp",
  "report-from-international-seminar-in-spain": "/images/reports/spain.webp",
};

const olderArchiveItems: ArchiveNewsItem[] = [
  {
    date: "18/6/2019",
    month: "06-2019",
    title: "Report from seminar in Switzerland",
    excerpt:
      "The annual international seminar in Switzerland, and the second in this summer's series of European seminars, was hosted once again in Neuchatel.",
    image: "/images/reports/archive/report-from-seminar-in-switzerland.jpg",
    slug: "report-from-seminar-in-switzerland",
  },
  {
    date: "10/6/2019",
    month: "06-2019",
    title: "Report from seminar in Czech Republic",
    excerpt:
      "The first of this summer's international seminars was held in Karlovy Vary, Czech Republic, with guests from several IKA member countries.",
    image:
      "/images/reports/archive/report-from-ika-seminar-in-czech-republic.jpg",
    slug: "report-from-ika-seminar-in-czech-republic",
  },
  {
    date: "8/10/2018",
    month: "10-2018",
    title: "Report from IKA Leaders Seminar, Cyprus 2018",
    excerpt:
      "IKA members from Hong Kong, Ireland, Japan, Switzerland and the UK came together for an intensive leaders seminar in Cyprus.",
    image:
      "/images/reports/archive/report-from-ika-leaders-seminar-cyprus-2018.jpg",
    slug: "report-from-ika-leaders-seminar-cyprus-2018",
  },
  {
    date: "10/5/2018",
    month: "05-2018",
    title: "Report from 3rd IKA Seminar, UK",
    excerpt:
      "The third IKA seminar was held in Bristol, UK, attended by kenshi from Czech Republic, Ireland, Japan, Spain, Switzerland and the UK.",
    image: "/images/reports/archive/report-from-3rd-ika-seminar-uk.jpg",
    slug: "report-from-3rd-ika-seminar-uk",
  },
  {
    date: "9/5/2017",
    month: "05-2017",
    title: "Report from 2nd IKA Taikai, Spain",
    excerpt:
      "The 2nd IKA taikai was held in Beasain in the Basque region of Spain and marked the 35th anniversary of Shorinji Kempo in the region.",
    image: "/images/reports/archive/report-from-2nd-ika-taikai-spain.jpg",
    slug: "report-from-2nd-ika-taikai-spain",
  },
  {
    date: "22/2/2017",
    month: "02-2017",
    title: "BSKF 2017 University Training Seminar Report",
    excerpt:
      "The BSKF annual University Training Seminar was hosted in Glasgow, welcoming students from across the UK and Ireland.",
    image:
      "/images/reports/archive/bskf-2017-university-training-seminar-report.jpg",
    slug: "bskf-2017-university-training-seminar-report",
  },
  {
    date: "17/10/2016",
    month: "10-2016",
    title: "Report from 2016 Leader's Seminar",
    excerpt:
      "The IKA annual leaders seminar returned to Cyprus with advanced training, principles, shakujo practice and shared study.",
    image: "/images/ika-logo.webp",
    slug: "report-from-2016-leaders-seminar",
  },
  {
    date: "24/7/2016",
    month: "07-2016",
    title: "Report from IKA Taikai, Czech Republic",
    excerpt:
      "The first IKA International Taikai took place in Karlovy Vary, Czech Republic, with instructors and students from several member countries.",
    image:
      "/images/reports/archive/report-from-ika-taikai-czech-republic.jpg",
    slug: "report-from-ika-taikai-czech-republic",
  },
  {
    date: "25/5/2016",
    month: "05-2016",
    title: "Report from Swiss Seminar (2016)",
    excerpt:
      "IKA members from the UK and Spain joined students from across Switzerland for a two day seminar in Neuchatel.",
    image: "/images/reports/archive/report-from-swiss-seminar-2016.jpg",
    slug: "report-from-swiss-seminar-2016",
  },
  {
    date: "5/11/2015",
    month: "11-2015",
    title: "BSKF report from 1st IKA Seminar in Kobe, Japan",
    excerpt:
      "A report from the first IKA Seminar in Kobe, Japan, originally written by Will Ng and republished for the IKA archive.",
    image: "/images/ika-logo.webp",
    slug: "bskf-report-from-1st-ika-seminar-in-kobe-japan",
  },
  {
    date: "30/10/2015",
    month: "10-2015",
    title: "Return to the original spirit",
    excerpt:
      "The International Kempo Association was officially launched in October 2015 at the inaugural IKA seminar in Kobe, Japan.",
    image: "/images/ika-logo.webp",
    slug: "post-1",
  },
];

const monthBySlug: Record<string, string> = {
  "ika-seminar-in-sicily-june-2023": "06-2023",
  "ika-training-and-grading-in-indonesia-february-2023": "02-2023",
  "grading-results": "10-2022",
  "condolences-message": "11-2021",
  "porkemi-indonesia-accepted-to-national-olympic-committee": "10-2019",
  "report-from-international-seminar-in-spain": "06-2019",
};

export const archiveMonths = [
  "06-2023",
  "02-2023",
  "10-2022",
  "11-2021",
  "10-2019",
  "06-2019",
  "10-2018",
  "05-2018",
  "05-2017",
  "02-2017",
  "10-2016",
  "07-2016",
  "05-2016",
  "11-2015",
  "10-2015",
] as const;

export type ArchiveMonth = (typeof archiveMonths)[number];

export function isArchiveMonth(value: string): value is ArchiveMonth {
  return archiveMonths.includes(value as ArchiveMonth);
}

export function getArchiveNews(locale: Locale): ArchiveNewsItem[] {
  const migrated = getLatestReports(locale).map((report) => ({
    ...report,
    image:
      getArchiveDetail(locale, report.slug)?.heroImage ??
      localImageBySlug[report.slug] ??
      report.image,
    excerpt: getArchiveDetail(locale, report.slug)?.excerpt ?? report.excerpt,
    month: monthBySlug[report.slug] ?? "",
  }));

  return [...migrated, ...olderArchiveItems].map((item) => {
    const detail = getArchiveDetail(locale, item.slug);

    return {
      ...item,
      title: detail?.title || item.title,
      image: detail?.heroImage || item.image,
      excerpt: detail?.excerpt || item.excerpt,
    };
  });
}

export function getArchiveNewsByMonth(locale: Locale, month: string) {
  return getArchiveNews(locale).filter((item) => item.month === month);
}

export function getArchiveNewsItem(locale: Locale, slug: string) {
  return getArchiveNews(locale).find((item) => item.slug === slug);
}

export function getNewNews(): LatestReport[] {
  return [];
}

export function getArchiveMonthLabel(month: string, locale: Locale = defaultLocale) {
  const [rawMonth, year] = month.split("-");
  const date = new Date(Number(year), Number(rawMonth) - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getDefaultArchiveNews() {
  return getArchiveNews(defaultLocale);
}
