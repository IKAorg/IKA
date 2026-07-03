"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n/config";

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

export function AdminPanel({ locale }: AdminPanelProps) {
  return (
    <>
      <AdminModule title="Usuarios y permisos">
        <UsersAdmin initialLocale={locale} />
      </AdminModule>

      <AdminModule title="Ajustes globales">
        <SettingsAdmin />
      </AdminModule>

      <AdminModule title="Eventos y calendario">
        <EventsAdmin initialLocale={locale} />
      </AdminModule>

      <AdminModule title="Paises y dojos">
        <LocationsAdmin initialLocale={locale} />
      </AdminModule>

      <AdminModule title="Paginas publicas">
        <PagesAdmin initialLocale={locale} />
      </AdminModule>
    </>
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

function AdminLoading() {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">
      Cargando modulo...
    </div>
  );
}
