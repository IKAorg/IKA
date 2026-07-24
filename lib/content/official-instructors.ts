import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { extendedOfficialInstructorsPageCopy } from "@/lib/i18n/extended-public-locales";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type ChiefNoteTranslation = {
  note: string;
};

export type OfficialRoleCategory = "instructor" | "examiner" | "judge";

export type OfficialInstructor = {
  id: string;
  name: string;
  grade: string;
  photo: string;
  photoAlt: string;
  country: string;
  flagUrls: string[];
  chiefNote: string;
  isChiefInstructor: boolean;
  roleCategory: OfficialRoleCategory;
};

export type OfficialInstructorsPageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  gradeLabel: string;
  countryLabel: string;
  noGrade: string;
  empty: string;
  chiefBadge: string;
  officialBadge: string;
  instructorsSection: string;
  examinersSection: string;
  judgesSection: string;
  officialExaminerBadge: string;
  officialJudgeBadge: string;
};

type OfficialInstructorRow = {
  id: string;
  full_name: string;
  grade: string | null;
  country_name: string;
  chief_note: string | null;
  chief_note_translations?: Partial<Record<Locale, ChiefNoteTranslation>> | null;
  photo_url: string | null;
  photo_alt: string | null;
  sort_order: number;
  is_visible: boolean;
  is_chief_instructor: boolean;
  role_category: OfficialRoleCategory | null;
};

const pageCopyByLocale: Partial<Record<Locale, OfficialInstructorsPageCopy>> = {
  en: {
    eyebrow: "Official instructors",
    title: "Official IKA instructors",
    intro: "Meet the official IKA instructors.",
    gradeLabel: "Grade",
    countryLabel: "Country of origin",
    noGrade: "Confirmed instructor",
    empty: "There are no official instructors published yet.",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "Official IKA Instructor",
    instructorsSection: "Official instructors",
    examinersSection: "Official examiners",
    judgesSection: "Official judges",
    officialExaminerBadge: "Official IKA Examiner",
    officialJudgeBadge: "Official IKA Judge",
  },
  es: {
    eyebrow: "Instructores oficiales",
    title: "Instructores oficiales de IKA",
    intro: "Conoce a los instructores oficiales de IKA.",
    gradeLabel: "Grado",
    countryLabel: "Pais de origen",
    noGrade: "Instructor confirmado",
    empty: "Todavia no hay instructores oficiales publicados.",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "Instructor oficial IKA",
    instructorsSection: "Instructores oficiales",
    examinersSection: "Examinadores oficiales",
    judgesSection: "Jueces oficiales",
    officialExaminerBadge: "Examinador oficial IKA",
    officialJudgeBadge: "Juez oficial IKA",
  },
  it: {
    eyebrow: "Istruttori ufficiali",
    title: "Istruttori ufficiali IKA",
    intro: "Conosci gli istruttori ufficiali IKA.",
    gradeLabel: "Grado",
    countryLabel: "Paese di origine",
    noGrade: "Istruttore confermato",
    empty: "Non ci sono ancora istruttori ufficiali pubblicati.",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "Istruttore ufficiale IKA",
    instructorsSection: "Istruttori ufficiali",
    examinersSection: "Esaminatori ufficiali",
    judgesSection: "Giudici ufficiali",
    officialExaminerBadge: "Esaminatore ufficiale IKA",
    officialJudgeBadge: "Giudice ufficiale IKA",
  },
  fr: {
    eyebrow: "Instructeurs officiels",
    title: "Instructeurs officiels de l'IKA",
    intro: "Decouvrez les instructeurs officiels de l'IKA.",
    gradeLabel: "Grade",
    countryLabel: "Pays d'origine",
    noGrade: "Instructeur confirme",
    empty: "Aucun instructeur officiel n'est encore publie.",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "Instructeur officiel IKA",
    instructorsSection: "Instructeurs officiels",
    examinersSection: "Examinateurs officiels",
    judgesSection: "Juges officiels",
    officialExaminerBadge: "Examinateur officiel IKA",
    officialJudgeBadge: "Juge officiel IKA",
  },
  ja: {
    eyebrow: "IKA 公認指導者",
    title: "IKA 公認指導者",
    intro: "IKA の公式指導者をご紹介します。",
    gradeLabel: "段位",
    countryLabel: "出身国",
    noGrade: "公認指導者",
    empty: "公開中の公認指導者はまだいません。",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "IKA 公認指導者",
    instructorsSection: "IKA 公認指導者",
    examinersSection: "IKA 公認審査員",
    judgesSection: "IKA 公認審判",
    officialExaminerBadge: "IKA 公認審査員",
    officialJudgeBadge: "IKA 公認審判",
  },
  zh: {
    eyebrow: "IKA 正式教练",
    title: "IKA 正式教练",
    intro: "认识 IKA 官方教练。",
    gradeLabel: "段位",
    countryLabel: "原籍国家",
    noGrade: "已确认教练",
    empty: "目前还没有已发布的正式教练。",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "IKA 正式教练",
    instructorsSection: "IKA 正式教练",
    examinersSection: "IKA 正式考官",
    judgesSection: "IKA 正式裁判",
    officialExaminerBadge: "IKA 正式考官",
    officialJudgeBadge: "IKA 正式裁判",
  },
  cs: {
    eyebrow: "Oficialni instruktori",
    title: "Oficialni instruktori IKA",
    intro: "Seznamte se s oficialnimi instruktory IKA.",
    gradeLabel: "Stupen",
    countryLabel: "Zeme puvodu",
    noGrade: "Potvrzeny instruktor",
    empty: "Zatim nejsou zverejneni zadni oficialni instruktori.",
    chiefBadge: "IKA Chief Instructor",
    officialBadge: "Oficialni instruktor IKA",
    instructorsSection: "Oficialni instruktori",
    examinersSection: "Oficialni examinatori",
    judgesSection: "Oficialni rozhodci",
    officialExaminerBadge: "Oficialni examiner IKA",
    officialJudgeBadge: "Oficialni rozhodci IKA",
  },
};

export async function getOfficialInstructors(locale: Locale = defaultLocale) {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return [] as OfficialInstructor[];
  }

  const { data, error } = await supabase
    .from("official_instructors")
    .select(
      "id,full_name,grade,country_name,chief_note,chief_note_translations,photo_url,photo_alt,sort_order,is_visible,is_chief_instructor,role_category",
    )
    .eq("is_visible", true)
    .order("role_category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return [] as OfficialInstructor[];
  }

  return ((data ?? []) as OfficialInstructorRow[]).map((item) => {
    const translations = item.chief_note_translations ?? {};
    const translatedNote =
      translations[locale]?.note ??
      translations.es?.note ??
      translations.en?.note ??
      Object.values(translations)[0]?.note ??
      item.chief_note ??
      "";

    return {
      id: item.id,
      name: item.full_name,
      grade: item.grade ?? "",
      photo: item.photo_url ?? "",
      photoAlt: item.photo_alt ?? item.full_name,
      country: item.country_name,
      flagUrls: getInstructorCountryFlagUrls(item.country_name),
      chiefNote: translatedNote,
      isChiefInstructor: item.is_chief_instructor,
      roleCategory: item.role_category ?? "instructor",
    };
  });
}

export function getOfficialInstructorsPageCopy(locale: Locale) {
  return (
    (extendedOfficialInstructorsPageCopy[locale] as OfficialInstructorsPageCopy | undefined) ??
    pageCopyByLocale[locale] ??
    (extendedOfficialInstructorsPageCopy[defaultLocale] as OfficialInstructorsPageCopy | undefined) ??
    pageCopyByLocale[defaultLocale]!
  );
}

function getInstructorCountryFlagUrls(countryName: string) {
  const normalized = countryName.trim().toUpperCase();

  const flagCodeByCountryName: Record<string, string[]> = {
    UK: ["gb"],
    "UNITED KINGDOM": ["gb"],
    "GREAT BRITAIN": ["gb"],
    JAPAN: ["jp"],
    JAPON: ["jp"],
    "JAPÓN": ["jp"],
    SWITZERLAND: ["ch"],
    SUIZA: ["ch"],
    SUISSE: ["ch"],
    SVIZZERA: ["ch"],
  };

  return (
    flagCodeByCountryName[normalized]?.map(
      (flagCode) => `https://flagcdn.com/w40/${flagCode}.png`,
    ) ?? []
  );
}
