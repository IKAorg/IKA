import { defaultLocale, type Locale } from "@/lib/i18n/config";

const localeByCountryCode: Record<string, Locale> = {
  AT: "de",
  BE: "fr",
  BR: "pt",
  CH: "de",
  CN: "zh",
  CZ: "cs",
  DE: "de",
  ES: "es",
  FR: "fr",
  GB: "en",
  HK: "zh",
  ID: "id",
  IE: "en",
  IT: "it",
  JP: "ja",
  MY: "ms",
  PT: "pt",
  UK: "en",
  US: "en",
};

export function getLocaleForCountryCode(code: string | null | undefined): Locale {
  const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  return localeByCountryCode[normalizedCode] ?? defaultLocale;
}
