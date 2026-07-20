import { defaultLocale, type Locale } from "@/lib/i18n/config";

export type AdminCopyDictionary = Record<string, string>;

export function resolveAdminCopy(
  locale: Locale,
  dictionaries: Partial<Record<Locale, AdminCopyDictionary>>,
) {
  return (
    dictionaries[locale] ??
    dictionaries[defaultLocale] ??
    dictionaries.en ??
    {}
  );
}
