export default function JoinPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Join IKA
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        Connect your organisation with the international IKA family.
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        IKA welcomes organisations that share the association&apos;s technical roots,
        philosophy, and commitment to training together across borders.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Step number="01" title="Contact IKA" text="Introduce your organisation and country." />
        <Step number="02" title="Review alignment" text="Share technical, historical, and organisational background." />
        <Step number="03" title="Train together" text="Join seminars, events, and association activities." />
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
