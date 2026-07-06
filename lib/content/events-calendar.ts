import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

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

const eventSources: PublicEvent[] = [];

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
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return getFallbackPublicEvents(locale);
  }

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
