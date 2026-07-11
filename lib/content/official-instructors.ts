import { defaultLocale, type Locale } from "@/lib/i18n/config";

export type OfficialInstructor = {
  id: string;
  name: string;
  grade?: string;
  photo?: string;
  photoAlt?: string;
  countryByLocale: Partial<Record<Locale, string>>;
};

export type OfficialInstructorsPageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  gradeLabel: string;
  countryLabel: string;
  noGrade: string;
};

const instructors: OfficialInstructor[] = [
  {
    id: "mizuno",
    name: "T. Mizuno",
    countryByLocale: {
      en: "Japan",
      es: "Japón",
      it: "Giappone",
      fr: "Japon",
      ja: "日本",
      zh: "日本",
      cs: "Japonsko",
    },
  },
  {
    id: "bazz-smith",
    name: "Bazz Smith",
    countryByLocale: {
      en: "United Kingdom",
      es: "Reino Unido",
      it: "Regno Unito",
      fr: "Royaume-Uni",
      ja: "英国",
      zh: "英国",
      cs: "Spojene kralovstvi",
    },
  },
  {
    id: "alvaro-calvo-pineira",
    name: "Alvaro Calvo Pineira",
    grade: "4 Dan",
    countryByLocale: {
      en: "Spain",
      es: "España",
      it: "Spagna",
      fr: "Espagne",
      ja: "スペイン",
      zh: "西班牙",
      cs: "Spanelsko",
    },
  },
];

const pageCopyByLocale: Record<Locale, OfficialInstructorsPageCopy> = {
  en: {
    eyebrow: "Official instructors",
    title: "Official IKA instructors",
    intro:
      "Meet the official IKA instructors. This public directory shows their names, current grade, and country of origin.",
    gradeLabel: "Grade",
    countryLabel: "Country of origin",
    noGrade: "Confirmed instructor",
  },
  es: {
    eyebrow: "Instructores oficiales",
    title: "Instructores oficiales de IKA",
    intro:
      "Conoce a los instructores oficiales de IKA. Este directorio publico muestra su nombre, grado actual y pais de origen.",
    gradeLabel: "Grado",
    countryLabel: "Pais de origen",
    noGrade: "Instructor confirmado",
  },
  it: {
    eyebrow: "Istruttori ufficiali",
    title: "Istruttori ufficiali IKA",
    intro:
      "Conosci gli istruttori ufficiali IKA. Questa directory pubblica mostra nome, grado attuale e paese di origine.",
    gradeLabel: "Grado",
    countryLabel: "Paese di origine",
    noGrade: "Istruttore confermato",
  },
  fr: {
    eyebrow: "Instructeurs officiels",
    title: "Instructeurs officiels de l'IKA",
    intro:
      "Decouvrez les instructeurs officiels de l'IKA. Cet annuaire public affiche leur nom, leur grade actuel et leur pays d'origine.",
    gradeLabel: "Grade",
    countryLabel: "Pays d'origine",
    noGrade: "Instructeur confirme",
  },
  ja: {
    eyebrow: "公認指導者",
    title: "IKA 公認指導者",
    intro:
      "IKA の公認指導者を紹介します。氏名、現在の段位、出身国を公開ディレクトリとして表示します。",
    gradeLabel: "段位",
    countryLabel: "出身国",
    noGrade: "公認指導者",
  },
  zh: {
    eyebrow: "IKA 正式教练",
    title: "IKA 正式教练",
    intro:
      "查看 IKA 正式教练名单。本公开目录展示姓名、当前段位和所属原籍国家。",
    gradeLabel: "段位",
    countryLabel: "原籍国家",
    noGrade: "已确认教练",
  },
  cs: {
    eyebrow: "Oficialni instruktori",
    title: "Oficialni instruktori IKA",
    intro:
      "Seznamte se s oficialnimi instruktory IKA. Tento verejny adresar zobrazuje jmeno, aktualni stupen a zemi puvodu.",
    gradeLabel: "Stupen",
    countryLabel: "Zeme puvodu",
    noGrade: "Potvrzeny instruktor",
  },
};

export function getOfficialInstructors(locale: Locale) {
  return instructors.map((instructor) => ({
    ...instructor,
    country:
      instructor.countryByLocale[locale] ??
      instructor.countryByLocale[defaultLocale] ??
      "",
  }));
}

export function getOfficialInstructorsPageCopy(locale: Locale) {
  return pageCopyByLocale[locale] ?? pageCopyByLocale[defaultLocale];
}
