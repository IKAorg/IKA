"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
};

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const ariaLabel = switcherLabels[locale] ?? switcherLabels.en!;

  return (
    <details className="group relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-2 border border-[var(--line)] bg-white px-3 text-sm font-semibold uppercase text-[var(--foreground)] transition hover:border-[var(--accent)] [&::-webkit-details-marker]:hidden">
        <span>{locale.toUpperCase()}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-[var(--muted)] transition group-open:rotate-180"
        />
      </summary>

      <nav
        aria-label={ariaLabel}
        className="absolute right-0 z-50 mt-2 grid min-w-44 border border-[var(--line)] bg-white p-2 shadow-[0_18px_44px_rgba(18,20,22,0.12)]"
      >
        {locales.map((item) => {
          const nextParts =
            pathParts.length > 0 ? [item, ...pathParts.slice(1)] : [item];
          const href = `/${nextParts.join("/")}`;

          return (
            <Link
              key={item}
              href={href}
              aria-label={localeLabels[item]}
              aria-current={item === locale ? "page" : undefined}
              className={
                item === locale
                  ? "flex items-center justify-between bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
                  : "flex items-center justify-between px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--paper)] hover:text-[var(--foreground)]"
              }
            >
              <span>{item.toUpperCase()}</span>
              <span className="ml-5 text-xs font-normal normal-case opacity-75">
                {localeLabels[item]}
              </span>
            </Link>
          );
        })}
      </nav>
    </details>
  );
}

const switcherLabels: Partial<Record<Locale, string>> = {
  en: "Language selection",
  es: "Seleccion de idioma",
  it: "Selezione lingua",
  fr: "Selection de langue",
  ja: "\u8a00\u8a9e\u9078\u629e",
  zh: "\u8bed\u8a00\u9009\u62e9",
  cs: "Vyber jazyka",
  id: "Pilihan bahasa",
  ms: "Pilihan bahasa",
  eu: "Hizkuntza aukeraketa",
  pt: "Selecao de idioma",
  de: "Sprachauswahl",
};
