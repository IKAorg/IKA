"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  FileBadge,
  Globe2,
  Loader2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type RoleKey =
  | "super_admin"
  | "global_admin"
  | "country_admin"
  | "dojo_admin"
  | "kenshi";

type Translation = {
  language_code: string;
  name: string;
};

type ScopeCountry = {
  code: string;
  country_translations?: Translation[];
};

type ScopeDojo = {
  city: string;
  dojo_translations?: Translation[];
};

type PortalRole = {
  id: string;
  roles: { key: RoleKey; name: string } | Array<{ key: RoleKey; name: string }>;
  countries: ScopeCountry | null;
  dojos: ScopeDojo | null;
};

type PortalMember = {
  id: string;
  ika_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  current_grade: string | null;
  last_exam_date: string | null;
  joined_date: string | null;
  consent_accepted: boolean;
  countries: ScopeCountry | null;
  dojos: ScopeDojo | null;
};

type GradeHistory = {
  id: string;
  grade: string;
  exam_date: string;
  exam_place: string | null;
  examiner: string | null;
};

type PortalPayload = {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  } | null;
  roles: PortalRole[];
  member: PortalMember | null;
  gradeHistory: GradeHistory[];
};

const roleLabels: Record<RoleKey, string> = {
  super_admin: "Super admin",
  global_admin: "Admin global",
  country_admin: "Admin de pais",
  dojo_admin: "Admin de dojo",
  kenshi: "Kenshi",
};

export function PortalClient({
  locale = defaultLocale,
}: {
  locale?: Locale;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [portal, setPortal] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/portal/me", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo cargar el portal.");
      setPortal(null);
    } else {
      setPortal(data as PortalPayload);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void loadPortal();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadPortal();
      } else {
        setPortal(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadPortal, supabase]);

  async function signIn() {
    setLoading(true);
    setMessage("");

    const result = password
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              typeof window === "undefined"
                ? undefined
                : `${window.location.origin}/${locale}/portal`,
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (!password) {
      setMessage("Revisa tu email para entrar al portal.");
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setPortal(null);
  }

  const displayName =
    portal?.profile?.display_name ||
    (portal?.member
      ? `${portal.member.first_name} ${portal.member.last_name}`.trim()
      : "") ||
    session?.user.email ||
    "";

  if (!session) {
    return (
      <section className="mt-10 grid gap-6 border border-[var(--line)] bg-white p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Acceso seguro
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Entrar al portal</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Usa el email asociado a tu ficha IKA. Si no tienes contrasena,
            deja el campo vacio y recibiras un enlace magico.
          </p>
        </div>

        <div className="grid gap-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="border border-[var(--line)] px-3 py-3"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contrasena opcional"
            type="password"
            className="border border-[var(--line)] px-3 py-3"
          />
          <button
            onClick={signIn}
            disabled={loading || !email}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Entrar
          </button>
          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-white p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Portal privado
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            {displayName}
          </h2>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>

      {loading ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
          Cargando portal...
        </div>
      ) : null}

      {message ? (
        <div className="border border-[var(--line)] bg-white p-5 text-sm font-semibold text-[var(--accent)]">
          {message}
        </div>
      ) : null}

      {portal && !loading ? (
        <div className="grid gap-5">
          <RoleSummary roles={portal.roles} locale={locale} />
          <MemberPanel
            member={portal.member}
            grades={portal.gradeHistory}
            locale={locale}
          />
          <RoleDashboards roles={portal.roles} locale={locale} />
        </div>
      ) : null}
    </section>
  );
}

function RoleSummary({
  roles,
  locale,
}: {
  roles: PortalRole[];
  locale: Locale;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.length === 0 ? (
        <DashboardCard
          icon={<ShieldCheck size={22} />}
          title="Sin rol asignado"
          text="Tu usuario existe, pero todavía no tiene permisos en IKA."
        />
      ) : (
        roles.map((assignment) => {
          const role = getRole(assignment.roles);
          const scope =
            labelCountry(assignment.countries, locale) ||
            labelDojo(assignment.dojos, locale) ||
            "Acceso general";

          return (
            <DashboardCard
              key={assignment.id}
              icon={getRoleIcon(role?.key)}
              title={role ? roleLabels[role.key] : "Rol"}
              text={scope}
            />
          );
        })
      )}
    </div>
  );
}

function MemberPanel({
  member,
  grades,
  locale,
}: {
  member: PortalMember | null;
  grades: GradeHistory[];
  locale: Locale;
}) {
  if (!member) {
    return (
      <DashboardCard
        icon={<UserRound size={22} />}
        title="Ficha Kenshi pendiente"
        text="Tu usuario no tiene todavía una ficha de miembro vinculada."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <UserRound size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">Ficha Kenshi</h3>
        </div>
        <dl className="mt-5 grid gap-3 text-sm">
          <InfoRow label="IKA Passport" value={member.ika_number} />
          <InfoRow
            label="Nombre"
            value={`${member.first_name} ${member.last_name}`}
          />
          <InfoRow label="Estado" value={member.status} />
          <InfoRow label="Grado actual" value={member.current_grade} />
          <InfoRow
            label="Pais"
            value={labelCountry(member.countries, locale)}
          />
          <InfoRow label="Dojo" value={labelDojo(member.dojos, locale)} />
          <InfoRow
            label="Entrada IKA"
            value={formatDate(member.joined_date, locale)}
          />
          <InfoRow
            label="Consentimiento"
            value={member.consent_accepted ? "Aceptado" : "Pendiente"}
          />
        </dl>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <FileBadge size={22} className="text-[var(--accent)]" />
          <h3 className="text-2xl font-semibold">Historial de grados</h3>
        </div>
        <div className="mt-5 grid gap-3">
          {grades.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Todavía no hay grados registrados.
            </p>
          ) : (
            grades.map((grade) => (
              <article
                key={grade.id}
                className="border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <h4 className="font-semibold">{grade.grade}</h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatDate(grade.exam_date, locale)}
                  {grade.exam_place ? ` · ${grade.exam_place}` : ""}
                  {grade.examiner ? ` · ${grade.examiner}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function RoleDashboards({
  roles,
  locale,
}: {
  roles: PortalRole[];
  locale: Locale;
}) {
  const keys = roles.map((assignment) => getRole(assignment.roles)?.key);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {keys.includes("dojo_admin") ? (
        <DashboardCard
          icon={<Building2 size={22} />}
          title="Administracion de dojo"
          text="Gestion de miembros, datos del dojo y seguimiento basico. Las acciones avanzadas se completaran en el modulo privado."
        />
      ) : null}
      {keys.includes("country_admin") ? (
        <DashboardCard
          icon={<Globe2 size={22} />}
          title="Administracion de pais"
          text="Gestion nacional de dojos, miembros, eventos y reportes. El alcance queda limitado a tu pais asignado."
        />
      ) : null}
      {keys.includes("global_admin") || keys.includes("super_admin") ? (
        <DashboardCard
          icon={<ShieldCheck size={22} />}
          title="Administracion global"
          text="Acceso global a CMS, paises, dojos, eventos, usuarios y configuracion."
        />
      ) : null}
      {roles.length > 0 ? (
        <DashboardCard
          icon={<BadgeCheck size={22} />}
          title="Alcance activo"
          text={roles
            .map((assignment) => {
              const role = getRole(assignment.roles);
              return [
                role ? roleLabels[role.key] : "Rol",
                labelCountry(assignment.countries, locale),
                labelDojo(assignment.dojos, locale),
              ]
                .filter(Boolean)
                .join(" · ");
            })
            .join(" / ")}
        />
      ) : null}
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="border border-[var(--line)] bg-white p-5">
      <div className="mb-5 flex size-11 items-center justify-center bg-[var(--accent)] text-white">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </article>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--line)] pb-2">
      <dt className="font-semibold">{label}</dt>
      <dd className="text-[var(--muted)]">{value || "Pendiente"}</dd>
    </div>
  );
}

function getRole(role: PortalRole["roles"]) {
  return Array.isArray(role) ? role[0] : role;
}

function getRoleIcon(role?: RoleKey) {
  if (role === "country_admin") {
    return <Globe2 size={22} />;
  }

  if (role === "dojo_admin") {
    return <Building2 size={22} />;
  }

  if (role === "global_admin" || role === "super_admin") {
    return <ShieldCheck size={22} />;
  }

  return <UserRound size={22} />;
}

function labelCountry(country: ScopeCountry | null, locale: Locale) {
  return (
    country?.country_translations?.find((item) => item.language_code === locale)
      ?.name ??
    country?.country_translations?.[0]?.name ??
    country?.code ??
    ""
  );
}

function labelDojo(dojo: ScopeDojo | null, locale: Locale) {
  return (
    dojo?.dojo_translations?.find((item) => item.language_code === locale)
      ?.name ??
    dojo?.dojo_translations?.[0]?.name ??
    dojo?.city ??
    ""
  );
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value),
  );
}
