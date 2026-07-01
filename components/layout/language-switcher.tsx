"use client";

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

  return (
    <nav
      aria-label="Language selection"
      className="flex flex-wrap items-center justify-end gap-1"
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
                ? "border border-[var(--accent)] bg-[var(--accent)] px-2.5 py-1.5 text-xs font-semibold text-white"
                : "border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }
          >
            {item.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
