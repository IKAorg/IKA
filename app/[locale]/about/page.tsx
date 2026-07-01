export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        About IKA
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        An international association for a shared Kempo family.
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-5 text-base leading-8 text-[var(--muted)]">
          <p>
            The International Kempo Association brings together practitioners
            and organisations from around the world who share a common heritage,
            physical style, and philosophy.
          </p>
          <p>
            IKA was officially launched in October 2015 at the inaugural IKA
            seminar in Kobe, Japan. Its purpose is to help member organisations
            train together across borders for mutual self-development, good
            company, and shared learning.
          </p>
        </div>
        <aside className="border-l border-[var(--line)] pl-6">
          <h2 className="text-xl font-semibold">Common roots</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Member organisations may use different names for their martial art,
            but they are united by teachings connected to Doshin So and the
            spirit of Shorinji Kempo.
          </p>
        </aside>
      </div>
    </section>
  );
}
