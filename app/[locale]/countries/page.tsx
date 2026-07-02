import Image from "next/image";
import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getPublicCountriesAndDojos } from "@/lib/content/locations-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type CountriesPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function CountriesPage({ params }: CountriesPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "countries");
  const { countries } = await getPublicCountriesAndDojos(safeLocale);

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
      {countries.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {countries.map((country) => (
            <article
              key={country.id}
              className="border border-[var(--line)] bg-white"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {country.logoUrl ? (
                    <Image
                      src={country.logoUrl}
                      alt={`${country.name} flag`}
                      width={44}
                      height={32}
                      className="mt-1 h-8 w-11 object-contain"
                    />
                  ) : null}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {country.code}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {country.name}
                    </h2>
                  </div>
                </div>

                {country.description ? (
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {country.description}
                  </p>
                ) : null}

                <details className="mt-5 border-t border-[var(--line)] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Responsable del país
                  </summary>
                  <div className="mt-3 grid gap-1 text-sm leading-6 text-[var(--muted)]">
                    <p>{country.responsiblePerson || "Pendiente"}</p>
                    {country.responsibleEmail ? (
                      <a
                        className="font-semibold text-[var(--accent)]"
                        href={`mailto:${country.responsibleEmail}`}
                      >
                        {country.responsibleEmail}
                      </a>
                    ) : null}
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      ) : !content.hasCmsBlocks ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.countries?.map((country) => (
            <div key={country} className="border border-[var(--line)] bg-white p-4">
              {country}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
