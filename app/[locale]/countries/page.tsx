import Image from "next/image";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
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
  const { countries, dojos } = await getPublicCountriesAndDojos(safeLocale);
  const labels = countryPageLabels[safeLocale];

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
        <div id="countries-list" className="mt-10 grid gap-3">
          {countries.map((country) => {
            const countryDojos = dojos.filter(
              (dojo) => dojo.countryId === country.id,
            );

            return (
              <details
                key={country.id}
                className="group border border-[var(--line)] bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden">
                  <span className="flex min-w-0 items-center gap-4">
                    {country.logoUrl ? (
                      <Image
                        src={country.logoUrl}
                        alt={`${country.name} flag`}
                        width={44}
                        height={32}
                        className="mt-1 h-8 w-11 object-contain"
                      />
                    ) : (
                      <span className="flex h-8 w-11 items-center justify-center border border-[var(--line)] bg-[var(--paper)] text-lg">
                        {getFlagFallback(country.code)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        {country.code}
                      </p>
                      <span className="mt-1 block truncate text-xl font-semibold">
                        {country.name}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--accent)] group-open:hidden">
                    {labels.openCountry}
                  </span>
                  <span className="hidden shrink-0 text-sm font-semibold text-[var(--accent)] group-open:inline">
                    {labels.closeCountry}
                  </span>
                </summary>

                <div className="border-t border-[var(--line)] p-5">

                  {country.description ? (
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                      {country.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 lg:grid-cols-[0.85fr_1.15fr]">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {labels.countryContact}
                      </h3>
                      <div className="mt-3 grid gap-1 text-sm leading-6 text-[var(--muted)]">
                        <p>{country.responsiblePerson || labels.pending}</p>
                        {country.responsibleEmail ? (
                          <a
                            className="font-semibold text-[var(--accent)]"
                            href={`mailto:${country.responsibleEmail}`}
                          >
                            {country.responsibleEmail}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">
                          {labels.countryDojos}
                        </h3>
                        <Link
                          href={`/${safeLocale}/dojos`}
                          className="text-sm font-semibold text-[var(--accent)]"
                        >
                          {labels.openDirectory}
                        </Link>
                      </div>
                      <div className="mt-3 grid gap-3">
                        {countryDojos.map((dojo) => (
                          <div
                            key={dojo.id}
                            className="border border-[var(--line)] bg-[var(--paper)] p-4"
                          >
                            <div className="flex items-start gap-3">
                              {dojo.logoUrl ? (
                                <Image
                                  src={dojo.logoUrl}
                                  alt={dojo.logoAlt}
                                  width={44}
                                  height={44}
                                  className="size-10 object-contain"
                                />
                              ) : null}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                                  {dojo.city}
                                </p>
                                <h4 className="mt-1 text-lg font-semibold">
                                  {dojo.name}
                                </h4>
                              </div>
                            </div>
                            {dojo.description ? (
                              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                                {dojo.description}
                              </p>
                            ) : null}
                            <dl className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
                              {dojo.address ? (
                                <InfoLine
                                  label={labels.address}
                                  value={dojo.address}
                                />
                              ) : null}
                              {dojo.responsibleInstructor ? (
                                <InfoLine
                                  label={labels.instructor}
                                  value={dojo.responsibleInstructor}
                                />
                              ) : null}
                              {dojo.phone ? (
                                <InfoLine
                                  label={labels.phone}
                                  value={dojo.phone}
                                />
                              ) : null}
                              {dojo.email ? (
                                <InfoLine label="Email" value={dojo.email} />
                              ) : null}
                            </dl>
                          </div>
                        ))}
                        {countryDojos.length === 0 ? (
                          <p className="text-sm text-[var(--muted)]">
                            {labels.noDojos}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-[var(--line)] pt-4">
                    <a
                      href="#countries-list"
                      className="text-sm font-semibold text-[var(--accent)]"
                    >
                      {labels.backToCountries}
                    </a>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      ) : !content.hasCmsBlocks ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.countries?.map((country) => (
            <div
              key={country}
              className="border border-[var(--line)] bg-white p-4"
            >
              {country}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const countryPageLabels: Record<
  Locale,
  {
    countryContact: string;
    countryDojos: string;
    openDirectory: string;
    openCountry: string;
    closeCountry: string;
    backToCountries: string;
    pending: string;
    noDojos: string;
    address: string;
    instructor: string;
    phone: string;
  }
> = {
  en: {
    countryContact: "Country contact",
    countryDojos: "Dojos in this country",
    openDirectory: "Open dojo directory",
    openCountry: "Open",
    closeCountry: "Close",
    backToCountries: "Back to countries",
    pending: "Pending",
    noDojos: "No public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  es: {
    countryContact: "Responsable del pais",
    countryDojos: "Dojos de este pais",
    openDirectory: "Abrir directorio de dojos",
    openCountry: "Abrir",
    closeCountry: "Cerrar",
    backToCountries: "Volver a paises",
    pending: "Pendiente",
    noDojos: "Aun no hay dojos publicos.",
    address: "Direccion",
    instructor: "Instructor",
    phone: "Telefono",
  },
  it: {
    countryContact: "Responsabile del paese",
    countryDojos: "Dojo in questo paese",
    openDirectory: "Apri directory dojo",
    openCountry: "Apri",
    closeCountry: "Chiudi",
    backToCountries: "Torna ai paesi",
    pending: "In attesa",
    noDojos: "Non ci sono ancora dojo pubblici.",
    address: "Indirizzo",
    instructor: "Istruttore",
    phone: "Telefono",
  },
  fr: {
    countryContact: "Responsable du pays",
    countryDojos: "Dojos dans ce pays",
    openDirectory: "Ouvrir l'annuaire des dojos",
    openCountry: "Ouvrir",
    closeCountry: "Fermer",
    backToCountries: "Retour aux pays",
    pending: "En attente",
    noDojos: "Aucun dojo public pour le moment.",
    address: "Adresse",
    instructor: "Instructeur",
    phone: "Telephone",
  },
  ja: {
    countryContact: "Country contact",
    countryDojos: "Dojos in this country",
    openDirectory: "Open dojo directory",
    openCountry: "Open",
    closeCountry: "Close",
    backToCountries: "Back to countries",
    pending: "Pending",
    noDojos: "No public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  zh: {
    countryContact: "Country contact",
    countryDojos: "Dojos in this country",
    openDirectory: "Open dojo directory",
    openCountry: "Open",
    closeCountry: "Close",
    backToCountries: "Back to countries",
    pending: "Pending",
    noDojos: "No public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    phone: "Phone",
  },
  cs: {
    countryContact: "Kontakt v zemi",
    countryDojos: "Dojo v teto zemi",
    openDirectory: "Otevrit adresar dojo",
    openCountry: "Otevrit",
    closeCountry: "Zavrit",
    backToCountries: "Zpet na zeme",
    pending: "Ceka na doplneni",
    noDojos: "Zatim nejsou zverejnena zadna dojo.",
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
