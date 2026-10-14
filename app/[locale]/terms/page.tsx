import { notFound } from "next/navigation";
import { LegalPage } from "@/components/public/legal-page";
import { isLocale } from "@/lib/i18n/config";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} type="terms" />;
}
