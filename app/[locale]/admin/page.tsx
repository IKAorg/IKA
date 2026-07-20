import { AdminPanel } from "@/components/admin/admin-panel";
import { isLocale } from "@/lib/i18n/config";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

const adminContent = {
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
  id: {
    eyebrow: "Admin",
    title: "Administrasi IKA",
    intro: "Kelola hanya area yang tersedia untuk peran yang ditetapkan kepada Anda.",
  },
  ms: {
    eyebrow: "Admin",
    title: "Pentadbiran IKA",
    intro: "Urus hanya bahagian yang tersedia untuk peranan yang diberikan kepada anda.",
  },
  eu: {
    eyebrow: "Admin",
    title: "IKA Administrazioa",
    intro: "Kudeatu zure rolarentzat erabilgarri dauden eremuak bakarrik.",
  },
  pt: {
    eyebrow: "Admin",
    title: "Administracao IKA",
    intro: "Gira apenas as areas disponiveis para o papel que lhe foi atribuido.",
  },
  de: {
    eyebrow: "Admin",
    title: "IKA Verwaltung",
    intro: "Verwalten Sie nur die Bereiche, die Ihrer zugewiesenen Rolle entsprechen.",
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy =
    adminContent[safeLocale as keyof typeof adminContent] ?? adminContent.en;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {copy.intro}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <AdminPanel locale={safeLocale} />
      </div>
    </section>
  );
}
