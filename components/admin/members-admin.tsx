"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, Send, UsersRound } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/browser";

type CountryOption = {
  id: string;
  code: string;
  country_translations?: Array<{ language_code: string; name: string }>;
};

type DojoOption = {
  id: string;
  country_id: string;
  city: string;
  has_country_admin?: boolean;
  has_dojo_admin?: boolean;
  dojo_translations?: Array<{ language_code: string; name: string }>;
};

type MemberRow = {
  id: string;
  ika_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  current_grade: string | null;
  country_id: string | null;
  dojo_id: string | null;
  countries: CountryOption | null;
  dojos: DojoOption | null;
};

type ImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  dojoId: string;
  dojoName: string;
  birthDate: string;
  joinedDate: string;
  currentGrade: string;
  mainInstructor: string;
  guardianName: string;
  guardianEmail: string;
  isMinor: string;
  notes: string;
};

type MembersPayload = {
  countries: CountryOption[];
  dojos: DojoOption[];
  members: MemberRow[];
};

type MembersLoadResult =
  | { ok: true; payload: MembersPayload }
  | { ok: false; error: string };

const emptyPayload: MembersPayload = {
  countries: [],
  dojos: [],
  members: [],
};

const csvTemplate =
  "first_name,last_name,email,current_grade,joined_date,phone\n" +
  "Ane,Gonzalez,ane@example.com,3 kyu,2026-01-10,+34 600 000 000\n";

export function MembersAdmin({ initialLocale }: { initialLocale: Locale }) {
  const supabase = useMemo(() => createClient(), []);
  const [payload, setPayload] = useState<MembersPayload>(emptyPayload);
  const [session, setSession] = useState<Session | null>(null);
  const [csvText, setCsvText] = useState(csvTemplate);
  const [selectedDojoId, setSelectedDojoId] = useState("");
  const [sendInvites, setSendInvites] = useState(true);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [supabase]);

  const fetchMembersPayload = useCallback(async (): Promise<MembersLoadResult> => {
    const response = await fetch("/api/admin/members", {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: data.error ?? "No se pudo cargar el modulo Kenshi.",
      };
    }

    return { ok: true, payload: data as MembersPayload };
  }, [getAuthHeaders]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const result = await fetchMembersPayload();

    if (!result.ok) {
      setPayload(emptyPayload);
      setMessage(result.error);
    } else {
      setPayload(result.payload);
    }

    setLoading(false);
  }, [fetchMembersPayload]);

  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(({ data }) => {
      if (ignore) {
        return;
      }

      setSession(data.session);

      if (data.session) {
        void loadMembers();
      } else {
        setPayload(emptyPayload);
        setMessage("Inicia sesion como administrador para cargar dojos.");
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setPayload(emptyPayload);
      setSelectedDojoId("");

      if (nextSession) {
        void loadMembers();
      } else {
        setMessage("Inicia sesion como administrador para cargar dojos.");
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [loadMembers, supabase]);

  const rows = useMemo(() => parseCsvRows(csvText, payload), [csvText, payload]);
  const eligibleDojos = useMemo(
    () =>
      payload.dojos.filter(
        (dojo) => dojo.has_country_admin && dojo.has_dojo_admin,
      ),
    [payload.dojos],
  );
  const selectedDojo =
    payload.dojos.find((dojo) => dojo.id === selectedDojoId) ?? null;
  const selectedDojoReady =
    selectedDojo?.has_country_admin === true &&
    selectedDojo?.has_dojo_admin === true;

  const validRows = useMemo(
    () => rows.filter((row) => row.firstName && row.lastName),
    [rows],
  );

  async function importRows() {
    setImporting(true);
    setMessage("");

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({
        rows: validRows.map((row) => ({
          ...row,
          countryId: selectedDojo?.country_id ?? "",
          countryCode: "",
          countryName: "",
          dojoId: selectedDojo?.id ?? "",
          dojoName: "",
        })),
        sendInvites,
        locale: initialLocale,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo importar el lote Kenshi.");
      setImporting(false);
      return;
    }

    const errors = Array.isArray(data.errors) ? data.errors.length : 0;
    setMessage(
      `Importados: ${data.imported ?? 0}. Invitaciones: ${
        data.invited ?? 0
      }. Omitidos: ${data.skipped ?? 0}. Errores: ${errors}.`,
    );
    await loadMembers();
    setImporting(false);
  }

  async function loadCsvFile(file: File) {
    setMessage("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Por ahora sube un CSV exportado desde Excel.");
      return;
    }

    setCsvText(await file.text());
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <UsersRound size={22} className="text-[var(--accent)]" />
              <h2 className="text-2xl font-semibold">Importacion Kenshi</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Selecciona primero el dojo y despues importa muchos practicantes
              a la vez desde Excel exportado como CSV. Solo se puede importar
              cuando el pais tiene admin de pais y el dojo tiene admin de dojo.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold">
            <FileUp size={16} />
            Subir CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void loadCsvFile(file);
                }
              }}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Dojo destino
          <select
            value={selectedDojoId}
            onChange={(event) => setSelectedDojoId(event.target.value)}
            disabled={loading || !session || payload.dojos.length === 0}
            className="border border-[var(--line)] px-3 py-2 font-normal"
          >
            <option value="">Selecciona dojo</option>
            {payload.dojos.map((dojo) => {
              const ready = dojo.has_country_admin && dojo.has_dojo_admin;

              return (
                <option key={dojo.id} value={dojo.id} disabled={!ready}>
                  {dojoLabel(dojo, initialLocale)} ·{" "}
                  {countryLabelById(payload, dojo.country_id, initialLocale)}
                  {ready ? "" : " · falta admin pais o dojo"}
                </option>
              );
            })}
          </select>
          {payload.dojos.length === 0 ? (
            <span className="text-sm text-[var(--accent)]">
              {loading
                ? "Cargando dojos..."
                : message || "No hay dojos disponibles para tu rol."}
            </span>
          ) : eligibleDojos.length === 0 ? (
            <span className="text-sm text-[var(--accent)]">
              Primero crea el admin de pais y el admin de dojo antes de importar
              Kenshi.
            </span>
          ) : null}
          <button
            type="button"
            onClick={loadMembers}
            disabled={loading || !session}
            className="w-fit border border-[var(--line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Recargar dojos"}
          </button>
        </label>

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={8}
          className="w-full border border-[var(--line)] p-3 font-mono text-sm"
        />

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={sendInvites}
              onChange={(event) => setSendInvites(event.target.checked)}
            />
            Enviar invitacion al portal si la fila tiene email
          </label>

          <button
            type="button"
            onClick={importRows}
            disabled={importing || validRows.length === 0 || !selectedDojoReady}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Importar {validRows.length} Kenshi
          </button>
        </div>

        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
        ) : null}
      </section>

      <section className="grid gap-4 border border-[var(--line)] bg-white p-5">
        <h3 className="text-xl font-semibold">Previsualizacion</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Pais</th>
                <th className="py-2 pr-4">Dojo</th>
                <th className="py-2 pr-4">Grado</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, index) => (
                <tr key={`${row.email}-${index}`} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="py-2 pr-4">{row.email || "-"}</td>
                  <td className="py-2 pr-4">
                    {selectedDojo
                      ? countryLabelById(
                          payload,
                          selectedDojo.country_id,
                          initialLocale,
                        )
                      : row.countryName ||
                        row.countryCode ||
                        countryLabelById(payload, row.countryId, initialLocale) ||
                        "-"}
                  </td>
                  <td className="py-2 pr-4">
                    {selectedDojo
                      ? dojoLabel(selectedDojo, initialLocale)
                      : row.dojoName ||
                        dojoLabelById(payload, row.dojoId, initialLocale) ||
                        "-"}
                  </td>
                  <td className="py-2 pr-4">{row.currentGrade || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 20 ? (
          <p className="text-sm text-[var(--muted)]">
            Mostrando 20 de {rows.length} filas.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 border border-[var(--line)] bg-white p-5">
        <h3 className="text-xl font-semibold">Ultimos Kenshi</h3>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Cargando Kenshi...</p>
        ) : payload.members.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No hay Kenshi visibles.</p>
        ) : (
          <div className="grid gap-2">
            {payload.members.map((member) => (
              <div
                key={member.id}
                className="grid gap-1 border border-[var(--line)] px-3 py-2 text-sm md:grid-cols-[1fr_auto]"
              >
                <span>
                  <strong>
                    {member.first_name} {member.last_name}
                  </strong>{" "}
                  <span className="text-[var(--muted)]">
                    {member.ika_number} · {member.email ?? "sin email"}
                  </span>
                </span>
                <span className="text-[var(--muted)]">
                  {member.current_grade ?? "sin grado"} ·{" "}
                  {member.countries
                    ? countryLabel(member.countries, initialLocale)
                    : "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function parseCsvRows(csv: string, payload: MembersPayload): ImportRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((header) =>
    normalizeHeader(header),
  );

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const record = new Map(headers.map((header, index) => [header, values[index] ?? ""]));
    const countryInput =
      getValue(record, "country") || getValue(record, "pais") || getValue(record, "país");
    const dojoInput = getValue(record, "dojo") || getValue(record, "club");
    const country = resolveCountryInput(payload, countryInput);
    const dojo = resolveDojoInput(payload, dojoInput, country?.id ?? "");

    return {
      firstName:
        getValue(record, "first_name") ||
        getValue(record, "firstname") ||
        getValue(record, "nombre"),
      lastName:
        getValue(record, "last_name") ||
        getValue(record, "lastname") ||
        getValue(record, "apellido") ||
        getValue(record, "apellidos"),
      email: getValue(record, "email") || getValue(record, "correo"),
      phone: getValue(record, "phone") || getValue(record, "telefono"),
      countryId: getValue(record, "country_id") || country?.id || "",
      countryCode:
        getValue(record, "country_code") ||
        getValue(record, "codigo_pais") ||
        (!country ? countryInput.toUpperCase() : ""),
      countryName: country ? "" : countryInput,
      dojoId: getValue(record, "dojo_id") || dojo?.id || "",
      dojoName: dojo ? "" : dojoInput,
      birthDate: getValue(record, "birth_date") || getValue(record, "fecha_nacimiento"),
      joinedDate: getValue(record, "joined_date") || getValue(record, "fecha_alta"),
      currentGrade:
        getValue(record, "current_grade") ||
        getValue(record, "grade") ||
        getValue(record, "grado"),
      mainInstructor:
        getValue(record, "main_instructor") || getValue(record, "instructor"),
      guardianName: getValue(record, "guardian_name") || getValue(record, "tutor"),
      guardianEmail:
        getValue(record, "guardian_email") || getValue(record, "email_tutor"),
      isMinor: getValue(record, "is_minor") || getValue(record, "menor"),
      notes: getValue(record, "notes") || getValue(record, "notas"),
    };
  });
}

function detectCsvDelimiter(headerLine: string) {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;

  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";") {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  const cleanLine = line.replace(/^\uFEFF/, "");

  for (let index = 0; index < cleanLine.length; index += 1) {
    const char = cleanLine[index];
    const next = cleanLine[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getValue(record: Map<string, string>, key: string) {
  return record.get(normalizeHeader(key))?.trim() ?? "";
}

function resolveCountryInput(payload: MembersPayload, value: string) {
  const wanted = normalizeComparable(value);

  if (!wanted) {
    return null;
  }

  return (
    payload.countries.find(
      (country) =>
        normalizeComparable(country.code) === wanted ||
        country.country_translations?.some(
          (translation) => normalizeComparable(translation.name) === wanted,
        ),
    ) ?? null
  );
}

function resolveDojoInput(
  payload: MembersPayload,
  value: string,
  countryId: string,
) {
  const wanted = normalizeComparable(value);

  if (!wanted) {
    return null;
  }

  return (
    payload.dojos.find((dojo) => {
      const matches =
        normalizeComparable(dojo.city) === wanted ||
        dojo.dojo_translations?.some(
          (translation) => normalizeComparable(translation.name) === wanted,
        );

      return matches && (!countryId || dojo.country_id === countryId);
    }) ?? null
  );
}

function countryLabelById(
  payload: MembersPayload,
  id: string,
  locale: Locale,
) {
  const country = payload.countries.find((item) => item.id === id);
  return country ? countryLabel(country, locale) : "";
}

function dojoLabelById(payload: MembersPayload, id: string, locale: Locale) {
  const dojo = payload.dojos.find((item) => item.id === id);
  return dojo ? dojoLabel(dojo, locale) : "";
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

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
