import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import type { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "./language-switcher";
import { PortalSessionBadge } from "./portal-session-badge";

type SiteShellProps = {
  locale: Locale;
  dictionary: ReturnType<typeof getDictionary>;
  children: React.ReactNode;
};

export function SiteShell({ locale, dictionary, children }: SiteShellProps) {
  const nav = dictionary.nav;
  const instructorsLabel =
    instructorNavLabels[locale] ?? instructorNavLabels.en!;
  const brandLabel = brandLabels[locale] ?? brandLabels.en!;
  const publicLinks = [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/about`, label: nav.about },
    { href: `/${locale}/instructors`, label: instructorsLabel },
    { href: `/${locale}/countries`, label: nav.countries },
    { href: `/${locale}/news`, label: nav.news },
    { href: `/${locale}/events`, label: nav.events },
    { href: `/${locale}/join`, label: nav.join },
    { href: `/${locale}/contact`, label: nav.contact },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5">
          <Link
            href={`/${locale}`}
            className="flex min-w-0 items-center gap-3"
            aria-label={brandLabel}
          >
            <Image
              src="/images/ika-logo.webp"
              alt={brandLabel}
              width={48}
              height={48}
              className="size-12 object-contain"
              priority
            />
            <span className="hidden min-w-0 leading-tight sm:grid">
              <span className="truncate text-lg font-semibold uppercase text-[var(--foreground)]">
                IKA
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {brandLabel}
              </span>
            </span>
          </Link>

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-[var(--muted)] xl:flex">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <PortalSessionBadge locale={locale} />
            <LanguageSwitcher locale={locale} />
            <Link
              href={`/${locale}/portal`}
              className="inline-flex min-h-11 items-center border border-[var(--accent)] bg-[var(--accent)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-dark)] sm:px-4"
            >
              {nav.portal}
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] px-4 py-3 text-sm font-medium text-[var(--muted)] sm:px-5 xl:hidden">
          {publicLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center transition hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-sm text-[var(--muted)] md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <Image
                src="/images/ika-logo.webp"
                alt={brandLabel}
                width={52}
                height={52}
                className="size-13 object-contain"
              />
              <span className="max-w-64 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                {brandLabel}
              </span>
            </Link>
            <p className="mt-5 max-w-md leading-7">
              {dictionary.footer.summary}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
              {dictionary.footer.webTitle}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {publicLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
              {dictionary.footer.contactTitle}
            </h2>
            <div className="mt-4 space-y-3">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex border border-[var(--line)] px-4 py-2 font-semibold text-[var(--ink-blue)]"
              >
                {nav.contact}
              </Link>
              <Link
                href={`/${locale}/portal`}
                className="inline-flex border border-[var(--line)] px-4 py-2 font-semibold text-[var(--ink-blue)]"
              >
                {nav.portal}
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--line)] px-5 py-4 text-center text-xs leading-6 text-[var(--muted)]">
          {dictionary.footer.legal}
        </div>
      </footer>
    </div>
  );
}

const instructorNavLabels: Partial<Record<Locale, string>> = {
  en: "Official instructors",
  es: "Instructores oficiales",
  it: "Istruttori ufficiali",
  fr: "Instructeurs officiels",
  ja: "公認指導者",
  zh: "IKA 正式教练",
  cs: "Oficialni instruktori",
  id: "Instruktur resmi",
  ms: "Jurulatih rasmi",
  eu: "Irakasle ofizialak",
  pt: "Instrutores oficiais",
  de: "Offizielle Instruktoren",
};

const brandLabels: Partial<Record<Locale, string>> = {
  en: "International Kempo Association",
  es: "International Kempo Association",
  it: "International Kempo Association",
  fr: "International Kempo Association",
  ja: "International Kempo Association",
  zh: "International Kempo Association",
  cs: "International Kempo Association",
  id: "International Kempo Association",
  ms: "International Kempo Association",
  eu: "International Kempo Association",
  pt: "International Kempo Association",
  de: "International Kempo Association",
};
