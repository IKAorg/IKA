import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type DojosPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function DojosPage({ params }: DojosPageProps) {
  const { locale } = await params;
  const content = await getEditablePublicPageContent(
    isLocale(locale) ? locale : "en",
    "dojos",
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{content.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
        {content.intro}
      </p>
      <PublicContentBlocks blocks={content.blocks} />
    </section>
  );
}
