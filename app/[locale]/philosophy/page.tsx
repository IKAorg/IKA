export default function PhilosophyPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Philosophy
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        Strength, compassion, and self-reliance.
      </h1>
      <blockquote className="mt-8 max-w-3xl border-l-4 border-[var(--accent)] pl-6 text-2xl font-semibold leading-tight text-[var(--ink-blue)]">
        “Live half for the happiness of oneself, and half for the happiness of
        others.”
      </blockquote>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <TextBlock
          title="Mutual development"
          text="Training is not only physical competition. Practitioners train with each other to grow technically, mentally, and socially."
        />
        <TextBlock
          title="Defence before attack"
          text="The techniques emphasise defence, control, balance, weak points, and minimum necessary force."
        />
        <TextBlock
          title="Mind and body"
          text="Practice combines hard and soft techniques with meditation and philosophy."
        />
        <TextBlock
          title="Positive society"
          text="The purpose of training is to build people who can contribute confidently and compassionately to their communities."
        />
      </div>
    </section>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-t border-[var(--line)] pt-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
