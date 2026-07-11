import { AdminPanel } from "@/components/admin/admin-panel";
import { isLocale, type Locale } from "@/lib/i18n/config";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

const adminContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
  }
> = {
  en: {
    eyebrow: "Admin",
    title: "IKA Administration",
    intro: "Manage only the areas available to your assigned role.",
  },
  es: {
    eyebrow: "Admin",
    title: "Administracion IKA",
    intro: "Gestiona solo las areas disponibles para tu rol asignado.",
  },
  it: {
    eyebrow: "Admin",
    title: "Amministrazione IKA",
    intro: "Gestisci solo le aree disponibili per il tuo ruolo.",
  },
  fr: {
    eyebrow: "Admin",
    title: "Administration IKA",
    intro: "Gerez uniquement les zones disponibles pour votre role.",
  },
  ja: {
    eyebrow: "Admin",
    title: "IKA Administration",
    intro: "Manage only the areas available to your assigned role.",
  },
  zh: {
    eyebrow: "Admin",
    title: "IKA Administration",
    intro: "Manage only the areas available to your assigned role.",
  },
  cs: {
    eyebrow: "Admin",
    title: "Administrace IKA",
    intro: "Spravujte pouze oblasti dostupne pro vasi roli.",
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = adminContent[safeLocale === "es" ? "es" : "en"];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          {copy.intro}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <AdminPanel locale={safeLocale} />
      </div>
    </section>
  );
}
