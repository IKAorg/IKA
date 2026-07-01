import Link from "next/link";
import { Mail } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const content = getPublicPageContent(
    isLocale(locale) ? locale : "en",
    "contact",
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        {content.title}
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        {content.intro}
      </p>
      <div className="mt-8 max-w-2xl border border-[var(--line)] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center bg-[var(--ink-blue)] text-white">
            <Mail size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-[var(--muted)]">{content.emailLabel}</p>
            <Link
              href="mailto:internationalkempoassociation@gmail.com"
              className="font-semibold"
            >
              internationalkempoassociation@gmail.com
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
