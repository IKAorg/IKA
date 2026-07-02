import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type JoinPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function JoinPage({ params }: JoinPageProps) {
  const { locale } = await params;
  const content = await getEditablePublicPageContent(
    isLocale(locale) ? locale : "en",
    "join",
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
      <PublicContentBlocks blocks={content.blocks} />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {content.steps?.map((step) => (
          <Step key={step.number} number={step.number} title={step.title} text={step.text} />
        ))}
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[var(--line)] bg-white p-5">
      <span className="text-sm font-semibold text-[var(--accent)]">{number}</span>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
