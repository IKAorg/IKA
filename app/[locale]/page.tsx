import Link from "next/link";
import { ArrowRight, Database, Globe2, ShieldCheck } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);

  return (
    <div>
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto grid min-h-[68vh] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {dictionary.home.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-black md:text-7xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {dictionary.home.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/countries`}
                className="inline-flex items-center gap-2 bg-black px-5 py-3 text-sm font-medium text-white"
              >
                {dictionary.home.primaryAction}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/admin`}
                className="inline-flex items-center gap-2 border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--ink-blue)]"
              >
                {dictionary.home.secondaryAction}
              </Link>
            </div>
          </div>

          <div className="border border-[var(--line)] bg-white p-6">
            <div className="grid gap-4">
              <FoundationItem
                icon={<Globe2 size={22} />}
                title="Multilingual CMS"
                text="Locale routes and translation-table strategy are built into the first layer."
              />
              <FoundationItem
                icon={<ShieldCheck size={22} />}
                title="Scoped Permissions"
                text="Global, country, dojo, and member access are separated from the beginning."
              />
              <FoundationItem
                icon={<Database size={22} />}
                title="Supabase Foundation"
                text="The schema starts with RLS, audit logs, IKA numbers, and privacy boundaries."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">
            {dictionary.home.foundationTitle}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            {dictionary.home.foundationText}
          </p>
        </div>
      </section>
    </div>
  );
}

function FoundationItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 border border-[var(--line)] p-4">
      <div className="flex size-11 shrink-0 items-center justify-center bg-[var(--ink-blue)] text-white">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{text}</p>
      </div>
    </div>
  );
}
