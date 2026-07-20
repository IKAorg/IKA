import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SiteShell } from "@/components/layout/site-shell";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  return {
    title: "IKA Platform",
    description: `International Kempo Association platform (${locale}).`,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <SiteShell locale={locale} dictionary={dictionary}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
