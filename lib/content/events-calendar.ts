import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

export type PublicEvent = {
  id: string;
  startsAt: string;
  endsAt?: string;
  country: string;
  city: string;
  organiser: string;
  type: "taikai" | "grading" | "seminar" | "course" | "meeting";
  translations: Record<
    Locale,
    {
      title: string;
      summary: string;
      locationLabel: string;
    }
  >;
};

export type LocalizedPublicEvent = {
  id: string;
  startsAt: string;
  endsAt?: string;
  country: string;
  city: string;
  organiser: string;
  type: PublicEvent["type"];
  title: string;
  summary: string;
  locationLabel: string;
};

const eventSources: PublicEvent[] = [
  {
    id: "2027-01-10-taikai-tolosa-gipuzkoa",
    startsAt: "2027-01-10T10:00:00+01:00",
    country: "Spain",
    city: "Tolosa, Gipuzkoa",
    organiser: "IKA Spain",
    type: "taikai",
    translations: {
      en: {
        title: "Taikai in Tolosa, Gipuzkoa",
        summary: "International IKA Taikai hosted in Tolosa, Gipuzkoa.",
        locationLabel: "Tolosa, Gipuzkoa, Spain",
      },
      es: {
        title: "Taikai en Tolosa, Gipuzkoa",
        summary: "Taikai internacional IKA celebrado en Tolosa, Gipuzkoa.",
        locationLabel: "Tolosa, Gipuzkoa, España",
      },
      it: {
        title: "Taikai a Tolosa, Gipuzkoa",
        summary: "Taikai internazionale IKA ospitato a Tolosa, Gipuzkoa.",
        locationLabel: "Tolosa, Gipuzkoa, Spagna",
      },
      fr: {
        title: "Taikai à Tolosa, Gipuzkoa",
        summary: "Taikai international IKA organisé à Tolosa, Gipuzkoa.",
        locationLabel: "Tolosa, Gipuzkoa, Espagne",
      },
      ja: {
        title: "トロサ・ギプスコアでの大会",
        summary: "トロサ・ギプスコアで開催されるIKA国際大会。",
        locationLabel: "スペイン、ギプスコア、トロサ",
      },
      zh: {
        title: "托洛萨，吉普斯夸 Taikai",
        summary: "在托洛萨，吉普斯夸举办的 IKA 国际 Taikai。",
        locationLabel: "西班牙，吉普斯夸，托洛萨",
      },
      cs: {
        title: "Taikai v Tolose, Gipuzkoa",
        summary: "Mezinárodní IKA Taikai pořádané v Tolose, Gipuzkoa.",
        locationLabel: "Tolosa, Gipuzkoa, Španělsko",
      },
    },
  },
  {
    id: "2027-01-15-bskf-grading-london",
    startsAt: "2027-01-15T11:00:00+00:00",
    country: "United Kingdom",
    city: "London",
    organiser: "BSKF",
    type: "grading",
    translations: {
      en: {
        title: "BSKF grading examinations in London",
        summary: "Dan grading examinations organised by BSKF in London.",
        locationLabel: "London, United Kingdom",
      },
      es: {
        title: "Exámenes de grado BSKF en Londres",
        summary: "Exámenes de grado dan organizados por BSKF en Londres.",
        locationLabel: "Londres, Reino Unido",
      },
      it: {
        title: "Esami di grado BSKF a Londra",
        summary: "Esami dan organizzati da BSKF a Londra.",
        locationLabel: "Londra, Regno Unito",
      },
      fr: {
        title: "Examens de grade BSKF à Londres",
        summary: "Examens de grade dan organisés par la BSKF à Londres.",
        locationLabel: "Londres, Royaume-Uni",
      },
      ja: {
        title: "ロンドンでのBSKF昇段審査",
        summary: "ロンドンでBSKFが主催する段位審査。",
        locationLabel: "英国、ロンドン",
      },
      zh: {
        title: "伦敦 BSKF 段位考试",
        summary: "由 BSKF 在伦敦组织的段位考试。",
        locationLabel: "英国伦敦",
      },
      cs: {
        title: "Zkoušky stupňů BSKF v Londýně",
        summary: "Danové zkoušky pořádané BSKF v Londýně.",
        locationLabel: "Londýn, Spojené království",
      },
    },
  },
];

export function getFallbackPublicEvents(locale: Locale): LocalizedPublicEvent[] {
  return eventSources
    .filter((event) => Boolean(event.startsAt))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .map((event) => {
      const copy =
        event.translations[locale] ?? event.translations[defaultLocale];

      return {
        id: event.id,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        country: event.country,
        city: event.city,
        organiser: event.organiser,
        type: event.type,
        title: copy.title,
        summary: copy.summary,
        locationLabel: copy.locationLabel,
      };
    });
}

type SupabaseEventRow = {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  countries: { name: string | null } | null;
  dojos: { name: string | null; city: string | null } | null;
  event_translations: Array<{
    language_code: string;
    title: string;
    excerpt: string | null;
    location_label: string | null;
  }>;
};

export async function getPublicEvents(
  locale: Locale,
): Promise<LocalizedPublicEvent[]> {
  const url = getSupabaseProjectUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return getFallbackPublicEvents(locale);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("events")
    .select(
      "id,status,starts_at,ends_at,countries(name),dojos(name,city),event_translations(language_code,title,excerpt,location_label)",
    )
    .eq("status", "published")
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true })
    .returns<SupabaseEventRow[]>();

  if (error || !data || data.length === 0) {
    return getFallbackPublicEvents(locale);
  }

  return data.map((event) => {
    const translation =
      event.event_translations.find(
        (item) => item.language_code === locale,
      ) ??
      event.event_translations.find(
        (item) => item.language_code === defaultLocale,
      ) ??
      event.event_translations[0];
    const country = event.countries?.name ?? "";
    const city = event.dojos?.city ?? "";
    const locationLabel =
      translation?.location_label ??
      [city, country].filter(Boolean).join(", ") ??
      country;

    return {
      id: event.id,
      startsAt: event.starts_at ?? "",
      endsAt: event.ends_at ?? undefined,
      country,
      city,
      organiser: event.dojos?.name ?? country,
      type: "seminar",
      title: translation?.title ?? "IKA event",
      summary: translation?.excerpt ?? "",
      locationLabel,
    };
  });
}
