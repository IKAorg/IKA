import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import {
  getAboutQuote,
  getAboutSections,
} from "@/lib/i18n/public-pages";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";
import { getPublicSecretaryGeneral } from "@/lib/content/about-secretary";
import { extendedAboutLabels } from "@/lib/i18n/extended-public-locales";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "about");
  const dictionary = getDictionary(safeLocale);
  const aboutSections = getAboutSections(safeLocale);
  const quote = getAboutQuote(safeLocale);
  const secretary = await getPublicSecretaryGeneral(safeLocale);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
        <Link
          href={`/${safeLocale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {dictionary.nav.home}
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {content.intro}
        </p>
        {content.hasCmsBlocks ? (
          <PublicContentBlocks blocks={content.blocks} />
        ) : null}
      </section>

      {secretary ? (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-5 sm:pb-16">
          <article className="border border-[var(--line)] bg-white p-4 sm:p-5 md:p-6">
            <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              {secretary.photoUrl ? (
                <Image
                  src={secretary.photoUrl}
                  alt={secretary.photoAlt}
                  width={360}
                  height={420}
                  className="h-[220px] w-full object-cover md:h-[220px] md:w-[180px]"
                />
              ) : (
                <div className="flex h-[220px] w-full items-center justify-center bg-[var(--paper)] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:w-[180px]">
                  {extendedAboutLabels[safeLocale]?.secretary ??
                    aboutLabels[safeLocale]?.secretary ??
                    aboutLabels[defaultLocale]!.secretary}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  {extendedAboutLabels[safeLocale]?.secretary ??
                    aboutLabels[safeLocale]?.secretary ??
                    aboutLabels[defaultLocale]!.secretary}
                </p>
                <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
                  {secretary.name}
                </h2>
                {secretary.title ? (
                  <p className="mt-2 text-base font-semibold text-[var(--ink-blue)]">
                    {secretary.title}
                  </p>
                ) : null}
                {secretary.body ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] md:text-base">
                    {secretary.body}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {!content.hasCmsBlocks ? (
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-5 sm:pb-16">
        <div className="grid gap-8">
          {aboutSections.map((section, index) => (
            <article
              key={section.title}
              className="grid overflow-hidden border border-[var(--line)] bg-white lg:grid-cols-[0.34fr_0.66fr]"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <Image
                  src={section.image}
                  alt={section.title}
                  width={900}
                  height={700}
                  className="h-full min-h-[260px] w-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="mt-5 space-y-4 text-base leading-8 text-[var(--muted)]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 text-base leading-7 text-[var(--muted)]">
                    {section.bullets.map((item) => (
                      <li
                        key={item}
                        className="border-l-2 border-[var(--accent)] pl-4"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.note ? (
                  <p className="mt-5 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                    {section.note}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <blockquote className="mt-10 border-l-4 border-[var(--accent)] bg-white p-4 text-xl font-semibold leading-tight text-[var(--ink-blue)] sm:p-6 sm:text-2xl">
          {quote.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </blockquote>

      </section>
      ) : null}
    </div>
  );
}

const aboutLabels: Partial<Record<Locale, { secretary: string }>> = {
  en: { secretary: "Secretary General" },
  es: { secretary: "Secretario general" },
  it: { secretary: "Segretario generale" },
  fr: { secretary: "Secretaire general" },
  ja: { secretary: "IKA事務総長" },
  zh: { secretary: "IKA秘书长" },
  cs: { secretary: "Generalni tajemnik" },
  id: { secretary: "Sekretaris Jenderal" },
  ms: { secretary: "Setiausaha Agung" },
  eu: { secretary: "Idazkari nagusia" },
  pt: { secretary: "Secretario-geral" },
  de: { secretary: "Generalsekretar" },
};
