import type { Locale } from "@/lib/i18n/config";

const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AT", "AU", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO", "BR",
  "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CL",
  "CM", "CN", "CO", "CR", "CV", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO",
  "DZ", "EC", "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FM", "FR", "GA",
  "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HK",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN", "IQ", "IR", "IS", "IT",
  "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW",
  "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MR", "MT",
  "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL", "NO",
  "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL", "PT", "PW",
  "PY", "QA", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG",
  "SI", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SY", "SZ",
  "TD", "TG", "TH", "TJ", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW",
  "TZ", "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VN", "VU", "WS",
  "YE", "ZA", "ZM", "ZW",
] as const;

const NAME_OVERRIDES: Partial<
  Record<Locale, Partial<Record<(typeof COUNTRY_CODES)[number], string>>>
> = {
  en: {
    CZ: "Czech Republic",
  },
  es: {
    CZ: "Republica Checa",
    GB: "Reino Unido",
    HK: "Hong Kong",
    US: "Estados Unidos",
  },
};

export type CountryCatalogItem = {
  code: string;
  name: string;
};

export function getCountryCatalog(locale: Locale): CountryCatalogItem[] {
  const displayNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null;

  return COUNTRY_CODES.map((code) => {
    const override = NAME_OVERRIDES[locale]?.[code];
    const name = override ?? displayNames?.of(code) ?? code;
    return { code, name };
  }).sort((left, right) => left.name.localeCompare(right.name, locale));
}

