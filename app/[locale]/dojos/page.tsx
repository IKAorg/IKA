import Image from "next/image";
import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { getPublicCountriesAndDojos } from "@/lib/content/locations-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type DojosPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function DojosPage({ params }: DojosPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "dojos");
  const { countries, dojos } = await getPublicCountriesAndDojos(safeLocale);

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
      {dojos.length > 0 ? (
        <div className="mt-10 grid gap-8">
          {countries
            .filter((country) =>
              dojos.some((dojo) => dojo.countryId === country.id),
            )
            .map((country) => (
              <section key={country.id}>
                <div className="mb-4 flex items-center gap-3">
                  {country.logoUrl ? (
                    <Image
                      src={country.logoUrl}
                      alt={`${country.name} logo`}
                      width={52}
                      height={52}
                      className="size-12 object-contain"
                    />
                  ) : null}
                  <h2 className="text-2xl font-semibold">{country.name}</h2>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {dojos
                    .filter((dojo) => dojo.countryId === country.id)
                    .map((dojo) => (
                      <article
                        key={dojo.id}
                        className="overflow-hidden border border-[var(--line)] bg-white"
                      >
                        {dojo.imageUrl ? (
                          <Image
                            src={dojo.imageUrl}
                            alt={dojo.imageAlt}
                            width={900}
                            height={520}
                            className="h-52 w-full object-cover"
                          />
                        ) : null}
                        <div className="p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                            {dojo.city}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold">
                            {dojo.name}
                          </h3>
                          {dojo.description ? (
                            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                              {dojo.description}
                            </p>
                          ) : null}
                          <dl className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted)]">
                            {dojo.address ? (
                              <InfoLine label="Dirección" value={dojo.address} />
                            ) : null}
                            {dojo.responsibleInstructor ? (
                              <InfoLine
                                label="Instructor"
                                value={dojo.responsibleInstructor}
                              />
                            ) : null}
                            {dojo.phone ? (
                              <InfoLine label="Teléfono" value={dojo.phone} />
                            ) : null}
                            {dojo.email ? (
                              <InfoLine label="Email" value={dojo.email} />
                            ) : null}
                            {dojo.website ? (
                              <div>
                                <dt className="font-semibold text-black">Web</dt>
                                <dd>
                                  <a
                                    href={dojo.website}
                                    className="font-semibold text-[var(--accent)]"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {dojo.website}
                                  </a>
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))}
        </div>
      ) : null}
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-black">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
