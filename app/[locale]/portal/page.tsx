import { PortalClient } from "@/components/portal/portal-client";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const portalPageCopy: Partial<
  Record<
    Locale,
    {
      eyebrow: string;
      title: string;
      intro: string;
    }
  >
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
    eyebrow: "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8\u30a2\u30af\u30bb\u30b9",
    title: "IKA\u30dd\u30fc\u30bf\u30eb",
    intro:
      "\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u3001\u5f79\u5272\u306b\u5fdc\u3058\u305fIKA\u30c7\u30fc\u30bf\u3092\u78ba\u8a8d\u30fb\u7ba1\u7406\u3057\u307e\u3059\u3002",
  },
  zh: {
    eyebrow: "\u79c1\u4eba\u8bbf\u95ee",
    title: "IKA\u95e8\u6237",
    intro:
      "\u767b\u5f55\u540e\u53ef\u6839\u636e\u4f60\u7684\u89d2\u8272\u67e5\u770b\u548c\u7ba1\u7406IKA\u6570\u636e\u3002",
  },
  cs: {
    eyebrow: "Soukromy pristup",
    title: "Portal IKA",
    intro:
      "Prihlaste se a spravujte data IKA podle sve role.",
  },
  id: {
    eyebrow: "Akses privat",
    title: "Portal IKA",
    intro:
      "Masuk untuk melihat dan mengelola data IKA sesuai peran Anda.",
  },
  ms: {
    eyebrow: "Akses peribadi",
    title: "Portal IKA",
    intro:
      "Log masuk untuk melihat dan mengurus data IKA mengikut peranan anda.",
  },
  eu: {
    eyebrow: "Sarbide pribatua",
    title: "IKA ataria",
    intro:
      "Sartu zure profila ikusteko eta IKA datuak zure rolaren arabera kudeatzeko.",
  },
  pt: {
    eyebrow: "Acesso privado",
    title: "Portal IKA",
    intro:
      "Entre para ver e gerir os dados IKA de acordo com o seu papel.",
  },
  de: {
    eyebrow: "Privater Zugang",
    title: "IKA Portal",
    intro:
      "Melden Sie sich an, um Ihre IKA-Daten entsprechend Ihrer Rolle zu sehen und zu verwalten.",
  },
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = portalPageCopy[safeLocale] ?? portalPageCopy[defaultLocale]!;

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

      <PortalClient locale={safeLocale} />
    </section>
  );
}

