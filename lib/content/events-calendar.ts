import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type PublicEvent = {
  id: string;
  startsAt: string;
  endsAt?: string;
  image?: string;
  imageAlt?: string;
  country: string;
  city: string;
  organiser: string;
  type:
    | "event"
    | "taikai"
    | "grading"
    | "seminar"
    | "course"
    | "meeting"
    | "encounter"
    | "busen";
  isOfficialIka?: boolean;
  allowMemberRegistration?: boolean;
  registrationOpen?: boolean;
  tshirtEnabled?: boolean;
  translations: Record<
    Locale,
    {
      title: string;
      summary: string;
      locationLabel: string;
      slug?: string;
      body?: string;
    }
  >;
};

export type LocalizedPublicEvent = {
  id: string;
  startsAt: string;
  endsAt?: string;
  image?: string;
  imageAlt?: string;
  country: string;
  city: string;
  organiser: string;
  type: PublicEvent["type"];
  isOfficialIka?: boolean;
  allowMemberRegistration?: boolean;
  registrationOpen?: boolean;
  tshirtEnabled?: boolean;
  title: string;
  summary: string;
  locationLabel: string;
  slug?: string;
  body?: string;
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
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  event_type: PublicEvent["type"] | null;
  is_official_ika?: boolean | null;
  allow_member_registration?: boolean | null;
  registration_open?: boolean | null;
  tshirt_enabled?: boolean | null;
  countries:
    | {
        code: string | null;
        country_translations?: Array<{ language_code: string; name: string }>;
      }
    | null;
  dojos:
    | {
        city: string | null;
        dojo_translations?: Array<{ language_code: string; name: string }>;
      }
    | null;
  event_translations: Array<{
    language_code: string;
    title: string;
    slug?: string | null;
    excerpt: string | null;
    body?: string | null;
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
      "id,status,starts_at,ends_at,cover_image_url,cover_image_alt,event_type,is_official_ika,allow_member_registration,registration_open,tshirt_enabled,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name)),event_translations(language_code,title,slug,excerpt,body,location_label)",
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
    const country =
      getLocalizedName(event.countries?.country_translations, locale) ??
      getLocalizedName(event.countries?.country_translations, defaultLocale) ??
      event.countries?.code ??
      "";
    const city = event.dojos?.city ?? "";
    const locationLabel =
      translation?.location_label ??
      [city, country].filter(Boolean).join(", ") ??
      country;

    const isPast = isEventPast(event.starts_at, event.ends_at);

    return {
      id: event.id,
      startsAt: event.starts_at ?? "",
      endsAt: event.ends_at ?? undefined,
      image: event.cover_image_url ?? "",
      imageAlt: event.cover_image_alt ?? translation?.title ?? "IKA event",
      country,
      city,
      organiser:
        getLocalizedName(event.dojos?.dojo_translations, locale) ??
        getLocalizedName(event.dojos?.dojo_translations, defaultLocale) ??
        country,
      type: event.event_type ?? "event",
      isOfficialIka: Boolean(event.is_official_ika),
      allowMemberRegistration: Boolean(event.allow_member_registration),
      registrationOpen: !isPast && Boolean(event.registration_open),
      tshirtEnabled: Boolean(event.tshirt_enabled),
      title: translation?.title ?? "IKA event",
      summary: translation?.excerpt ?? "",
      locationLabel,
      slug: translation?.slug ?? "",
      body: translation?.body ?? "",
    };
  });
}

export async function getPublicEventBySlug(
  locale: Locale,
  slug: string,
): Promise<LocalizedPublicEvent | null> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("event_translations")
    .select(
      "language_code,title,slug,excerpt,body,location_label,events!inner(id,status,starts_at,ends_at,cover_image_url,cover_image_alt,event_type,is_official_ika,allow_member_registration,registration_open,tshirt_enabled,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name)))",
    )
    .eq("slug", slug)
    .returns<
      Array<{
        language_code: string;
        title: string;
        slug: string;
        excerpt: string | null;
        body: string | null;
        location_label: string | null;
        events: {
          id: string;
          status: string;
          starts_at: string | null;
          ends_at: string | null;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          event_type: PublicEvent["type"] | null;
          is_official_ika?: boolean | null;
          allow_member_registration?: boolean | null;
          registration_open?: boolean | null;
          tshirt_enabled?: boolean | null;
          countries:
            | {
                code: string | null;
                country_translations?: Array<{ language_code: string; name: string }>;
              }
            | null;
          dojos:
            | {
                city: string | null;
                dojo_translations?: Array<{ language_code: string; name: string }>;
              }
            | null;
        } | null;
      }>
    >();

  if (error || !data || data.length === 0) {
    return null;
  }

  const publishedRows = data.filter((row) => row.events?.status === "published");
  const baseRow = publishedRows[0];

  if (!baseRow?.events) {
    return null;
  }

  const event = baseRow.events;
  const translations = publishedRows;
  const current =
    translations.find((item) => item.language_code === locale) ??
    translations.find((item) => item.language_code === defaultLocale) ??
    translations[0];
  const isPast = isEventPast(event.starts_at, event.ends_at);
  const country =
    getLocalizedName(event.countries?.country_translations, locale) ??
    getLocalizedName(event.countries?.country_translations, defaultLocale) ??
    event.countries?.code ??
    "";
  const city = event.dojos?.city ?? "";
  const locationLabel =
    current?.location_label ?? [city, country].filter(Boolean).join(", ");

  return {
    id: event.id,
    startsAt: event.starts_at ?? "",
    endsAt: event.ends_at ?? undefined,
    image: event.cover_image_url ?? "",
    imageAlt: event.cover_image_alt ?? current?.title ?? slug,
    country,
    city,
    organiser:
      getLocalizedName(event.dojos?.dojo_translations, locale) ??
      getLocalizedName(event.dojos?.dojo_translations, defaultLocale) ??
      country,
    type: event.event_type ?? "event",
    isOfficialIka: Boolean(event.is_official_ika),
    allowMemberRegistration: Boolean(event.allow_member_registration),
    registrationOpen: !isPast && Boolean(event.registration_open),
    tshirtEnabled: Boolean(event.tshirt_enabled),
    title: current?.title ?? "IKA event",
    summary: current?.excerpt ?? "",
    locationLabel,
    slug: current?.slug ?? slug,
    body: current?.body ?? "",
  };
}

function getLocalizedName(
  translations:
    | Array<{ language_code: string; name: string }>
    | undefined,
  locale: Locale,
) {
  return translations?.find((item) => item.language_code === locale)?.name;
}

function isEventPast(startsAt: string | null, endsAt: string | null) {
  const compareDate = endsAt || startsAt;

  if (!compareDate) {
    return false;
  }

  const timestamp = Date.parse(compareDate);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
}
