"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  FileText,
  FileUp,
  Globe2,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import {
  getAdminSessionBridgeHeaders,
  saveAdminSessionBridge,
} from "@/lib/supabase/admin-session-bridge";

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

const NewsAdmin = dynamic(
  () => import("@/components/admin/news-admin").then((mod) => mod.NewsAdmin),
  {
    ssr: false,
    loading: () => <AdminLoading />,
  },
);

const OfficialInstructorsAdmin = dynamic(
  () =>
    import("@/components/admin/official-instructors-admin").then(
      (mod) => mod.OfficialInstructorsAdmin,
    ),
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

const RequestFormsAdmin = dynamic(
  () =>
    import("@/components/admin/request-forms-admin").then(
      (mod) => mod.RequestFormsAdmin,
    ),
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

type AdminScopePayload = {
  error?: string;
  scope?: AdminScope;
  dashboard?: {
    scope?: AdminScope;
  } | null;
};

const portalCacheKey = "ika-portal-cache";

type CachedPortalScopePayload = {
  sessionEmail?: string;
  sessionUserId?: string;
  payload?: {
    roles?: Array<{
      roles?: { key?: string } | Array<{ key?: string }> | null;
    }>;
    dashboard?: {
      scope?: AdminScope;
    } | null;
  } | null;
};

type AdminPanelCopy = {
  noAdminPermissionForAccount: string;
  noAdminPermissions: string;
  usersModule: string;
  coursesModule: string;
  membersModule: string;
  settingsModule: string;
  eventsModule: string;
  locationsModule: string;
  pagesModule: string;
  instructorsModule: string;
  newsModule: string;
  requestsModule: string;
  homeTitle: string;
  homeIntro: string;
  operationsGroup: string;
  operationsGroupText: string;
  structureGroup: string;
  structureGroupText: string;
  contentGroup: string;
  contentGroupText: string;
  membersQuickTitle: string;
  membersQuickText: string;
  eventsQuickTitle: string;
  eventsQuickText: string;
  requestsQuickTitle: string;
  requestsQuickText: string;
  locationsQuickTitle: string;
  locationsQuickText: string;
  coursesQuickTitle: string;
  coursesQuickText: string;
  contentQuickTitle: string;
  contentQuickText: string;
};

export function AdminPanel({ locale }: AdminPanelProps) {
  const copy = useMemo(() => adminPanelCopy(locale), [locale]);
  const supabase = useMemo(() => createPortalClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [scope, setScope] = useState<AdminScope | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [scopeMessage, setScopeMessage] = useState("");
  const sessionRef = useRef<Session | null>(null);
  const scopeRef = useRef<AdminScope | null>(scope);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let active = true;

    function readCachedScope(nextSession?: Session | null): AdminScope | null {
      if (typeof window === "undefined" || !nextSession?.user) {
        return null;
      }

      const raw = window.sessionStorage.getItem(portalCacheKey);
      if (!raw) {
        return null;
      }

      try {
        const cached = JSON.parse(raw) as CachedPortalScopePayload;
        const sameUser =
          (cached.sessionUserId ?? "") === (nextSession.user.id ?? "") &&
          normalizeEmail(cached.sessionEmail) ===
            normalizeEmail(nextSession.user.email ?? "");

        if (!sameUser) {
          return null;
        }

        const dashboardScope = cached.payload?.dashboard?.scope;
        if (dashboardScope) {
          return dashboardScope;
        }

        const roleKeys = (cached.payload?.roles ?? [])
          .map((role) => getPortalRoleKey(role.roles))
          .filter(Boolean) as string[];

        if (roleKeys.length === 0) {
          return null;
        }

        return {
          roleKeys,
          isGlobal:
            roleKeys.includes("super_admin") || roleKeys.includes("global_admin"),
          countryIds: [],
          dojoIds: [],
        };
      } catch {
        return null;
      }
    }

    function getOptimisticScope(nextSession?: Session | null): AdminScope | null {
      const normalizedEmail = normalizeEmail(nextSession?.user.email);

      if (normalizedEmail === "internationalkempoassociation@gmail.com") {
        return {
          roleKeys: ["super_admin"],
          isGlobal: true,
          countryIds: [],
          dojoIds: [],
        };
      }

      return readCachedScope(nextSession);
    }

    async function fetchScopePayload(
      url: string,
      headers: Record<string, string>,
      timeoutMs = 12000,
    ): Promise<AdminScopePayload> {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          cache: "no-store",
          headers,
          signal: controller.signal,
        });
        return (await response.json().catch(() => ({}))) as AdminScopePayload;
      } catch {
        return {};
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    function applyScopeResult(
      result: Array<AdminScopePayload | null | undefined>,
      nextSession?: Session | null,
    ) {
      const [scopePayload] = result;
      const nextScope =
        mergeScopes(
          scopePayload?.scope as AdminScope | undefined,
          scopePayload?.dashboard?.scope as AdminScope | undefined,
        ) ?? getOptimisticScope(nextSession);

      if (!nextScope && scopeRef.current) {
        setLoadingScope(false);
        return;
      }

      setScope(nextScope ?? null);
      setScopeMessage(
        nextScope
          ? ""
          : scopePayload?.error ??
              copy.noAdminPermissionForAccount ??
              "No administration permission was found for this account.",
      );
      setLoadingScope(false);
    }

    async function loadScope(nextSession?: Session | null) {
      const currentSession = nextSession ?? sessionRef.current;
      const token = currentSession?.access_token;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : getAdminSessionBridgeHeaders();

      const settled = await Promise.allSettled([
        fetchScopePayload("/api/admin/scope", headers, 30000),
      ]);

      return settled.map((item) =>
        item.status === "fulfilled" ? item.value : {},
      ) as AdminScopePayload[];
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return null;
        }

        setSession(data.session);
        if (data.session) {
          saveAdminSessionBridge(data.session);
          const cachedScope =
            getOptimisticScope(data.session) ?? readCachedScope(data.session);
          if (cachedScope) {
            setScope(cachedScope);
            setScopeMessage("");
            setLoadingScope(false);
          }
        }
        return loadScope(data.session);
      })
      .then((result) => {
        if (!active || !result) {
          return;
        }

        applyScopeResult(result, sessionRef.current);
      })
      .catch(() => {
        if (active) {
          setScope(getOptimisticScope(sessionRef.current));
          setLoadingScope(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

      setSession(nextSession);
      let hasOptimisticScope = false;
      if (nextSession) {
        saveAdminSessionBridge(nextSession);
        const optimisticScope = getOptimisticScope(nextSession);
        if (optimisticScope) {
          hasOptimisticScope = true;
          setScope(optimisticScope);
          setScopeMessage("");
          setLoadingScope(false);
        }
      } else {
        setScope(null);
        setScopeMessage("");
        setLoadingScope(false);
        return;
      }
      if (!hasOptimisticScope) {
        setLoadingScope(true);
      }
      void loadScope(nextSession)
        .then((result) => {
          if (!active) {
            return;
          }

          applyScopeResult(result, nextSession);
        })
        .catch(() => {
          if (active) {
            setScope(getOptimisticScope(nextSession));
            setLoadingScope(false);
          }
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [copy.noAdminPermissionForAccount, supabase]);

  if (loadingScope) {
    return <AdminLoading />;
  }

  if (!scope) {
    return (
      <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm font-semibold text-[var(--accent)]">
        {scopeMessage || copy.noAdminPermissions}
      </div>
    );
  }

  const roleKeys = scope?.roleKeys ?? [];
  const countryIds = scope?.countryIds ?? [];
  const dojoIds = scope?.dojoIds ?? [];
  const isGlobal =
    Boolean(scope?.isGlobal) ||
    roleKeys.includes("super_admin") ||
    roleKeys.includes("global_admin");
  const isCountryAdmin = roleKeys.includes("country_admin") || countryIds.length > 0;
  const isDojoAdmin =
    (roleKeys.includes("dojo_admin") || dojoIds.length > 0) && !isCountryAdmin;
  const isSuperAdmin = roleKeys.includes("super_admin");
  const canManageUsers = isGlobal;
  const canManageMembers = isGlobal || isCountryAdmin || isDojoAdmin;
  const canManageCourses = isSuperAdmin;
  const canManageLocations = isGlobal || isCountryAdmin;
  const canManageEvents = isGlobal || isCountryAdmin;
  const canManageNews = isGlobal || isCountryAdmin;
  const canManageRequests =
    isSuperAdmin || isGlobal || isCountryAdmin || isDojoAdmin;

  const primaryActions = [
    canManageMembers
      ? {
          id: "admin-members",
          icon: UsersRound,
          title: copy.membersQuickTitle,
          text: copy.membersQuickText,
        }
      : null,
    canManageEvents
      ? {
          id: "admin-events",
          icon: CalendarDays,
          title: copy.eventsQuickTitle,
          text: copy.eventsQuickText,
        }
      : null,
    canManageRequests
      ? {
          id: "admin-requests",
          icon: FileText,
          title: copy.requestsQuickTitle,
          text: copy.requestsQuickText,
        }
      : null,
    canManageLocations
      ? {
          id: "admin-locations",
          icon: MapPinned,
          title: copy.locationsQuickTitle,
          text: copy.locationsQuickText,
        }
      : null,
    canManageCourses
      ? {
          id: "admin-courses",
          icon: FileUp,
          title: copy.coursesQuickTitle,
          text: copy.coursesQuickText,
        }
      : null,
    isGlobal
      ? {
          id: "admin-content",
          icon: Globe2,
          title: copy.contentQuickTitle,
          text: copy.contentQuickText,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    icon: typeof UsersRound;
    title: string;
    text: string;
  }>;

  return (
    <>
      <section className="border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center bg-[var(--accent)] text-white">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{copy.homeTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {copy.homeIntro}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {primaryActions.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:border-[var(--accent)]"
            >
              <div className="flex size-10 items-center justify-center bg-[var(--ink-blue)] text-white">
                <item.icon size={18} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {item.text}
              </p>
            </a>
          ))}
        </div>
      </section>

      <AdminGroup title={copy.operationsGroup} subtitle={copy.operationsGroupText}>
        {canManageMembers ? (
          <AdminModule id="admin-members" title={copy.membersModule}>
            <MembersAdmin initialLocale={locale} />
          </AdminModule>
        ) : null}

        {canManageEvents ? (
          <AdminModule id="admin-events" title={copy.eventsModule}>
            <EventsAdmin initialLocale={locale} />
          </AdminModule>
        ) : null}

        {canManageRequests ? (
          <AdminModule id="admin-requests" title={copy.requestsModule}>
            <RequestFormsAdmin initialLocale={locale} />
          </AdminModule>
        ) : null}

        {canManageCourses ? (
          <AdminModule id="admin-courses" title={copy.coursesModule}>
            <MembersAdmin initialLocale={locale} mode="courses" />
          </AdminModule>
        ) : null}
      </AdminGroup>

      <AdminGroup title={copy.structureGroup} subtitle={copy.structureGroupText}>
        {canManageLocations ? (
          <AdminModule id="admin-locations" title={copy.locationsModule}>
            <LocationsAdmin initialLocale={locale} />
          </AdminModule>
        ) : null}

        {canManageUsers ? (
          <AdminModule id="admin-users" title={copy.usersModule}>
            <UsersAdmin initialLocale={locale} />
          </AdminModule>
        ) : null}
      </AdminGroup>

      {isGlobal ? (
        <AdminGroup
          id="admin-content"
          title={copy.contentGroup}
          subtitle={copy.contentGroupText}
        >
          {canManageNews ? (
            <AdminModule id="admin-news" title={copy.newsModule}>
              <NewsAdmin initialLocale={locale} />
            </AdminModule>
          ) : null}

          <AdminModule id="admin-pages" title={copy.pagesModule}>
            <PagesAdmin initialLocale={locale} />
          </AdminModule>

          {isSuperAdmin ? (
            <AdminModule id="admin-instructors" title={copy.instructorsModule}>
              <OfficialInstructorsAdmin initialLocale={locale} />
            </AdminModule>
          ) : null}

          <AdminModule id="admin-settings" title={copy.settingsModule}>
            <SettingsAdmin initialLocale={locale} />
          </AdminModule>
        </AdminGroup>
      ) : null}
    </>
  );
}

function mergeScopes(...scopes: Array<AdminScope | undefined>) {
  const validScopes = scopes.filter(Boolean) as AdminScope[];

  if (validScopes.length === 0) {
    return null;
  }

  return {
    roleKeys: Array.from(new Set(validScopes.flatMap((scope) => scope.roleKeys ?? []))),
    isGlobal: validScopes.some((scope) => scope.isGlobal),
    countryIds: Array.from(
      new Set(validScopes.flatMap((scope) => scope.countryIds ?? [])),
    ),
    dojoIds: Array.from(new Set(validScopes.flatMap((scope) => scope.dojoIds ?? []))),
  };
}

function normalizeEmail(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getPortalRoleKey(
  roleValue:
    | { key?: string }
    | Array<{ key?: string }>
    | null
    | undefined,
) {
  return Array.isArray(roleValue) ? roleValue[0]?.key : roleValue?.key;
}

function AdminModule({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  return (
    <details
      id={id}
      className="border border-[var(--line)] bg-white px-4 py-4 sm:px-5 sm:py-5"
      open={isOpen}
      onToggle={(event) => {
        const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
        setIsOpen(nextOpen);
        if (nextOpen) {
          setHasOpened(true);
        }
      }}
    >
      <summary className="cursor-pointer pr-8 text-lg font-semibold leading-tight sm:text-xl">{title}</summary>
      {isOpen || hasOpened ? (
        <div className="mt-4 sm:mt-5">{children}</div>
      ) : null}
    </details>
  );
}

function AdminGroup({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="grid gap-4">
      <div className="border border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function AdminLoading() {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--muted)]">
      Loading...
    </div>
  );
}

function adminPanelCopy(locale: Locale): AdminPanelCopy {
  const dictionaries: Partial<Record<Locale, Partial<AdminPanelCopy>>> = {
    en: {
      homeTitle: "Control home",
      homeIntro: "Start here. Open only the area you need and keep daily actions, structure, and public content clearly separated.",
      operationsGroup: "Daily operations",
      operationsGroupText: "Member management, event follow-up, internal requests, and IKA course workflows.",
      structureGroup: "Organisation structure",
      structureGroupText: "Countries, dojos, and administrator permissions for each level.",
      contentGroup: "Public website and institutional content",
      contentGroupText: "News, public pages, official instructors, and global site configuration.",
      membersQuickTitle: "Members and archive",
      membersQuickText: "Active Kenshi, inactive members, reactivations, manual creation, and controlled edits.",
      eventsQuickTitle: "Events and registrations",
      eventsQuickText: "Upcoming events, registrations, organiser follow-up, and direct access to attendee control.",
      requestsQuickTitle: "Internal requests",
      requestsQuickText: "Scoped forms, pending approvals, and reusable registration links by role.",
      locationsQuickTitle: "Countries and dojos",
      locationsQuickText: "Open countries or dojos inside your scope and maintain the structure cleanly.",
      coursesQuickTitle: "Courses and Taikai",
      coursesQuickText: "Historical imports, created courses, and official IKA course control.",
      contentQuickTitle: "Public content",
      contentQuickText: "Public pages, news, instructors, and global web settings from one place.",
      noAdminPermissionForAccount: "No administration permission was found for this account.",
      noAdminPermissions: "No administration permissions were found.",
      usersModule: "Users and permissions: create admins",
      coursesModule: "IKA historical courses",
      membersModule: "Kenshi: member registration/import",
      settingsModule: "Global settings",
      eventsModule: "Events and calendar",
      newsModule: "News and archive",
      requestsModule: "Internal forms and approvals",
      locationsModule: "Countries and dojos: country/dojo setup",
      pagesModule: "Public pages",
      instructorsModule: "Official IKA instructors",
    },
    es: {
      homeTitle: "Inicio de control",
      homeIntro: "Empieza aqui. Abre solo el area que necesites y manten separadas las tareas diarias, la estructura y el contenido publico.",
      operationsGroup: "Operacion diaria",
      operationsGroupText: "Gestion de miembros, seguimiento de eventos, solicitudes internas y flujo de cursos IKA.",
      structureGroup: "Estructura de la organizacion",
      structureGroupText: "Paises, dojos y permisos de administracion para cada nivel.",
      contentGroup: "Web publica y contenido institucional",
      contentGroupText: "Noticias, paginas publicas, instructores oficiales y configuracion global del sitio.",
      membersQuickTitle: "Miembros y archivo",
      membersQuickText: "Kenshis activos, alumnos inactivos, reactivaciones, altas manuales y edicion controlada.",
      eventsQuickTitle: "Eventos e inscritos",
      eventsQuickText: "Proximos eventos, inscritos, seguimiento del organizador y acceso directo al control de asistencia.",
      requestsQuickTitle: "Solicitudes internas",
      requestsQuickText: "Formularios por ambito, aprobaciones pendientes y enlaces reutilizables segun el rol.",
      locationsQuickTitle: "Paises y dojos",
      locationsQuickText: "Abre los paises o dojos de tu ambito y manten limpia la estructura general.",
      coursesQuickTitle: "Cursos y Taikai",
      coursesQuickText: "Importaciones historicas, cursos ya creados y control oficial de cursos IKA.",
      contentQuickTitle: "Contenido publico",
      contentQuickText: "Paginas publicas, noticias, instructores y ajustes globales de la web en un solo lugar.",
      noAdminPermissionForAccount: "No se encontro ningun permiso de administracion para esta cuenta.",
      noAdminPermissions: "No se encontraron permisos de administracion.",
      usersModule: "Usuarios y permisos: crear admins",
      coursesModule: "Cursos historicos IKA",
      membersModule: "Kenshi: alta/importacion de miembros",
      settingsModule: "Ajustes globales",
      eventsModule: "Eventos y calendario",
      newsModule: "Noticias y archivo",
      requestsModule: "Formularios internos y aprobaciones",
      locationsModule: "Paises y dojos: alta de pais/dojo",
      pagesModule: "Paginas publicas",
      instructorsModule: "Instructores oficiales IKA",
    },
    it: {
      noAdminPermissionForAccount: "Non e stato trovato alcun permesso di amministrazione per questo account.",
      noAdminPermissions: "Non sono stati trovati permessi di amministrazione.",
      usersModule: "Utenti e permessi: creare admin",
      coursesModule: "Corsi storici IKA",
      membersModule: "Kenshi: registrazione/importazione membri",
      settingsModule: "Impostazioni globali",
      eventsModule: "Eventi e calendario",
      newsModule: "Notizie e archivio",
      requestsModule: "Moduli interni e approvazioni",
      locationsModule: "Paesi e dojo: creazione paese/dojo",
      pagesModule: "Pagine pubbliche",
      instructorsModule: "Istruttori ufficiali IKA",
    },
    fr: {
      noAdminPermissionForAccount: "Aucune autorisation d'administration n'a ete trouvee pour ce compte.",
      noAdminPermissions: "Aucune autorisation d'administration n'a ete trouvee.",
      usersModule: "Utilisateurs et permissions : creer des admins",
      coursesModule: "Cours historiques IKA",
      membersModule: "Kenshi : inscription/import des membres",
      settingsModule: "Parametres globaux",
      eventsModule: "Evenements et calendrier",
      newsModule: "Actualites et archive",
      requestsModule: "Formulaires internes et validations",
      locationsModule: "Pays et dojos : creation pays/dojo",
      pagesModule: "Pages publiques",
      instructorsModule: "Instructeurs officiels IKA",
    },
    cs: {
      noAdminPermissionForAccount: "Pro tento ucet nebylo nalezeno zadne administracni opravneni.",
      noAdminPermissions: "Nebyla nalezena zadna administracni opravneni.",
      usersModule: "Uzivatele a opravneni: vytvorit adminy",
      coursesModule: "Historicke kurzy IKA",
      membersModule: "Kenshi: registrace/import clenu",
      settingsModule: "Globalni nastaveni",
      eventsModule: "Akce a kalendar",
      newsModule: "Novinky a archiv",
      requestsModule: "Interne formulare a schvalovani",
      locationsModule: "Zeme a dojo: vytvoreni zeme/doja",
      pagesModule: "Verejne stranky",
      instructorsModule: "Oficialni instruktori IKA",
    },
    id: {
      noAdminPermissionForAccount: "Tidak ditemukan izin administrasi untuk akun ini.",
      noAdminPermissions: "Tidak ditemukan izin administrasi.",
      usersModule: "Pengguna dan izin: buat admin",
      coursesModule: "Kursus historis IKA",
      membersModule: "Kenshi: pendaftaran/impor anggota",
      settingsModule: "Pengaturan global",
      eventsModule: "Acara dan kalender",
      newsModule: "Berita dan arsip",
      requestsModule: "Formulir internal dan persetujuan",
      locationsModule: "Negara dan dojo: pengaturan negara/dojo",
      pagesModule: "Halaman publik",
      instructorsModule: "Instruktur resmi IKA",
    },
    ms: {
      noAdminPermissionForAccount: "Tiada kebenaran pentadbiran ditemui untuk akaun ini.",
      noAdminPermissions: "Tiada kebenaran pentadbiran ditemui.",
      usersModule: "Pengguna dan kebenaran: cipta admin",
      coursesModule: "Kursus sejarah IKA",
      membersModule: "Kenshi: pendaftaran/import ahli",
      settingsModule: "Tetapan global",
      eventsModule: "Acara dan kalendar",
      newsModule: "Berita dan arkib",
      requestsModule: "Borang dalaman dan kelulusan",
      locationsModule: "Negara dan dojo: tetapan negara/dojo",
      pagesModule: "Halaman awam",
      instructorsModule: "Jurulatih rasmi IKA",
    },
    eu: {
      noAdminPermissionForAccount: "Ez da administrazio-baimenik aurkitu kontu honentzat.",
      noAdminPermissions: "Ez da administrazio-baimenik aurkitu.",
      usersModule: "Erabiltzaileak eta baimenak: adminak sortu",
      coursesModule: "IKA ikastaro historikoak",
      membersModule: "Kenshi: kideen alta/inportazioa",
      settingsModule: "Doikuntza globalak",
      eventsModule: "Ekitaldiak eta egutegia",
      newsModule: "Albisteak eta artxiboa",
      requestsModule: "Barne formularioak eta onarpenak",
      locationsModule: "Herrialdeak eta dojoak: herrialde/dojo alta",
      pagesModule: "Orri publikoak",
      instructorsModule: "IKAko irakasle ofizialak",
    },
    pt: {
      noAdminPermissionForAccount: "Nao foi encontrada qualquer permissao de administracao para esta conta.",
      noAdminPermissions: "Nao foram encontradas permissoes de administracao.",
      usersModule: "Utilizadores e permissoes: criar admins",
      coursesModule: "Cursos historicos IKA",
      membersModule: "Kenshi: registo/importacao de membros",
      settingsModule: "Ajustes globais",
      eventsModule: "Eventos e calendario",
      newsModule: "Noticias e arquivo",
      requestsModule: "Formularios internos e aprovacoes",
      locationsModule: "Paises e dojos: criacao de pais/dojo",
      pagesModule: "Paginas publicas",
      instructorsModule: "Instrutores oficiais IKA",
    },
    de: {
      noAdminPermissionForAccount: "Fur dieses Konto wurde keine Administrationsberechtigung gefunden.",
      noAdminPermissions: "Es wurden keine Administrationsberechtigungen gefunden.",
      usersModule: "Benutzer und Berechtigungen: Admins erstellen",
      coursesModule: "Historische IKA-Kurse",
      membersModule: "Kenshi: Mitgliederaufnahme/-import",
      settingsModule: "Globale Einstellungen",
      eventsModule: "Veranstaltungen und Kalender",
      newsModule: "Nachrichten und Archiv",
      requestsModule: "Interne Formulare und Freigaben",
      locationsModule: "Lander und Dojos: Land/Dojo anlegen",
      pagesModule: "Offentliche Seiten",
      instructorsModule: "Offizielle IKA-Instruktoren",
    },
  };

  const base = dictionaries.en as AdminPanelCopy;

  return {
    ...base,
    ...(dictionaries[locale] ?? {}),
  } as AdminPanelCopy;
}
