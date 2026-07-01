import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";
import type { getDictionary } from "@/lib/i18n/dictionaries";

type SiteShellProps = {
  locale: Locale;
  dictionary: ReturnType<typeof getDictionary>;
  children: React.ReactNode;
};

export function SiteShell({ locale, dictionary, children }: SiteShellProps) {
  const nav = dictionary.nav;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--background)]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <Image
              src="/images/ika-logo.webp"
              alt="International Kempo Association"
              width={44}
              height={44}
              className="size-11 object-contain"
              priority
            />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              International Kempo Association
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
            <Link href={`/${locale}`}>{nav.home}</Link>
            <Link href={`/${locale}/about`}>{nav.about}</Link>
            <Link href={`/${locale}/philosophy`}>{nav.philosophy}</Link>
            <Link href={`/${locale}/countries`}>{nav.countries}</Link>
            <Link href={`/${locale}/dojos`}>{nav.dojos}</Link>
            <Link href={`/${locale}/events`}>{nav.events}</Link>
            <Link href={`/${locale}/join`}>{nav.join}</Link>
            <Link href={`/${locale}/contact`}>{nav.contact}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/portal`}
              className="hidden border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink-blue)] sm:inline-flex"
            >
              {nav.portal}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <span>IKA Platform foundation</span>
          <div className="flex flex-wrap gap-3">
            {locales.map((item) => (
              <Link
                key={item}
                href={`/${item}`}
                className={item === locale ? "text-black" : "text-[var(--muted)]"}
              >
                {localeLabels[item]}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
