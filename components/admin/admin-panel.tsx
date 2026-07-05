"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/browser";

const EventsAdmin = dynamic(
  () => import("@/components/admin/events-admin").then((mod) => mod.EventsAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const LocationsAdmin = dynamic(
  () =>
    import("@/components/admin/locations-admin").then(
      (mod) => mod.LocationsAdmin,
    ),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const PagesAdmin = dynamic(
  () => import("@/components/admin/pages-admin").then((mod) => mod.PagesAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const UsersAdmin = dynamic(
  () => import("@/components/admin/users-admin").then((mod) => mod.UsersAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const MembersAdmin = dynamic(
  () =>
    import("@/components/admin/members-admin").then((mod) => mod.MembersAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const SettingsAdmin = dynamic(
  () =>
    import("@/components/admin/settings-admin").then((mod) => mod.SettingsAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

type AdminPanelProps = {
  locale: Locale;
};

type AdminScope = {
  roleKeys: string[];
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
};

export function AdminPanel({ locale }: AdminPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [scope, setScope] = useState<AdminScope | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        return fetch("/api/portal/me", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      })
      .then((response) => response.json().catch(() => ({})))
      .then((portal) => {
        if (!active) {
          return;
        }

        const nextScope = portal?.dashboard?.scope as AdminScope | undefined;
        setScope(nextScope ?? null);
        setLoadingScope(false);
      })
      .catch(() => {
        if (active) {
          setScope(null);
          setLoadingScope(false);
        }
      });

    return () => {
      active = false;
    };
  }, [supabase]);

  if (loadingScope) {
    return <AdminLoading />;
  }

  const roleKeys = scope?.roleKeys ?? [];
  const isGlobal =
    Boolean(scope?.isGlobal) ||
    roleKeys.includes("super_admin") ||
    roleKeys.includes("global_admin");
  const isCountryAdmin = roleKeys.includes("country_admin");
  const isDojoAdmin = roleKeys.includes("dojo_admin");
  const canManageUsers = isGlobal || isCountryAdmin;
  const canManageMembers = isGlobal || isCountryAdmin || isDojoAdmin;
  const canManageLocations = isGlobal || isCountryAdmin;

  return (
    <>
      {canManageUsers ? (
        <AdminModule title="Usuarios y permisos: crear admins" defaultOpen>
          <UsersAdmin initialLocale={locale} />
        </AdminModule>
      ) : null}

      {canManageMembers ? (
        <AdminModule title="Kenshi: alta/importacion de miembros" defaultOpen>
          <MembersAdmin initialLocale={locale} />
        </AdminModule>
      ) : null}

      {isGlobal ? (
        <AdminModule title="Ajustes globales">
          <SettingsAdmin />
        </AdminModule>
      ) : null}

      {isGlobal ? (
        <AdminModule title="Eventos y calendario">
          <EventsAdmin initialLocale={locale} />
        </AdminModule>
      ) : null}

      {canManageLocations ? (
        <AdminModule title="Paises y dojos: alta de pais/dojo" defaultOpen>
          <LocationsAdmin initialLocale={locale} />
        </AdminModule>
      ) : null}

      {isGlobal ? (
        <AdminModule title="Paginas publicas">
          <PagesAdmin initialLocale={locale} />
        </AdminModule>
      ) : null}
    </>
  );
}

function AdminModule({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-[var(--line)] bg-white p-5" open={defaultOpen}>
      <summary className="cursor-pointer text-xl font-semibold">{title}</summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function AdminLoading() {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">
      Cargando modulo...
    </div>
  );
}
