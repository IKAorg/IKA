import Image from "next/image";
import { ExternalLink, UserRound } from "lucide-react";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
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
  const labels = countryPageLabels[safeLocale] ?? countryPageLabels[defaultLocale]!;
  const officialCountries = countries.filter((country) => !isAssociatedCountry(country));
  const associatedCountries = countries.filter(isAssociatedCountry);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{content.title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
        {content.intro}
      </p>
      <PublicContentBlocks blocks={content.blocks} />
      {countries.length > 0 ? (
        <div id="countries-list" className="mt-10 grid gap-10">
          <CountrySection
            title={labels.officialMembers ?? "Members"}
            countries={officialCountries}
            dojos={dojos}
            labels={labels}
            locale={safeLocale}
          />
          <CountrySection
            title={labels.associatedMembers ?? "Associated members"}
            countries={associatedCountries}
            dojos={dojos}
            labels={labels}
            locale={safeLocale}
          />
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

function CountrySection({
  title,
  countries,
  dojos,
  labels,
  locale,
}: {
  title: string;
  countries: Awaited<ReturnType<typeof getPublicCountriesAndDojos>>["countries"];
  dojos: Awaited<ReturnType<typeof getPublicCountriesAndDojos>>["dojos"];
  labels: (typeof countryPageLabels)[Locale];
  locale: Locale;
}) {
  if (!countries.length || !labels) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        {title}
      </h2>
      {countries.map((country) => {
            const countryDojos = dojos.filter(
              (dojo) => dojo.countryId === country.id,
            );

            return (
              <details
                key={country.id}
                className="group border border-[var(--line)] bg-white"
              >
                <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 marker:hidden sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)_auto]">
                  <span className="col-start-1 row-start-1 flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                    {country.flagUrls.length > 0 ? (
                      <span className="flex shrink-0 items-center gap-1">
                        {country.flagUrls.map((flagUrl) => (
                          <Image
                            key={flagUrl}
                            src={flagUrl}
                            alt={`${country.name} ${labels.flag}`}
                            width={44}
                            height={32}
                            className="mt-1 h-8 w-11 object-contain"
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="flex h-8 w-11 items-center justify-center border border-[var(--line)] bg-[var(--paper)] text-lg">
                        {getFlagFallback(country.code)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        {country.memberId || country.code}
                      </p>
                      <span className="mt-1 block text-lg font-semibold leading-tight sm:text-xl">
                        {country.name}
                      </span>
                    </span>
                  </span>
                  <span className="col-span-2 row-start-2 flex min-w-0 items-center gap-3 border-t border-[var(--line)] pt-3 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:border-0 sm:pt-0">
                    {country.representativeLogoUrl ? (
                      <Image
                        src={country.representativeLogoUrl}
                        alt={country.representativeLogoAlt}
                        width={44}
                        height={44}
                        className="size-11 shrink-0 border border-[var(--line)] bg-white object-contain p-1"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center bg-[var(--paper)] text-[var(--accent)]">
                        <UserRound size={18} aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {labels.representativeEntity}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-black">
                        {country.representativeEntity || labels.pending}
                      </span>
                    </span>
                  </span>
                  <span className="col-start-2 row-start-1 flex shrink-0 flex-col items-end gap-2 sm:col-start-3 sm:flex-row sm:items-center sm:gap-4">
                    {country.responsibleWebsite ? (
                      <a
                        href={country.responsibleWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="ika-primary-action inline-flex min-h-11 items-center gap-2 whitespace-nowrap bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#761223] sm:px-4"
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                        {labels.website}
                      </a>
                    ) : null}
                    <span className="text-sm font-semibold text-[var(--accent)] group-open:hidden">
                      {labels.openCountry}
                    </span>
                    <span className="hidden text-sm font-semibold text-[var(--accent)] group-open:inline">
                      {labels.closeCountry}
                    </span>
                  </span>
                </summary>

                <div className="border-t border-[var(--line)] p-4 sm:p-5">

                  {country.description ? (
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                      {country.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        {labels.countryContactEyebrow}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {formatCountryRepresentativeTitle(labels, country.name)}
                      </h3>
                      <div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
                        {country.representativeEntity ? (
                          <p className="rounded-sm border border-[var(--line)] bg-white px-3 py-2">
                            <span className="font-semibold text-black">
                              {labels.representativeEntity}:{" "}
                            </span>
                            <span>{country.representativeEntity}</span>
                            {country.responsibleEntityType ? (
                              <span className="ml-2 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                                {formatResponsibleEntityType(country.responsibleEntityType, locale)}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                        <p className="text-lg font-semibold tracking-[0.01em] text-black">
                          {country.responsiblePerson || labels.pending}
                        </p>
                        {country.responsibleEmail ? (
                          <a
                            className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                            href={`mailto:${country.responsibleEmail}`}
                          >
                            {country.responsibleEmail}
                          </a>
                        ) : null}
                        {country.responsibleWebsite ? (
                          <a
                            className="ika-primary-action inline-flex min-h-11 w-fit items-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#761223]"
                            href={country.responsibleWebsite}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={16} aria-hidden="true" />
                            {labels.website}
                          </a>
                        ) : null}
                        <div className="mt-2 rounded-sm border border-[var(--line)] bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                            {labels.dojoCount}
                          </p>
                          <p className="mt-2 text-3xl font-semibold leading-none text-black">
                            {countryDojos.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                          {labels.countryDojos}
                        </h3>
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
                                <div className="min-w-0">
                                  {dojo.city ? (
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                                      {dojo.city}
                                    </p>
                                  ) : null}
                                <h4 className="mt-1 text-lg font-semibold leading-tight">
                                  {dojo.name}
                                </h4>
                              </div>
                            </div>
                            {dojo.responsibleInstructorPhotoUrl ? (
                              <div className="mt-4 flex flex-col gap-4 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center">
                                <Image
                                  src={dojo.responsibleInstructorPhotoUrl}
                                  alt={dojo.responsibleInstructorPhotoAlt}
                                  width={72}
                                  height={72}
                                  className="h-[72px] w-[72px] border border-[var(--line)] object-cover"
                                />
                                <div className="text-sm leading-6 text-[var(--muted)]">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                                    {labels.technicalLead}
                                  </p>
                                  <p className="text-base font-semibold text-black">
                                    {dojo.responsibleInstructor || labels.pending}
                                  </p>
                                </div>
                              </div>
                            ) : null}
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
                                <InfoLine label={labels.email} value={dojo.email} />
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
    </section>
  );
}

function isAssociatedCountry(
  country: Awaited<ReturnType<typeof getPublicCountriesAndDojos>>["countries"][number],
) {
  return (
    country.membershipType === "associated" ||
    ["CR", "MY", "FR"].includes(country.code.trim().toUpperCase())
  );
}

const countryPageLabels: Partial<
  Record<
    Locale,
    {
      countryContact: string;
      countryContactEyebrow: string;
      countryDojos: string;
      dojoCount: string;
      openCountry: string;
      closeCountry: string;
      backToCountries: string;
      pending: string;
      noDojos: string;
      address: string;
      instructor: string;
      technicalLead: string;
      representativeEntity: string;
      phone: string;
      email: string;
      flag: string;
      website: string;
      officialMembers?: string;
      associatedMembers?: string;
    }
  >
> = {
  en: {
    countryContact: "Official IKA representative",
    countryContactEyebrow: "IKA representation",
    countryDojos: "Dojos in this country",
    dojoCount: "Registered dojos",
    openCountry: "Open",
    closeCountry: "Close",
    backToCountries: "Back to countries",
    pending: "Pending",
    noDojos: "No public dojos yet.",
    address: "Address",
    instructor: "Instructor",
    technicalLead: "Technical lead",
    representativeEntity: "Representative entity",
    phone: "Phone",
    email: "Email",
    flag: "flag",
    website: "Visit official website",
    officialMembers: "Members",
    associatedMembers: "Associated members",
  },
  es: {
    countryContact: "Representante oficial IKA",
    countryContactEyebrow: "Representacion IKA",
    countryDojos: "Dojos de este pais",
    dojoCount: "Dojos registrados",
    openCountry: "Abrir",
    closeCountry: "Cerrar",
    backToCountries: "Volver a paises",
    pending: "Pendiente",
    noDojos: "Aun no hay dojos publicos.",
    address: "Direccion",
    instructor: "Instructor",
    technicalLead: "Responsable tecnico",
    representativeEntity: "Entidad representante",
    phone: "Telefono",
    email: "Email",
    flag: "bandera",
    website: "Visitar web oficial",
    officialMembers: "Miembros",
    associatedMembers: "Miembros asociados",
  },
  it: {
    countryContact: "Rappresentante ufficiale IKA",
    countryContactEyebrow: "Rappresentanza IKA",
    countryDojos: "Dojo in questo paese",
    dojoCount: "Dojo registrati",
    openCountry: "Apri",
    closeCountry: "Chiudi",
    backToCountries: "Torna ai paesi",
    pending: "In attesa",
    noDojos: "Non ci sono ancora dojo pubblici.",
    address: "Indirizzo",
    instructor: "Istruttore",
    technicalLead: "Responsabile tecnico",
    representativeEntity: "Entita rappresentante",
    phone: "Telefono",
    email: "Email",
    flag: "bandiera",
    website: "Visita il sito ufficiale",
  },
  fr: {
    countryContact: "Representant officiel IKA",
    countryContactEyebrow: "Representation IKA",
    countryDojos: "Dojos dans ce pays",
    dojoCount: "Dojos enregistres",
    openCountry: "Ouvrir",
    closeCountry: "Fermer",
    backToCountries: "Retour aux pays",
    pending: "En attente",
    noDojos: "Aucun dojo public pour le moment.",
    address: "Adresse",
    instructor: "Instructeur",
    technicalLead: "Responsable technique",
    representativeEntity: "Entite representante",
    phone: "Telephone",
    email: "Email",
    flag: "drapeau",
    website: "Visiter le site officiel",
  },
  ja: {
    countryContact: "\u516c\u5f0f IKA \u4ee3\u8868",
    countryContactEyebrow: "IKA \u4ee3\u8868",
    countryDojos: "\u3053\u306e\u56fd\u306e\u9053\u5834",
    dojoCount: "\u767b\u9332\u6e08\u307f\u9053\u5834",
    openCountry: "\u958b\u304f",
    closeCountry: "\u9589\u3058\u308b",
    backToCountries: "\u56fd\u4e00\u89a7\u3078\u623b\u308b",
    pending: "\u4fdd\u7559\u4e2d",
    noDojos: "\u516c\u958b\u3055\u308c\u3066\u3044\u308b\u9053\u5834\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002",
    address: "\u4f4f\u6240",
    instructor: "\u6307\u5c0e\u8005",
    technicalLead: "\u6280\u8853\u8cac\u4efb\u8005",
    representativeEntity: "\u4ee3\u8868\u56e3\u4f53",
    phone: "\u96fb\u8a71",
    email: "\u30e1\u30fc\u30eb",
    flag: "\u65d7",
    website: "\u516c\u5f0f\u30b5\u30a4\u30c8\u3092\u898b\u308b",
  },
  zh: {
    countryContact: "IKA \u5b98\u65b9\u4ee3\u8868",
    countryContactEyebrow: "IKA \u4ee3\u8868",
    countryDojos: "\u8be5\u56fd\u9053\u573a",
    dojoCount: "\u5df2\u767b\u8bb0\u9053\u573a",
    openCountry: "\u6253\u5f00",
    closeCountry: "\u5173\u95ed",
    backToCountries: "\u8fd4\u56de\u56fd\u5bb6\u5217\u8868",
    pending: "\u5f85\u5b9a",
    noDojos: "\u6682\u65f6\u6ca1\u6709\u516c\u5f00\u9053\u573a\u3002",
    address: "\u5730\u5740",
    instructor: "\u6559\u7ec3",
    technicalLead: "\u6280\u672f\u8d1f\u8d23\u4eba",
    representativeEntity: "\u4ee3\u8868\u673a\u6784",
    phone: "\u7535\u8bdd",
    email: "\u7535\u5b50\u90ae\u7bb1",
    flag: "\u56fd\u65d7",
    website: "\u8bbf\u95ee\u5b98\u65b9\u7f51\u7ad9",
  },
  cs: {
    countryContact: "Oficialni zastupce IKA",
    countryContactEyebrow: "Zastoupeni IKA",
    countryDojos: "Dojo v teto zemi",
    dojoCount: "Registrovana dojo",
    openCountry: "Otevrit",
    closeCountry: "Zavrit",
    backToCountries: "Zpet na zeme",
    pending: "Ceka na doplneni",
    noDojos: "Zatim nejsou zverejnena zadna dojo.",
    address: "Adresa",
    instructor: "Instruktor",
    technicalLead: "Technicky vedouci",
    representativeEntity: "Zastupujici subjekt",
    phone: "Telefon",
    email: "Email",
    flag: "vlajka",
    website: "Navstivit oficialni web",
  },
  id: {
    countryContact: "Perwakilan resmi IKA",
    countryContactEyebrow: "Perwakilan IKA",
    countryDojos: "Dojo di negara ini",
    dojoCount: "Dojo terdaftar",
    openCountry: "Buka",
    closeCountry: "Tutup",
    backToCountries: "Kembali ke negara",
    pending: "Menunggu",
    noDojos: "Belum ada dojo publik.",
    address: "Alamat",
    instructor: "Instruktur",
    technicalLead: "Penanggung jawab teknis",
    representativeEntity: "Entitas perwakilan",
    phone: "Telepon",
    email: "Email",
    flag: "bendera",
    website: "Kunjungi situs resmi",
  },
  ms: {
    countryContact: "Wakil rasmi IKA",
    countryContactEyebrow: "Perwakilan IKA",
    countryDojos: "Dojo di negara ini",
    dojoCount: "Dojo berdaftar",
    openCountry: "Buka",
    closeCountry: "Tutup",
    backToCountries: "Kembali ke negara",
    pending: "Menunggu",
    noDojos: "Belum ada dojo awam.",
    address: "Alamat",
    instructor: "Jurulatih",
    technicalLead: "Penyelia teknikal",
    representativeEntity: "Entiti wakil",
    phone: "Telefon",
    email: "E-mel",
    flag: "bendera",
    website: "Lawati laman rasmi",
  },
  eu: {
    countryContact: "IKA ordezkari ofiziala",
    countryContactEyebrow: "IKA ordezkaritza",
    countryDojos: "Herrialde honetako dojoak",
    dojoCount: "Erregistratutako dojoak",
    openCountry: "Ireki",
    closeCountry: "Itxi",
    backToCountries: "Itzuli herrialdeetara",
    pending: "Zain",
    noDojos: "Oraindik ez dago dojo publikorik.",
    address: "Helbidea",
    instructor: "Irakaslea",
    technicalLead: "Arduradun teknikoa",
    representativeEntity: "Erakunde ordezkaria",
    phone: "Telefonoa",
    email: "Emaila",
    flag: "bandera",
    website: "Webgune ofiziala bisitatu",
  },
  pt: {
    countryContact: "Representante oficial da IKA",
    countryContactEyebrow: "Representacao IKA",
    countryDojos: "Dojos neste pais",
    dojoCount: "Dojos registados",
    openCountry: "Abrir",
    closeCountry: "Fechar",
    backToCountries: "Voltar aos paises",
    pending: "Pendente",
    noDojos: "Ainda nao ha dojos publicos.",
    address: "Endereco",
    instructor: "Instrutor",
    technicalLead: "Responsavel tecnico",
    representativeEntity: "Entidade representante",
    phone: "Telefone",
    email: "Email",
    flag: "bandeira",
    website: "Visitar site oficial",
  },
  de: {
    countryContact: "Offizieller IKA-Vertreter",
    countryContactEyebrow: "IKA-Vertretung",
    countryDojos: "Dojos in diesem Land",
    dojoCount: "Registrierte Dojos",
    openCountry: "Offnen",
    closeCountry: "Schliessen",
    backToCountries: "Zuruck zu den Landern",
    pending: "Ausstehend",
    noDojos: "Noch keine offentlichen Dojos.",
    address: "Adresse",
    instructor: "Instruktor",
    technicalLead: "Technischer Leiter",
    representativeEntity: "Vertretende Organisation",
    phone: "Telefon",
    email: "E-Mail",
    flag: "Flagge",
    website: "Offizielle Website besuchen",
  },
};

function formatResponsibleEntityType(type: string, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    en: { association: "Association / federation", dojo: "Dojo", club: "Club", group: "Group", other: "Other entity" },
    es: { association: "Asociacion / federacion", dojo: "Dojo", club: "Club", group: "Grupo", other: "Otra entidad" },
    it: { association: "Associazione / federazione", dojo: "Dojo", club: "Club", group: "Gruppo", other: "Altra entita" },
    fr: { association: "Association / federation", dojo: "Dojo", club: "Club", group: "Groupe", other: "Autre entite" },
    ja: { association: "\u5354\u4f1a / \u9023\u76df", dojo: "\u9053\u5834", club: "\u30af\u30e9\u30d6", group: "\u30b0\u30eb\u30fc\u30d7", other: "\u305d\u306e\u4ed6" },
    zh: { association: "\u534f\u4f1a / \u8054\u5408\u4f1a", dojo: "\u9053\u573a", club: "\u4ff1\u4e50\u90e8", group: "\u56e2\u4f53", other: "\u5176\u4ed6\u673a\u6784" },
    cs: { association: "Asociace / federace", dojo: "Dojo", club: "Klub", group: "Skupina", other: "Jiny subjekt" },
    id: { association: "Asosiasi / federasi", dojo: "Dojo", club: "Klub", group: "Grup", other: "Entitas lain" },
    ms: { association: "Persatuan / persekutuan", dojo: "Dojo", club: "Kelab", group: "Kumpulan", other: "Entiti lain" },
    eu: { association: "Elkartea / federazioa", dojo: "Dojoa", club: "Kluba", group: "Taldea", other: "Beste erakunde bat" },
    pt: { association: "Associacao / federacao", dojo: "Dojo", club: "Clube", group: "Grupo", other: "Outra entidade" },
    de: { association: "Verband / Foderation", dojo: "Dojo", club: "Club", group: "Gruppe", other: "Andere Organisation" },
  };
  return labels[locale]?.[type] ?? labels.en[type] ?? type;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-black">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatCountryRepresentativeTitle(
  labels: {
    countryContact: string;
  },
  countryName: string,
) {
  if (labels.countryContact.includes("IKA")) {
    return `${labels.countryContact} ${countryName}`;
  }

  return `${labels.countryContact} - ${countryName}`;
}

function getFlagFallback(code: string) {
  const fallbackByCode: Record<string, string> = {
    CH: "\u{1F1E8}\u{1F1ED}",
    CR: "\u{1F1E8}\u{1F1F7}",
    CZ: "\u{1F1E8}\u{1F1FF}",
    ES: "\u{1F1EA}\u{1F1F8}",
    FR: "\u{1F1EB}\u{1F1F7}",
    GB: "\u{1F1EC}\u{1F1E7}",
    HK: "\u{1F1ED}\u{1F1F0}",
    ID: "\u{1F1EE}\u{1F1E9}",
    IE: "\u{1F1EE}\u{1F1EA}",
    IT: "\u{1F1EE}\u{1F1F9}",
    JP: "\u{1F1EF}\u{1F1F5}",
    MY: "\u{1F1F2}\u{1F1FE}",
  };

  return fallbackByCode[code] ?? code.slice(0, 2).toUpperCase();
}

