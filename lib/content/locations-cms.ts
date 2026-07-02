import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type MediaRow = {
  id: string;
  storage_path: string;
  alt_text: string | null;
};

type CountryRow = {
  id: string;
  code: string;
  responsible_person: string | null;
  responsible_email: string | null;
  flag_media_id: string | null;
  country_translations: Array<{
    language_code: Locale;
    name: string;
    slug: string;
    description: string | null;
  }>;
};

type DojoRow = {
  id: string;
  country_id: string;
  city: string;
  address: string | null;
  responsible_instructor: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  main_image_media_id: string | null;
  dojo_translations: Array<{
    language_code: Locale;
    name: string;
    slug: string;
    description: string | null;
  }>;
};

export type PublicCountry = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  responsiblePerson: string;
  responsibleEmail: string;
  logoUrl: string;
};

export type PublicDojo = {
  id: string;
  countryId: string;
  countryName: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  responsibleInstructor: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  logoAlt: string;
};

export async function getPublicCountriesAndDojos(locale: Locale) {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return { countries: [], dojos: [] };
  }

  const { data: countriesData } = await supabase
    .from("countries")
    .select(
      "id,code,responsible_person,responsible_email,flag_media_id,country_translations(language_code,name,slug,description)",
    )
    .eq("status", "published")
    .eq("is_public", true)
    .eq("country_translations.language_code", locale)
    .order("code", { ascending: true });

  const countries = ((countriesData ?? []) as CountryRow[]).filter(
    (country) => country.country_translations.length > 0,
  );

  const countryIds = countries.map((country) => country.id);

  const { data: dojosData } =
    countryIds.length > 0
      ? await supabase
          .from("dojos")
          .select(
            "id,country_id,city,address,responsible_instructor,email,phone,website,main_image_media_id,dojo_translations(language_code,name,slug,description)",
          )
          .in("country_id", countryIds)
          .eq("status", "published")
          .eq("is_public", true)
          .eq("dojo_translations.language_code", locale)
          .order("city", { ascending: true })
      : { data: [] };

  const dojos = ((dojosData ?? []) as DojoRow[]).filter(
    (dojo) => dojo.dojo_translations.length > 0,
  );

  const mediaIds = [
    ...countries.map((country) => country.flag_media_id),
    ...dojos.map((dojo) => dojo.main_image_media_id),
  ].filter(Boolean) as string[];

  const mediaById = await getMediaById(supabase, mediaIds);

  const publicCountries = countries.map((country) => {
    const translation = country.country_translations[0];
    const logo = country.flag_media_id
      ? mediaById.get(country.flag_media_id)
      : undefined;

    return {
      id: country.id,
      code: country.code,
      name: translation.name,
      slug: translation.slug,
      description: translation.description ?? "",
      responsiblePerson: country.responsible_person ?? "",
      responsibleEmail: country.responsible_email ?? "",
      logoUrl: logo?.storage_path ?? "",
    };
  });

  const countryNameById = new Map(
    publicCountries.map((country) => [country.id, country.name]),
  );

  const publicDojos = dojos.map((dojo) => {
    const translation = dojo.dojo_translations[0];
    const image = dojo.main_image_media_id
      ? mediaById.get(dojo.main_image_media_id)
      : undefined;

    return {
      id: dojo.id,
      countryId: dojo.country_id,
      countryName: countryNameById.get(dojo.country_id) ?? "",
      name: translation.name,
      slug: translation.slug,
      description: translation.description ?? "",
      city: dojo.city,
      address: dojo.address ?? "",
      responsibleInstructor: dojo.responsible_instructor ?? "",
      email: dojo.email ?? "",
      phone: dojo.phone ?? "",
      website: dojo.website ?? "",
      logoUrl: image?.storage_path ?? "",
      logoAlt: image?.alt_text ?? translation.name,
    };
  });

  return { countries: publicCountries, dojos: publicDojos };
}

async function getMediaById(
  supabase: SupabaseClient,
  ids: string[],
) {
  if (ids.length === 0) {
    return new Map<string, MediaRow>();
  }

  const { data } = await supabase
    .from("media_library")
    .select("id,storage_path,alt_text")
    .in("id", Array.from(new Set(ids)));

  return new Map(
    ((data ?? []) as MediaRow[]).map((media) => [media.id, media]),
  );
}
