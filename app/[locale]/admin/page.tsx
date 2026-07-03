import { LockKeyhole, PanelsTopLeft, ShieldCheck } from "lucide-react";
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
    authTitle: string;
    authText: string;
    rolesTitle: string;
    rolesText: string;
  }
> = {
  en: {
    eyebrow: "Admin",
    title: "IKA Administration",
    intro:
      "Open only the module you need to work with. Everything else stays folded away.",
    authTitle: "Supabase Auth",
    authText: "Admin access is protected through Supabase sessions and RLS.",
    rolesTitle: "Scoped Roles",
    rolesText: "Country and dojo admins operate only within assigned scopes.",
  },
  es: {
    eyebrow: "Admin",
    title: "Administracion IKA",
    intro:
      "Abre solo el modulo con el que vas a trabajar. Lo demas queda recogido para no molestar.",
    authTitle: "Supabase Auth",
    authText: "El acceso admin esta protegido con sesiones de Supabase y RLS.",
    rolesTitle: "Roles con alcance",
    rolesText:
      "Los administradores de pais y dojo operan solo dentro de sus ambitos asignados.",
  },
  it: {
    eyebrow: "Admin",
    title: "Amministrazione IKA",
    intro:
      "Apri solo il modulo su cui devi lavorare. Il resto rimane chiuso.",
    authTitle: "Supabase Auth",
    authText: "L'accesso admin e protetto da sessioni Supabase e RLS.",
    rolesTitle: "Ruoli con ambito",
    rolesText: "Gli admin di paese e dojo operano solo negli ambiti assegnati.",
  },
  fr: {
    eyebrow: "Admin",
    title: "Administration IKA",
    intro:
      "Ouvrez uniquement le module a modifier. Le reste reste replie.",
    authTitle: "Supabase Auth",
    authText: "L'acces admin est protege par Supabase et RLS.",
    rolesTitle: "Roles par perimetre",
    rolesText:
      "Les admins de pays et de dojo operent uniquement dans leurs perimetres.",
  },
  ja: {
    eyebrow: "Admin",
    title: "IKA Admin",
    intro: "Work modules stay closed until you open the one you need.",
    authTitle: "Supabase Auth",
    authText: "Admin access is protected through Supabase sessions and RLS.",
    rolesTitle: "Scoped Roles",
    rolesText: "Country and dojo admins operate only within assigned scopes.",
  },
  zh: {
    eyebrow: "Admin",
    title: "IKA Admin",
    intro: "Work modules stay closed until you open the one you need.",
    authTitle: "Supabase Auth",
    authText: "Admin access is protected through Supabase sessions and RLS.",
    rolesTitle: "Scoped Roles",
    rolesText: "Country and dojo admins operate only within assigned scopes.",
  },
  cs: {
    eyebrow: "Admin",
    title: "Administrace IKA",
    intro:
      "Otevrete jen modul, se kterym pracujete. Ostatni zustane zavrene.",
    authTitle: "Supabase Auth",
    authText: "Admin pristup je chranen Supabase relacemi a RLS.",
    rolesTitle: "Role podle rozsahu",
    rolesText: "Spravci zemi a dojo pracuji jen ve svem prirazenem rozsahu.",
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = adminContent[safeLocale];

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
        <AdminModule title="Estado y permisos">
          <div className="grid gap-4 md:grid-cols-3">
            <AdminCapability
              icon={<LockKeyhole size={22} />}
              title={copy.authTitle}
              text={copy.authText}
            />
            <AdminCapability
              icon={<PanelsTopLeft size={22} />}
              title="CMS"
              text="Modulos de eventos, paises, dojos y paginas publicas."
            />
            <AdminCapability
              icon={<ShieldCheck size={22} />}
              title={copy.rolesTitle}
              text={copy.rolesText}
            />
          </div>
        </AdminModule>

        <AdminPanel locale={safeLocale} />
      </div>
    </section>
  );
}

function AdminModule({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-[var(--line)] bg-white p-5">
      <summary className="cursor-pointer text-xl font-semibold">{title}</summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function AdminCapability({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[var(--line)] bg-white p-5">
      <div className="mb-5 flex size-11 items-center justify-center bg-black text-white">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}
