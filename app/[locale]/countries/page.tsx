export default function CountriesPage() {
  const countries = [
    "Costa Rica",
    "Czech Republic",
    "Indonesia and Malaysia",
    "Ireland",
    "Italy",
    "Hong Kong",
    "Japan",
    "Spain",
    "Switzerland",
    "United Kingdom",
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Member countries
      </p>
      <h1 className="mt-4 text-4xl font-semibold">IKA around the world</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        IKA brings together member organisations across countries and
        continents. This public directory will become fully editable from the
        CMS.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <div key={country} className="border border-[var(--line)] bg-white p-4">
            {country}
          </div>
        ))}
      </div>
    </section>
  );
}
