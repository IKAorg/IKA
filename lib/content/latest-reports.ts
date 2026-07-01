export type LatestReport = {
  date: string;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
};

export const latestReports: LatestReport[] = [
  {
    date: "30/6/2023",
    title: "IKA seminar in Sicily, June 2023",
    excerpt:
      "The first European IKA seminar since covid was organised by Dojo Messina in Sicily, with members from Italy, Switzerland and the UK.",
    image: "/images/reports/sicily.webp",
    slug: "ika-seminar-in-sicily-june-2023",
  },
  {
    date: "28/2/2023",
    title: "IKA training and grading in Indonesia, February 2023",
    excerpt:
      "Senior IKA instructors travelled to West Java, Indonesia for training and grading with local members.",
    image: "/images/reports/indonesia.webp",
    slug: "ika-training-and-grading-in-indonesia-february-2023",
  },
  {
    date: "7/10/2022",
    title: "Grading results",
    excerpt:
      "A summary of grading results and association updates from IKA members.",
    image: "/images/reports/grading.webp",
    slug: "grading-results",
  },
  {
    date: "22/11/2021",
    title: "Messages of condolences",
    excerpt:
      "Messages from the IKA family in memory and solidarity.",
    image: "/images/reports/condolences.webp",
    slug: "condolences-message",
  },
  {
    date: "12/10/2019",
    title: "Porkemi (Indonesia) accepted to National Olympic Committee",
    excerpt:
      "A recognition milestone for Porkemi and Indonesian Kempo.",
    image: "/images/reports/porkemi.webp",
    slug: "porkemi-indonesia-accepted-to-national-olympic-committee",
  },
  {
    date: "25/6/2019",
    title: "Report from international seminar in Spain",
    excerpt:
      "Report from an international seminar hosted in Spain with IKA members training together.",
    image: "/images/reports/spain.webp",
    slug: "report-from-international-seminar-in-spain",
  },
];
