"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type RoleKey = "global_admin" | "country_admin" | "dojo_admin";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  status: string;
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
  roles: { key: RoleKey; name: string } | null;
  countries: CountryOption | null;
  dojos: DojoOption | null;
};

type UsersPayload = {
  profiles: Profile[];
  roles: Role[];
  assignments: Assignment[];
  countries: CountryOption[];
  dojos: DojoOption[];
};

const roleLabels: Record<RoleKey, string> = {
  global_admin: "Admin global",
  country_admin: "Admin de pais",
  dojo_admin: "Admin de dojo",
};

export function UsersAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [payload, setPayload] = useState<UsersPayload>({
    profiles: [],
    roles: [],
    assignments: [],
    countries: [],
    dojos: [],
  });
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    roleKey: "country_admin" as RoleKey,
    countryId: "",
    dojoId: "",
    sendInvite: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedingCountries, setSeedingCountries] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudieron cargar los usuarios.");
      setPayload({
        profiles: [],
        roles: [],
        assignments: [],
        countries: [],
        dojos: [],
      });
    } else {
      setPayload(data as UsersPayload);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void loadUsers();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadUsers();
      } else {
        setPayload({
          profiles: [],
          roles: [],
          assignments: [],
          countries: [],
          dojos: [],
        });
      }
    });

    return () => subscription.unsubscribe();
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, locale: initialLocale }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo guardar el usuario.");
      setSaving(false);
      return;
    }

    setForm((current) => ({
      ...current,
      email: "",
      displayName: "",
      countryId: "",
      dojoId: "",
    }));
    setMessage("Usuario y rol guardados.");
    await loadUsers();
    setSaving(false);
  }

  async function seedCountries() {
    setSeedingCountries(true);
    setMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed_countries" }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudieron cargar los paises base.");
      setSeedingCountries(false);
      return;
    }

    setMessage("Paises base cargados. Ya puedes asignar administradores.");
    await loadUsers();
    setSeedingCountries(false);
  }

  async function deleteAssignment(id: string) {
    setMessage("");
    const response = await fetch(`/api/admin/users?id=${id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo quitar el rol.");
      return;
    }

    setMessage("Rol eliminado.");
    await loadUsers();
  }

  const assignmentsByProfile = new Map<string, Assignment[]>();
  payload.assignments.forEach((assignment) => {
    const current = assignmentsByProfile.get(assignment.profile_id) ?? [];
    current.push(assignment);
    assignmentsByProfile.set(assignment.profile_id, current);
  });

  const scopedDojos =
    form.countryId && form.roleKey === "dojo_admin"
      ? payload.dojos.filter((dojo) => dojo.country_id === form.countryId)
      : payload.dojos;

  if (!session) {
    return (
      <div className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <h2 className="text-2xl font-semibold">Acceso super admin</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Entra con tu usuario super_admin para invitar administradores y
          asignarles paises o dojos.
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
          onClick={signIn}
          disabled={loading || !loginEmail}
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white disabled:opacity-50"
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
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <UserPlus size={22} className="text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">Invitar administrador</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <TextInput
            label="Email"
            value={form.email}
            type="email"
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
          />
          <TextInput
            label="Nombre visible"
            value={form.displayName}
            onChange={(value) =>
              setForm((current) => ({ ...current, displayName: value }))
            }
          />

          <label className="grid gap-2 text-sm font-semibold">
            Rol
            <select
              value={form.roleKey}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  roleKey: event.target.value as RoleKey,
                  countryId: "",
                  dojoId: "",
                }))
              }
              className="border border-[var(--line)] px-3 py-2 font-normal"
            >
              <option value="global_admin">Admin global</option>
              <option value="country_admin">Admin de pais</option>
              <option value="dojo_admin">Admin de dojo</option>
            </select>
          </label>

          {form.roleKey === "country_admin" || form.roleKey === "dojo_admin" ? (
            <div className="grid gap-2">
              <label className="grid gap-2 text-sm font-semibold">
                Pais
                <select
                  value={form.countryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      countryId: event.target.value,
                      dojoId: "",
                    }))
                  }
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                >
                  <option value="">Selecciona pais</option>
                  {payload.countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {countryLabel(country, initialLocale)}
                    </option>
                  ))}
                </select>
              </label>

              {!loading && payload.countries.length === 0 ? (
                <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-3 text-sm">
                  <p className="text-[var(--muted)]">
                    No hay paises reales en Supabase. La web publica puede
                    mostrar paises de respaldo, pero para permisos hacen falta
                    registros con ID.
                  </p>
                  <button
                    type="button"
                    onClick={seedCountries}
                    disabled={seedingCountries}
                    className="inline-flex items-center justify-center gap-2 border border-[var(--line)] bg-white px-3 py-2 font-semibold disabled:opacity-50"
                  >
                    {seedingCountries ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Database size={16} />
                    )}
                    Cargar paises base
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {form.roleKey === "dojo_admin" ? (
            <label className="grid gap-2 text-sm font-semibold">
              Dojo
              <select
                value={form.dojoId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dojoId: event.target.value,
                  }))
                }
                className="border border-[var(--line)] px-3 py-2 font-normal"
              >
                <option value="">Selecciona dojo</option>
                {scopedDojos.map((dojo) => (
                  <option key={dojo.id} value={dojo.id}>
                    {dojoLabel(dojo, initialLocale)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.sendInvite}
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
            onClick={saveUserRole}
            disabled={
              saving ||
              !form.email ||
              (form.roleKey === "country_admin" && !form.countryId) ||
              (form.roleKey === "dojo_admin" && !form.dojoId)
            }
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Guardar rol
          </button>

          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}

          <div className="border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--muted)]">
            <p className="font-semibold text-[var(--ink)]">
              Credenciales Kenshi
            </p>
            <p>
              Para estudiantes, el flujo correcto sera crear la ficha Kenshi y
              enviar una invitacion segura por email. El Kenshi activara su
              cuenta y podra cambiar su usuario/contraseña desde su portal; no
              se deben enviar contraseñas fijas por correo.
            </p>
          </div>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">Usuarios y permisos</h2>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Cargando usuarios...</p>
          ) : payload.profiles.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No hay usuarios visibles.
            </p>
          ) : (
            payload.profiles.map((profile) => (
              <article key={profile.id} className="border border-[var(--line)] p-4">
                <div>
                  <h3 className="font-semibold">
                    {profile.display_name || profile.email}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {profile.email} · {profile.status}
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  {(assignmentsByProfile.get(profile.id) ?? []).length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                      Sin roles asignados.
                    </p>
                  ) : (
                    (assignmentsByProfile.get(profile.id) ?? []).map(
                      (assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-wrap items-center justify-between gap-3 bg-[var(--paper)] px-3 py-2 text-sm"
                        >
                          <span>
                            <strong>
                              {roleLabels[assignment.roles?.key ?? "dojo_admin"]}
                            </strong>
                            {assignment.countries
                              ? ` · ${countryLabel(
                                  assignment.countries,
                                  initialLocale,
                                )}`
                              : ""}
                            {assignment.dojos
                              ? ` · ${dojoLabel(assignment.dojos, initialLocale)}`
                              : ""}
                          </span>
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="inline-flex items-center gap-2 text-[var(--accent)]"
                          >
                            <Trash2 size={15} />
                            Quitar
                          </button>
                        </div>
                      ),
                    )
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      />
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
