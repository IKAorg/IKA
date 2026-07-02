import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";

type PhilosophyPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function PhilosophyPage({ params }: PhilosophyPageProps) {
  const { locale } = await params;
  const content = await getEditablePublicPageContent(
    isLocale(locale) ? locale : "en",
    "philosophy",
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
      <blockquote className="mt-8 max-w-3xl border-l-4 border-[var(--accent)] pl-6 text-2xl font-semibold leading-tight text-[var(--ink-blue)]">
        “{content.quote}”
      </blockquote>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {content.blocks?.map((block) => (
          <TextBlock key={block.title} title={block.title} text={block.text} />
        ))}
      </div>
    </section>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-t border-[var(--line)] pt-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
