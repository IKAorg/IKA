import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import {
  getAboutQuote,
  getAboutSections,
} from "@/lib/i18n/public-pages";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

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

  return (
    <div>
      <section className="mx-auto max-w-7xl px-5 py-14">
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
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          {content.intro}
        </p>
        {content.hasCmsBlocks ? (
          <PublicContentBlocks blocks={content.blocks} />
        ) : null}
      </section>

      {!content.hasCmsBlocks ? (
      <section className="mx-auto max-w-7xl px-5 pb-16">
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
              <div className="p-6 md:p-8">
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

        <blockquote className="mt-10 border-l-4 border-[var(--accent)] bg-white p-6 text-2xl font-semibold leading-tight text-[var(--ink-blue)]">
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
