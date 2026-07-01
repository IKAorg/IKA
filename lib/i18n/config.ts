export const locales = ["en", "es", "it", "fr", "ja", "zh", "cs"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  it: "Italiano",
  fr: "Français",
  ja: "日本語",
  zh: "中文",
  cs: "Čeština",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
