"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type RoleKey = "global_admin" | "country_admin" | "dojo_admin";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  status: string;
  kenshiIds?: string[];
  kenshiNames?: string[];
};

type Role = {
  id: string;
  key: RoleKey;
  name: string;
};

type CountryOption = {
  id: string;
  code: string;
  country_translations?: Array<{ language_code: string; name: string }>;
};

type DojoOption = {
  id: string;
  country_id: string;
  city: string;
  dojo_translations?: Array<{ language_code: string; name: string }>;
};

type Assignment = {
  id: string;
  profile_id: string;
  role_id: string;
  country_id: string | null;
  dojo_id: string | null;
  roles: { key: string; name: string } | null;
  countries: CountryOption | null;
  dojos: DojoOption | null;
};

type UsersPayload = {
  profiles: Profile[];
  roles: Role[];
  assignments: Assignment[];
  countries: CountryOption[];
  dojos: DojoOption[];
  assignableRoles: RoleKey[];
  scope: {
    isSuperAdmin: boolean;
    isGlobalAdmin: boolean;
    countryIds: string[];
    dojoIds: string[];
    roleKeys: string[];
  };
};

type FormState = {
  email: string;
  displayName: string;
  roleKey: RoleKey | "";
  countryId: string;
  dojoId: string;
  sendInvite: boolean;
};

const emptyPayload: UsersPayload = {
  profiles: [],
  roles: [],
  assignments: [],
  countries: [],
  dojos: [],
  assignableRoles: [],
  scope: {
    isSuperAdmin: false,
    isGlobalAdmin: false,
    countryIds: [],
    dojoIds: [],
    roleKeys: [],
  },
};

const roleLabels: Record<RoleKey, string> = {
  global_admin: "Admin global",
  country_admin: "Admin de pais",
  dojo_admin: "Admin de dojo",
};

function createEmptyForm(): FormState {
  return {
    email: "",
    displayName: "",
    roleKey: "",
    countryId: "",
    dojoId: "",
    sendInvite: true,
  };
}

export function UsersAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [payload, setPayload] = useState<UsersPayload>(emptyPayload);
  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [supabase]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/users", {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setPayload(emptyPayload);
      setForm(createEmptyForm());
      setMessage(data.error ?? "No se pudieron cargar usuarios y permisos.");
      setLoading(false);
      return;
    }

    const nextPayload = data as UsersPayload;
    const firstRole = nextPayload.assignableRoles[0] ?? "";

    setPayload(nextPayload);
    setForm((current) => ({
      ...current,
      roleKey:
        current.roleKey && nextPayload.assignableRoles.includes(current.roleKey)
          ? current.roleKey
          : firstRole,
      countryId: current.countryId,
      dojoId: current.dojoId,
    }));
    setLoading(false);
  }, [getAuthHeaders]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);

      if (data.session) {
        void loadUsers();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setPayload(emptyPayload);
      setForm(createEmptyForm());

      if (nextSession) {
        void loadUsers();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUsers, supabase]);

  async function signIn() {
    setLoading(true);
    setMessage("");

    const result = password
      ? await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        })
      : await supabase.auth.signInWithOtp({
          email: loginEmail,
          options: {
            emailRedirectTo:
              typeof window === "undefined"
                ? undefined
                : `${window.location.origin}/${initialLocale}/admin`,
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (!password) {
      setMessage("Revisa tu email para entrar al admin.");
    }

    setLoading(false);
  }

  async function saveUserRole() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ ...form, locale: initialLocale }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo guardar el rol.");
      setSaving(false);
      return;
    }

    setForm((current) => ({
      ...createEmptyForm(),
      roleKey: payload.assignableRoles[0] ?? "",
      sendInvite: current.sendInvite,
    }));
    setMessage(data.invited ? "Invitacion enviada y rol guardado." : "Rol guardado.");
    await loadUsers();
    setSaving(false);
  }

  async function deleteAssignment(id: string) {
    setMessage("");

    const response = await fetch(`/api/admin/users?id=${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo quitar el rol.");
      return;
    }

    setMessage("Rol eliminado.");
    await loadUsers();
  }

  const dojosForSelectedCountry = useMemo(
    () =>
      form.countryId
        ? payload.dojos.filter((dojo) => dojo.country_id === form.countryId)
        : payload.dojos,
    [form.countryId, payload.dojos],
  );
  const assignmentsByProfile = useMemo(() => {
    const map = new Map<string, Assignment[]>();

    payload.assignments.forEach((assignment) => {
      const current = map.get(assignment.profile_id) ?? [];
      current.push(assignment);
      map.set(assignment.profile_id, current);
    });

    return map;
  }, [payload.assignments]);
  const profileRows = useMemo(
    () =>
      payload.profiles.map((profile) => ({
        profile,
        assignments: assignmentsByProfile.get(profile.id) ?? [],
      })),
    [assignmentsByProfile, payload.profiles],
  );
  const filteredProfileRows = useMemo(() => {
    const query = normalizeSearchText(permissionSearch);

    if (!query) {
      return profileRows;
    }

    return profileRows.filter(({ profile, assignments }) => {
      const searchableText = [
        profile.email,
        profile.display_name,
        profile.status,
        ...(profile.kenshiIds ?? []),
        ...(profile.kenshiNames ?? []),
        ...assignments.flatMap((assignment) => [
          getRoleLabel(assignment.roles),
          assignment.countries ? countryLabel(assignment.countries, initialLocale) : "",
          assignment.dojos ? dojoLabel(assignment.dojos, initialLocale) : "",
        ]),
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeSearchText(searchableText).includes(query);
    });
  }, [initialLocale, permissionSearch, profileRows]);
  const hierarchicalPermissions = useMemo(() => {
    const knownCountryIds = new Set(payload.countries.map((country) => country.id));
    const knownDojoIds = new Set(payload.dojos.map((dojo) => dojo.id));
    const globalAssignments = filteredProfileRows.flatMap((row) =>
      row.assignments
        .filter((assignment) => !assignment.country_id && !assignment.dojo_id)
        .map((assignment) => ({ row, assignment })),
    );
    const countrySections = payload.countries
      .map((country) => {
        const countryDojos = payload.dojos.filter(
          (dojo) => dojo.country_id === country.id,
        );
        const countryAssignments = filteredProfileRows.flatMap((row) =>
          row.assignments
            .filter(
              (assignment) =>
                assignment.country_id === country.id && !assignment.dojo_id,
            )
            .map((assignment) => ({ row, assignment })),
        );
        const dojoSections = countryDojos
          .map((dojo) => ({
            dojo,
            assignments: filteredProfileRows.flatMap((row) =>
              row.assignments
                .filter((assignment) => assignment.dojo_id === dojo.id)
                .map((assignment) => ({ row, assignment })),
            ),
          }))
          .filter((section) => section.assignments.length > 0);
        const total =
          countryAssignments.length +
          dojoSections.reduce(
            (count, section) => count + section.assignments.length,
            0,
          );

        return { country, countryAssignments, dojoSections, total };
      })
      .filter((section) => section.total > 0);
    const unlocatedAssignments = filteredProfileRows.flatMap((row) =>
      row.assignments
        .filter(
          (assignment) =>
            (assignment.country_id && !knownCountryIds.has(assignment.country_id)) ||
            (assignment.dojo_id && !knownDojoIds.has(assignment.dojo_id)),
        )
        .map((assignment) => ({ row, assignment })),
    );

    return { globalAssignments, countrySections, unlocatedAssignments };
  }, [filteredProfileRows, payload.countries, payload.dojos]);
  const canSave =
    Boolean(form.email && form.roleKey) &&
    (form.roleKey !== "country_admin" || Boolean(form.countryId)) &&
    (form.roleKey !== "dojo_admin" || Boolean(form.dojoId));

  if (!session) {
    return (
      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <h2 className="text-2xl font-semibold">Acceso admin</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Entra con un usuario administrador para gestionar permisos.
        </p>
        <input
          value={loginEmail}
          onChange={(event) => setLoginEmail(event.target.value)}
          placeholder="Email"
          type="email"
          className="border border-[var(--line)] px-3 py-2"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contrasena opcional"
          type="password"
          className="border border-[var(--line)] px-3 py-2"
        />
        <button
          type="button"
          onClick={signIn}
          disabled={loading || !loginEmail}
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Entrar
        </button>
        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <UserPlus size={22} className="text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">Crear administrador</h2>
        </div>

        <div className="mt-5 grid gap-4">
          {message ? (
            <p className="border border-[var(--line)] bg-[var(--paper)] p-3 text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}

          {!loading && payload.assignableRoles.length === 0 ? (
            <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4 text-sm">
              <p className="font-semibold text-[var(--accent)]">
                Este usuario no puede crear administradores desde este modulo.
              </p>
              <button
                type="button"
                onClick={loadUsers}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] bg-white px-3 py-2 font-semibold"
              >
                <RefreshCw size={16} />
                Recargar permisos
              </button>
            </div>
          ) : null}

          <TextInput
            label="Email"
            value={form.email}
            type="email"
            disabled={payload.assignableRoles.length === 0}
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
          />
          <TextInput
            label="Nombre visible"
            value={form.displayName}
            disabled={payload.assignableRoles.length === 0}
            onChange={(value) =>
              setForm((current) => ({ ...current, displayName: value }))
            }
          />

          <SelectInput
            label="Rol"
            value={form.roleKey}
            disabled={loading || payload.assignableRoles.length === 0}
            options={[
              { value: "", label: loading ? "Cargando roles..." : "Selecciona rol" },
              ...payload.assignableRoles.map((roleKey) => ({
                value: roleKey,
                label: roleLabels[roleKey],
              })),
            ]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                roleKey: value as RoleKey,
                countryId: "",
                dojoId: "",
              }))
            }
          />

          {form.roleKey === "country_admin" || form.roleKey === "dojo_admin" ? (
            <SelectInput
              label="Pais"
              value={form.countryId}
              disabled={loading || payload.countries.length === 0}
              options={[
                {
                  value: "",
                  label:
                    payload.countries.length === 0
                      ? "No hay paises disponibles"
                      : "Selecciona pais",
                },
                ...payload.countries.map((country) => ({
                  value: country.id,
                  label: countryLabel(country, initialLocale),
                })),
              ]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  countryId: value,
                  dojoId: "",
                }))
              }
            />
          ) : null}

          {form.roleKey === "dojo_admin" ? (
            <SelectInput
              label="Dojo"
              value={form.dojoId}
              disabled={loading || dojosForSelectedCountry.length === 0}
              options={[
                {
                  value: "",
                  label:
                    dojosForSelectedCountry.length === 0
                      ? "No hay dojos disponibles"
                      : "Selecciona dojo",
                },
                ...dojosForSelectedCountry.map((dojo) => ({
                  value: dojo.id,
                  label: dojoLabel(dojo, initialLocale),
                })),
              ]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  dojoId: value,
                }))
              }
            />
          ) : null}

          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.sendInvite}
              disabled={payload.assignableRoles.length === 0}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sendInvite: event.target.checked,
                }))
              }
            />
            Enviar invitacion por email
          </label>

          <button
            type="button"
            onClick={saveUserRole}
            disabled={saving || loading || !canSave}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Guardar rol
          </button>

          <div className="border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--muted)]">
            <p className="font-semibold text-[var(--ink)]">Reglas de permisos</p>
            <p>
              Super admin crea admins globales, de pais y de dojo. Admin global
              crea admins de pais y dojo. Admin de pais crea admins de dojo de
              su pais. Admin de dojo no crea administradores.
            </p>
          </div>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-[var(--accent)]" />
            <div>
              <h2 className="text-2xl font-semibold">Usuarios y permisos</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Organizado por pais, dojo y usuario para evitar listas inmensas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-semibold">
          Busqueda general
          <span className="flex items-center border border-[var(--line)] bg-white px-3">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
              placeholder="Buscar por email, nombre, rol, pais, dojo o ID Kenshi"
              className="h-11 min-w-0 flex-1 px-3 font-normal outline-none"
            />
          </span>
        </label>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
          <span className="border border-[var(--line)] px-2 py-1">
            {filteredProfileRows.length} usuarios visibles
          </span>
          <span className="border border-[var(--line)] px-2 py-1">
            {filteredProfileRows.reduce(
              (count, row) => count + row.assignments.length,
              0,
            )}{" "}
            roles
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Cargando permisos...</p>
          ) : filteredProfileRows.length === 0 ? (
            <p className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">
              No hay usuarios que coincidan con la busqueda.
            </p>
          ) : (
            <>
              {hierarchicalPermissions.globalAssignments.length > 0 ? (
                <details open className="border border-[var(--line)] bg-white">
                  <summary className="cursor-pointer list-none p-4 font-semibold marker:hidden">
                    Administracion global - {hierarchicalPermissions.globalAssignments.length} roles
                  </summary>
                  <div className="grid gap-2 border-t border-[var(--line)] p-3">
                    {hierarchicalPermissions.globalAssignments.map(({ row, assignment }) => (
                      <PermissionAssignmentRow
                        key={assignment.id}
                        profile={row.profile}
                        assignment={assignment}
                        locale={initialLocale}
                        onDelete={deleteAssignment}
                      />
                    ))}
                  </div>
                </details>
              ) : null}

              {hierarchicalPermissions.countrySections.map((countrySection) => (
                <details key={countrySection.country.id} className="border border-[var(--line)] bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
                    <span className="font-semibold">
                      {countryLabel(countrySection.country, initialLocale)}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {countrySection.total} roles - {countrySection.dojoSections.length} dojos
                    </span>
                  </summary>

                  <div className="grid gap-3 border-t border-[var(--line)] p-3">
                    {countrySection.countryAssignments.length > 0 ? (
                      <details open className="bg-[var(--paper)]">
                        <summary className="cursor-pointer list-none p-3 text-sm font-semibold marker:hidden">
                          Administradores de pais - {countrySection.countryAssignments.length}
                        </summary>
                        <div className="grid gap-2 px-3 pb-3">
                          {countrySection.countryAssignments.map(({ row, assignment }) => (
                            <PermissionAssignmentRow
                              key={assignment.id}
                              profile={row.profile}
                              assignment={assignment}
                              locale={initialLocale}
                              onDelete={deleteAssignment}
                            />
                          ))}
                        </div>
                      </details>
                    ) : null}

                    {countrySection.dojoSections.map((dojoSection) => (
                      <details key={dojoSection.dojo.id} className="bg-[var(--paper)]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 marker:hidden">
                          <span className="text-sm font-semibold">
                            {dojoLabel(dojoSection.dojo, initialLocale)}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {dojoSection.assignments.length} roles
                          </span>
                        </summary>
                        <div className="grid gap-2 px-3 pb-3">
                          {dojoSection.assignments.map(({ row, assignment }) => (
                            <PermissionAssignmentRow
                              key={assignment.id}
                              profile={row.profile}
                              assignment={assignment}
                              locale={initialLocale}
                              onDelete={deleteAssignment}
                            />
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}

              {hierarchicalPermissions.unlocatedAssignments.length > 0 ? (
                <details className="border border-[var(--line)] bg-white">
                  <summary className="cursor-pointer list-none p-4 font-semibold marker:hidden">
                    Roles sin ubicacion visible - {hierarchicalPermissions.unlocatedAssignments.length}
                  </summary>
                  <div className="grid gap-2 border-t border-[var(--line)] p-3">
                    {hierarchicalPermissions.unlocatedAssignments.map(({ row, assignment }) => (
                      <PermissionAssignmentRow
                        key={assignment.id}
                        profile={row.profile}
                        assignment={assignment}
                        locale={initialLocale}
                        onDelete={deleteAssignment}
                      />
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PermissionAssignmentRow({
  profile,
  assignment,
  locale,
  onDelete,
}: {
  profile: Profile;
  assignment: Assignment;
  locale: Locale;
  onDelete: (id: string) => void;
}) {
  const kenshiIds = profile.kenshiIds ?? [];
  const kenshiNames = profile.kenshiNames ?? [];

  return (
    <article className="border border-[var(--line)] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{profile.display_name || profile.email}</h3>
          <p className="mt-1 break-all text-[var(--muted)]">
            {profile.email} - {profile.status}
          </p>
          {kenshiIds.length > 0 || kenshiNames.length > 0 ? (
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              {[...kenshiNames, ...kenshiIds].join(" - ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDelete(assignment.id)}
          className="inline-flex items-center gap-2 text-[var(--accent)]"
        >
          <Trash2 size={15} />
          Quitar
        </button>
      </div>
      <p className="mt-3 bg-[var(--paper)] px-3 py-2">
        <strong>{getRoleLabel(assignment.roles)}</strong>
        {assignment.countries
          ? ` - ${countryLabel(assignment.countries, locale)}`
          : ""}
        {assignment.dojos ? ` - ${dojoLabel(assignment.dojos, locale)}` : ""}
      </p>
    </article>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        type={type}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal disabled:bg-[var(--paper)] disabled:opacity-70"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[var(--line)] bg-white px-3 py-2 font-normal disabled:bg-[var(--paper)] disabled:opacity-70"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function countryLabel(country: CountryOption, locale: Locale) {
  return (
    country.country_translations?.find((item) => item.language_code === locale)
      ?.name ??
    country.country_translations?.[0]?.name ??
    country.code
  );
}

function dojoLabel(dojo: DojoOption, locale: Locale) {
  return (
    dojo.dojo_translations?.find((item) => item.language_code === locale)
      ?.name ??
    dojo.dojo_translations?.[0]?.name ??
    dojo.city
  );
}

function getRoleLabel(role: Assignment["roles"]) {
  if (!role) {
    return "Rol";
  }

  return roleLabels[role.key as RoleKey] ?? role.name;
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
