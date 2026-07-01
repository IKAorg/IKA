import { isLocale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const content = getPublicPageContent(isLocale(locale) ? locale : "en", "about");

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        {content.title}
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-5 text-base leading-8 text-[var(--muted)]">
          <p>{content.intro}</p>
          {content.blocks?.[0] ? <p>{content.blocks[0].text}</p> : null}
        </div>
        <aside className="border-l border-[var(--line)] pl-6">
          <h2 className="text-xl font-semibold">{content.blocks?.[1]?.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {content.blocks?.[1]?.text}
          </p>
        </aside>
      </div>
    </section>
  );
}
