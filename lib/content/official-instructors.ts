import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { extendedOfficialInstructorsPageCopy } from "@/lib/i18n/extended-public-locales";

type ChiefNoteTranslation = {
  note: string;
};

export type OfficialInstructor = {
  id: string;
  name: string;
  grade: string;
  photo: string;
  photoAlt: string;
  country: string;
  chiefNote: string;
  isChiefInstructor: boolean;
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
};

const pageCopyByLocale: Partial<Record<Locale, OfficialInstructorsPageCopy>> = {
  en: {
    eyebrow: "Official instructors",
    title: "Official IKA instructors",
    intro:
      
      "Meet the official IKA instructors.",
    gradeLabel: "Grade",
    countryLabel: "Country of origin",
    noGrade: "Confirmed instructor",
    empty: "There are no official instructors published yet.",
    chiefBadge: "IKA Chief Instructor",
  },
  es: {
    eyebrow: "Instructores oficiales",
    title: "Instructores oficiales de IKA",
    intro:
      
      "Conoce a los instructores oficiales de IKA.",
    gradeLabel: "Grado",
    countryLabel: "Pais de origen",
    noGrade: "Instructor confirmado",
    empty: "Todavia no hay instructores oficiales publicados.",
    chiefBadge: "IKA Chief Instructor",
  },
  it: {
    eyebrow: "Istruttori ufficiali",
    title: "Istruttori ufficiali IKA",
    intro:
      
      "Conosci gli istruttori ufficiali IKA.",
    gradeLabel: "Grado",
    countryLabel: "Paese di origine",
    noGrade: "Istruttore confermato",
    empty: "Non ci sono ancora istruttori ufficiali pubblicati.",
    chiefBadge: "IKA Chief Instructor",
  },
  fr: {
    eyebrow: "Instructeurs officiels",
    title: "Instructeurs officiels de l'IKA",
    intro:
      
      "Decouvrez les instructeurs officiels de l'IKA.",
    gradeLabel: "Grade",
    countryLabel: "Pays d'origine",
    noGrade: "Instructeur confirme",
    empty: "Aucun instructeur officiel n'est encore publie.",
    chiefBadge: "IKA Chief Instructor",
  },
  ja: {
    eyebrow: "公認指導者",
    title: "IKA 公認指導者",
    intro: "\u0049\u004b\u0041 \u306e\u516c\u5f0f\u6307\u5c0e\u8005\u3092\u3054\u7d39\u4ecb\u3057\u307e\u3059\u3002",
    gradeLabel: "段位",
    countryLabel: "出身国",
    noGrade: "公認指導者",
    empty: "公開中の公認指導者はまだいません。",
    chiefBadge: "IKA Chief Instructor",
  },
  zh: {
    eyebrow: "IKA 正式教练",
    title: "IKA 正式教练",
    intro: "\u8ba4\u8bc6 IKA \u5b98\u65b9\u6559\u7ec3\u3002",
    gradeLabel: "段位",
    countryLabel: "原籍国家",
    noGrade: "已确认教练",
    empty: "目前还没有已发布的正式教练。",
    chiefBadge: "IKA Chief Instructor",
  },
  cs: {
    eyebrow: "Oficialni instruktori",
    title: "Oficialni instruktori IKA",
    intro:
      
      "Seznamte se s oficialnimi instruktory IKA.",
    gradeLabel: "Stupen",
    countryLabel: "Zeme puvodu",
    noGrade: "Potvrzeny instruktor",
    empty: "Zatim nejsou zverejneni zadni oficialni instruktori.",
    chiefBadge: "IKA Chief Instructor",
  },
};

export async function getOfficialInstructors(locale: Locale = defaultLocale) {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return [] as OfficialInstructor[];
  }

  const { data, error } = await supabase
    .from("official_instructors")
    .select("id,full_name,grade,country_name,chief_note,chief_note_translations,photo_url,photo_alt,sort_order,is_visible,is_chief_instructor")
    .eq("is_visible", true)
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
      chiefNote: translatedNote,
      isChiefInstructor: item.is_chief_instructor,
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
