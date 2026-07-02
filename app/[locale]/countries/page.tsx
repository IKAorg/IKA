import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type CountriesPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function CountriesPage({ params }: CountriesPageProps) {
  const { locale } = await params;
  const content = await getEditablePublicPageContent(
    isLocale(locale) ? locale : "en",
    "countries",
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{content.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        {content.intro}
      </p>
      <PublicContentBlocks blocks={content.blocks} />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {content.countries?.map((country) => (
          <div key={country} className="border border-[var(--line)] bg-white p-4">
            {country}
          </div>
        ))}
      </div>
    </section>
  );
}
