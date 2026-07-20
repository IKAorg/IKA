export const locales = [
  "en",
  "es",
  "it",
  "fr",
  "ja",
  "zh",
  "cs",
  "id",
  "ms",
  "eu",
  "pt",
  "de",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Espa\u00f1ol",
  it: "Italiano",
  fr: "Fran\u00e7ais",
  ja: "\u65e5\u672c\u8a9e",
  zh: "\u4e2d\u6587",
  cs: "\u010ce\u0161tina",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  eu: "Euskara",
  pt: "Portugu\u00eas",
  de: "Deutsch",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
