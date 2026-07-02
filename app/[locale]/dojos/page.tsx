import Image from "next/image";
import { isLocale, type Locale } from "@/lib/i18n/config";
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
  const labels = dojoPageLabels[safeLocale];

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
                      alt={`${country.name} flag`}
                      width={44}
                      height={32}
                      className="h-8 w-11 object-contain"
                    />
                  ) : (
                    <span className="flex h-8 w-11 items-center justify-center border border-[var(--line)] bg-white text-lg">
                      {getFlagFallback(country.code)}
                    </span>
                  )}
                  <h2 className="text-2xl font-semibold">{country.name}</h2>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {dojos
                    .filter((dojo) => dojo.countryId === country.id)
                    .map((dojo) => (
                      <article
                        key={dojo.id}
                        className="border border-[var(--line)] bg-white p-5"
                      >
                        <div className="flex items-start gap-4">
                          {dojo.logoUrl ? (
                            <Image
                              src={dojo.logoUrl}
                              alt={dojo.logoAlt}
                              width={64}
                              height={64}
                              className="size-14 object-contain"
                            />
                          ) : null}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                              {dojo.city}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold">
                              {dojo.name}
                            </h3>
                          </div>
                        </div>
                        {dojo.description ? (
                          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                            {dojo.description}
                          </p>
                        ) : null}
                        <dl className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
                          {dojo.address ? (
                            <InfoLine label={labels.address} value={dojo.address} />
                          ) : null}
                          {dojo.responsibleInstructor ? (
                            <InfoLine
                              label={labels.instructor}
                              value={dojo.responsibleInstructor}
                            />
                          ) : null}
                          {dojo.phone ? (
                            <InfoLine label={labels.phone} value={dojo.phone} />
                          ) : null}
                          {dojo.email ? (
                            <InfoLine label="Email" value={dojo.email} />
                          ) : null}
                          {dojo.website ? (
                            <div>
                              <dt className="font-semibold text-black">Web</dt>
                              <dd>
                                <a
                                  href={normalizeUrl(dojo.website)}
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
                      </article>
                    ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="mt-10 border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
          {labels.empty}
        </div>
      )}
    </section>
  );
}

const dojoPageLabels: Record<
  Locale,
  {
    empty: string;
    address: string;
    instructor: string;
    phone: string;
  }
> = {
  en: {
    empty: "There are no public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  es: {
    empty: "Aun no hay dojos publicos.",
    address: "Direccion",
    instructor: "Instructor",
    phone: "Telefono",
  },
  it: {
    empty: "Non ci sono ancora dojo pubblici.",
    address: "Indirizzo",
    instructor: "Istruttore",
    phone: "Telefono",
  },
  fr: {
    empty: "Aucun dojo public pour le moment.",
    address: "Adresse",
    instructor: "Instructeur",
    phone: "Telephone",
  },
  ja: {
    empty: "There are no public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  zh: {
    empty: "There are no public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  cs: {
    empty: "Zatim nejsou zverejnena zadna dojo.",
    address: "Adresa",
    instructor: "Instruktor",
    phone: "Telefon",
  },
};

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-black">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function getFlagFallback(code: string) {
  const fallbackByCode: Record<string, string> = {
    CH: "\u{1F1E8}\u{1F1ED}",
    CR: "\u{1F1E8}\u{1F1F7}",
    CZ: "\u{1F1E8}\u{1F1FF}",
    ES: "\u{1F1EA}\u{1F1F8}",
    GB: "\u{1F1EC}\u{1F1E7}",
    HK: "\u{1F1ED}\u{1F1F0}",
    IE: "\u{1F1EE}\u{1F1EA}",
    IT: "\u{1F1EE}\u{1F1F9}",
    JP: "\u{1F1EF}\u{1F1F5}",
    "ID-MY": "\u{1F1EE}\u{1F1E9} \u{1F1F2}\u{1F1FE}",
  };

  return fallbackByCode[code] ?? code.slice(0, 2).toUpperCase();
}
