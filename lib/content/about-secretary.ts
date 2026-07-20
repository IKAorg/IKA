import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { Locale } from "@/lib/i18n/config";

type SecretaryTranslation = {
  title: string;
  body: string;
  photoAlt: string;
};

type SecretarySettings = {
  name: string;
  photoUrl: string;
  translations?: Partial<Record<Locale, SecretaryTranslation>>;
};

export type PublicSecretaryGeneral = {
  name: string;
  title: string;
  body: string;
  photoUrl: string;
  photoAlt: string;
};

export async function getPublicSecretaryGeneral(
  locale: Locale,
): Promise<PublicSecretaryGeneral | null> {
  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "about_secretary_general")
    .maybeSingle();

  const value = data?.value as SecretarySettings | undefined;

  if (!value?.name) {
    return null;
  }

  const translations = value.translations ?? {};
  const current =
    translations[locale] ??
    translations.es ??
    translations.en ??
    Object.values(translations)[0];

  return {
    name: value.name,
    title: current?.title ?? "",
    body: current?.body ?? "",
    photoUrl: value.photoUrl ?? "",
    photoAlt: current?.photoAlt ?? value.name,
  };
}
