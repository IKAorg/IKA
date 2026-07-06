import { PortalClient } from "@/components/portal/portal-client";
import { isLocale, type Locale } from "@/lib/i18n/config";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const portalPageCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
  }
> = {
  en: {
    eyebrow: "Private access",
    title: "IKA Portal",
    intro:
      "Sign in to view your record and manage IKA data according to your role.",
  },
  es: {
    eyebrow: "Acceso privado",
    title: "Portal IKA",
    intro:
      "Entra con tu usuario para ver y gestionar los datos IKA segun tu rol.",
  },
  it: {
    eyebrow: "Accesso privato",
    title: "Portale IKA",
    intro:
      "Accedi per vedere e gestire i dati IKA secondo il tuo ruolo.",
  },
  fr: {
    eyebrow: "Acces prive",
    title: "Portail IKA",
    intro:
      "Connectez-vous pour voir et gerer les donnees IKA selon votre role.",
  },
  ja: {
    eyebrow: "Private access",
    title: "IKA Portal",
    intro:
      "Sign in to view and manage IKA data according to your role.",
  },
  zh: {
    eyebrow: "Private access",
    title: "IKA Portal",
    intro:
      "Sign in to view and manage IKA data according to your role.",
  },
  cs: {
    eyebrow: "Soukromy pristup",
    title: "Portal IKA",
    intro:
      "Prihlaste se a spravujte data IKA podle sve role.",
  },
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = portalPageCopy[safeLocale];

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

      <PortalClient locale={safeLocale} />
    </section>
  );
}
