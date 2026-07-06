import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

type DojosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DojosPage({ params }: DojosPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";

  redirect(`/${safeLocale}/countries`);
}
