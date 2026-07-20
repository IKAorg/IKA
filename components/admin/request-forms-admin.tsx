"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  MailCheck,
  Plus,
  Power,
  Trash2,
  XCircle,
} from "lucide-react";
import { createPortalClient } from "@/lib/supabase/portal-browser";
import {
  getAdminSessionBridgeHeaders,
  hasAdminSessionBridge,
  saveAdminSessionBridge,
} from "@/lib/supabase/admin-session-bridge";
import type { Locale } from "@/lib/i18n/config";
import { defaultLocale } from "@/lib/i18n/config";

type FormType = "country" | "dojo" | "kenshi";
type SubmissionStatus = "pending" | "needs_info" | "approved" | "rejected";

type Payload = {
  forms: Array<{
    id: string;
    form_type: FormType;
    title: string;
    status: "active" | "inactive";
    locale: string;
    country_id: string | null;
    dojo_id: string | null;
    access_token: string;
    created_at: string;
  }>;
  submissions: Array<{
    id: string;
    form_id: string;
    submission_type: FormType;
    status: SubmissionStatus;
    locale: string;
    applicant_email: string | null;
    applicant_name: string | null;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
  countries: Array<{
    id: string;
    code: string;
    country_translations?: Array<{ language_code: string; name: string }>;
  }>;
  dojos: Array<{
    id: string;
    country_id: string;
    city: string;
    dojo_translations?: Array<{ language_code: string; name: string }>;
  }>;
  permissions: {
    canCreateCountryForms: boolean;
    canCreateDojoForms: boolean;
    canCreateKenshiForms: boolean;
  };
};

type LocationsFallbackPayload = {
  countries?: Payload["countries"];
  dojos?: Payload["dojos"];
  scope?: {
    roleKeys?: string[];
    countryIds?: string[];
    dojoIds?: string[];
    isGlobal?: boolean;
  };
  error?: string;
};

export function RequestFormsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const copy = useMemo(() => getCopy(initialLocale), [initialLocale]);
  const supabase = useMemo(() => createPortalClient(), []);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formType, setFormType] = useState<FormType>("kenshi");
  const [countryId, setCountryId] = useState("");
  const [dojoId, setDojoId] = useState("");
  const [title, setTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | SubmissionStatus
  >("all");

  const headers = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}` }
      : getAdminSessionBridgeHeaders();
  }, [supabase]);

  const load = useCallback(async (attempt = 0) => {
    setLoading(true);
    setMessage("");
    const requestHeaders = await headers();
    const response = await fetch("/api/admin/requests", {
      cache: "no-store",
      headers: requestHeaders,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (
        attempt === 0 &&
        (data.error === "No autenticado." ||
          data.error === "No se encontro un perfil administrador para esta sesion.") &&
        hasAdminSessionBridge()
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        return load(1);
      }

      const fallbackResponse = await fetch("/api/admin/locations", {
        cache: "no-store",
        headers: requestHeaders,
      });
      const fallbackData =
        (await fallbackResponse.json().catch(() => ({}))) as LocationsFallbackPayload;

      if (fallbackResponse.ok) {
        const roleKeys = fallbackData.scope?.roleKeys ?? [];
        const countryIds = fallbackData.scope?.countryIds ?? [];
        const dojoIds = fallbackData.scope?.dojoIds ?? [];
        const isGlobal =
          Boolean(fallbackData.scope?.isGlobal) ||
          roleKeys.includes("super_admin") ||
          roleKeys.includes("global_admin");

        setPayload({
          forms: [],
          submissions: [],
          countries: fallbackData.countries ?? [],
          dojos: fallbackData.dojos ?? [],
          permissions: {
            canCreateCountryForms: roleKeys.includes("super_admin"),
            canCreateDojoForms: isGlobal || countryIds.length > 0,
            canCreateKenshiForms:
              isGlobal || countryIds.length > 0 || dojoIds.length > 0,
          },
        });
        setMessage("");
        setLoading(false);
        return;
      }

      setPayload(null);
      setMessage(data.error ?? fallbackData.error ?? copy.loadError);
      setLoading(false);
      return;
    }

    setPayload(data as Payload);
    setLoading(false);
  }, [copy.loadError, headers]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      if (data.session) {
        saveAdminSessionBridge(data.session);
      }
      void load();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        saveAdminSessionBridge(nextSession);
      }
      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [load, supabase]);

  useEffect(() => {
    if (!payload) {
      return;
    }

    const allowed: FormType[] = [
      ...(payload.permissions.canCreateCountryForms ? ["country"] : []),
      ...(payload.permissions.canCreateDojoForms ? ["dojo"] : []),
      ...(payload.permissions.canCreateKenshiForms ? ["kenshi"] : []),
    ] as FormType[];

    if (allowed.length > 0 && !allowed.includes(formType)) {
      setFormType(allowed[0]);
    }
  }, [payload, formType]);

  async function createForm() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await headers()),
      },
      body: JSON.stringify({
        action: "create_form",
        formType,
        countryId: formType === "dojo" ? countryId : undefined,
        dojoId: formType === "kenshi" ? dojoId : undefined,
        title,
        locale: initialLocale,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? copy.createError);
      return;
    }

    setMessage(copy.created.replace("{url}", data.publicUrl));
    setTitle("");
    await load();
  }

  async function toggleForm(formId: string, nextStatus: "active" | "inactive") {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await headers()),
      },
      body: JSON.stringify({
        action: "toggle_form",
        formId,
        status: nextStatus,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? copy.toggleError);
      return;
    }

    setMessage(
      nextStatus === "inactive" ? copy.deactivated : copy.activated,
    );
    await load();
  }

  async function updateSubmission(
    submissionId: string,
    action: "approve_submission" | "update_submission_status",
    status?: SubmissionStatus,
  ) {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await headers()),
      },
      body: JSON.stringify({
        action,
        submissionId,
        status,
        reviewNotes: "",
        locale: initialLocale,
        sendEmail: true,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? copy.actionError);
      return;
    }

    setMessage(
      action === "approve_submission"
        ? `${copy.approved} ${data.approvedEntityLabel ?? ""}`.trim()
        : status === "rejected"
          ? copy.rejected
          : copy.needsInfo,
    );
    await load();
  }

  async function copyUrl(token: string) {
    const url = `${window.location.origin}/${initialLocale}/requests/${token}`;
    await navigator.clipboard.writeText(url);
    setMessage(copy.linkCopied);
  }

  async function deleteForm(formId: string, formTitle: string) {
    const confirmed = window.confirm(
      copy.deleteConfirm.replace("{title}", formTitle),
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await headers()),
      },
      body: JSON.stringify({
        action: "delete_form",
        formId,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? copy.deleteError);
      return;
    }

    setMessage(copy.deleted);
    await load();
  }

  const submissions = payload?.submissions ?? [];
  const filteredSubmissions = submissions.filter((submission) =>
    statusFilter === "all" ? true : submission.status === statusFilter,
  );

  const countryNameById = useCallback(
    (value: string | null | undefined) => {
      if (!value || !payload) {
        return "";
      }
      const country = payload.countries.find((item) => item.id === value);
      return country?.country_translations?.[0]?.name ?? country?.code ?? "";
    },
    [payload],
  );

  const dojoNameById = useCallback(
    (value: string | null | undefined) => {
      if (!value || !payload) {
        return "";
      }
      const dojo = payload.dojos.find((item) => item.id === value);
      return dojo?.dojo_translations?.[0]?.name ?? dojo?.city ?? "";
    },
    [payload],
  );

  const counters = {
    totalForms: payload?.forms.length ?? 0,
    pending: submissions.filter((item) => item.status === "pending").length,
    needsInfo: submissions.filter((item) => item.status === "needs_info").length,
    approved: submissions.filter((item) => item.status === "approved").length,
    rejected: submissions.filter((item) => item.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="border border-[var(--line)] bg-[var(--paper)] p-5 text-sm">
        {copy.loading}
      </div>
    );
  }

  const availableFormTypes: Array<{ value: FormType; label: string }> = [
    ...(payload?.permissions.canCreateCountryForms
      ? [{ value: "country" as const, label: copy.countryForm }]
      : []),
    ...(payload?.permissions.canCreateDojoForms
      ? [{ value: "dojo" as const, label: copy.dojoForm }]
      : []),
    ...(payload?.permissions.canCreateKenshiForms
      ? [{ value: "kenshi" as const, label: copy.kenshiForm }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={copy.totalForms} value={String(counters.totalForms)} />
        <MetricCard label={copy.pendingShort} value={String(counters.pending)} />
        <MetricCard
          label={copy.needsInfoShort}
          value={String(counters.needsInfo)}
        />
        <MetricCard label={copy.approvedShort} value={String(counters.approved)} />
        <MetricCard label={copy.rejectedShort} value={String(counters.rejected)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="border border-[var(--line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
            {copy.kicker}
          </p>
          <h3 className="mt-3 text-3xl font-semibold">{copy.title}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {copy.description}
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <span className="mb-2 block text-sm font-semibold">
                {copy.formType}
              </span>
              <div className="grid gap-2 sm:grid-cols-3">
                {availableFormTypes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFormType(item.value)}
                    className={`min-h-12 border px-4 py-3 text-left text-sm font-semibold transition ${
                      formType === item.value
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                {copy.formTitle}
              </span>
              <input
                className="input-base"
                placeholder={copy.formTitlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            {formType === "dojo" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {copy.country}
                </span>
                <select
                  className="input-base"
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                >
                  <option value="">{copy.select}</option>
                  {payload?.countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.country_translations?.[0]?.name ?? country.code}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {formType === "kenshi" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {copy.dojo}
                </span>
                <select
                  className="input-base"
                  value={dojoId}
                  onChange={(e) => setDojoId(e.target.value)}
                >
                  <option value="">{copy.select}</option>
                  {payload?.dojos.map((dojo) => (
                    <option key={dojo.id} value={dojo.id}>
                      {dojo.dojo_translations?.[0]?.name ?? dojo.city}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              disabled={
                saving ||
                availableFormTypes.length === 0 ||
                (formType === "dojo" && !countryId) ||
                (formType === "kenshi" && !dojoId)
              }
              onClick={createForm}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {copy.create}
            </button>
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-5">
          <h3 className="text-xl font-semibold">{copy.activeForms}</h3>
          <div className="mt-4 space-y-3">
            {payload?.forms.length ? (
              payload.forms.map((form) => (
                <div
                  key={form.id}
                  className="border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                        {formatFormType(form.form_type, copy)}
                      </p>
                      <p className="text-lg font-semibold">{form.title}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {describeFormScope(
                          form,
                          copy,
                          countryNameById(form.country_id),
                          dojoNameById(form.dojo_id),
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        <span
                          className={`border px-2 py-1 font-semibold ${
                            form.status === "active"
                              ? "border-green-600 text-green-700"
                              : "border-[var(--line)] text-[var(--muted)]"
                          }`}
                        >
                          {form.status === "active"
                            ? copy.activeStatus
                            : copy.inactiveStatus}
                        </span>
                        <span>
                          {copy.createdOn}{" "}
                          {new Date(form.created_at).toLocaleDateString(initialLocale)}
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-2 xl:min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => copyUrl(form.access_token)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        <Copy className="h-4 w-4" />
                        {copy.copy}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          toggleForm(
                            form.id,
                            form.status === "active" ? "inactive" : "active",
                          )
                        }
                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        <Power className="h-4 w-4" />
                        {form.status === "active"
                          ? copy.deactivate
                          : copy.activate}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => deleteForm(form.id, form.title)}
                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--accent)] bg-white px-3 py-2 text-sm font-semibold text-[var(--accent)] disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {copy.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">{copy.noForms}</p>
            )}
          </div>
        </section>
      </div>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">{copy.pendingRequests}</h3>
          <select
            className="input-base min-w-[220px]"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | SubmissionStatus)
            }
          >
            <option value="all">{copy.allStatuses}</option>
            <option value="pending">{copy.pendingShort}</option>
            <option value="needs_info">{copy.needsInfoShort}</option>
            <option value="approved">{copy.approvedShort}</option>
            <option value="rejected">{copy.rejectedShort}</option>
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {filteredSubmissions.length ? (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                      {formatFormType(submission.submission_type, copy)} {" | "}
                      {formatStatus(submission.status, copy)}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {submission.applicant_name ||
                        submission.applicant_email ||
                        copy.noName}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {submission.applicant_email}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {copy.requestedOn}{" "}
                      {new Date(submission.created_at).toLocaleDateString(
                        initialLocale,
                      )}
                    </p>
                  </div>

                  {submission.status === "pending" ||
                  submission.status === "needs_info" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSubmission(submission.id, "approve_submission")
                        }
                        className="inline-flex items-center gap-2 bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {copy.approve}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSubmission(
                            submission.id,
                            "update_submission_status",
                            "needs_info",
                          )
                        }
                        className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        <MailCheck className="h-4 w-4" />
                        {copy.askInfo}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSubmission(
                            submission.id,
                            "update_submission_status",
                            "rejected",
                          )
                        }
                        className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                      >
                        <XCircle className="h-4 w-4" />
                        {copy.reject}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">{copy.noRequests}</p>
          )}
        </div>
      </section>

      {message ? (
        <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--line)] bg-white p-4">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function formatFormType(
  value: FormType,
  copy: ReturnType<typeof getCopy>,
) {
  if (value === "country") return copy.countryForm;
  if (value === "dojo") return copy.dojoForm;
  return copy.kenshiForm;
}

function formatStatus(
  value: SubmissionStatus,
  copy: ReturnType<typeof getCopy>,
) {
  if (value === "pending") return copy.pendingShort;
  if (value === "needs_info") return copy.needsInfoShort;
  if (value === "approved") return copy.approvedShort;
  return copy.rejectedShort;
}

function describeFormScope(
  form: Payload["forms"][number],
  copy: ReturnType<typeof getCopy>,
  countryName: string,
  dojoName: string,
) {
  if (form.form_type === "country") {
    return copy.formScopeGlobal;
  }
  if (form.form_type === "dojo") {
    return countryName
      ? copy.formScopeCountry.replace("{country}", countryName)
      : copy.formScopeCountryEmpty;
  }
  return dojoName
    ? copy.formScopeDojo.replace("{dojo}", dojoName)
    : copy.formScopeDojoEmpty;
}

function getCopy(locale: Locale) {
  const es = locale === "es";
  return {
    kicker: es ? "Solicitudes internas" : "Internal requests",
    title: es ? "Formularios de alta por ambito" : "Scoped registration forms",
    description: es
      ? "Genera enlaces reutilizables para paises, dojos o Kenshis. Cada solicitud quedara pendiente hasta ser aprobada por el nivel correspondiente."
      : "Generate reusable links for countries, dojos, or Kenshi. Every submission stays pending until approved by the appropriate level.",
    formType: es ? "Tipo de formulario" : "Form type",
    countryForm: es ? "Alta de pais" : "Country request",
    dojoForm: es ? "Alta de dojo" : "Dojo request",
    kenshiForm: es ? "Alta de Kenshi" : "Kenshi request",
    formTitle: es ? "Titulo visible" : "Visible title",
    formTitlePlaceholder: es
      ? "Por ejemplo: Alta interna Kenshi SKBC Gipuzkoa"
      : "For example: Internal Kenshi registration SKBC Gipuzkoa",
    country: es ? "Pais" : "Country",
    dojo: es ? "Dojo" : "Dojo",
    select: es ? "Selecciona una opcion" : "Select one option",
    create: es ? "Crear formulario" : "Create form",
    created: es ? "Formulario creado. Enlace: {url}" : "Form created. Link: {url}",
    activeForms: es ? "Formularios activos" : "Active forms",
    formScopeGlobal: es
      ? "Disponible para altas de pais."
      : "Available for country registrations.",
    formScopeCountry: es
      ? "Vinculado al pais: {country}"
      : "Linked to country: {country}",
    formScopeCountryEmpty: es
      ? "Vinculado a un pais dentro de tu ambito."
      : "Linked to a country inside your scope.",
    formScopeDojo: es
      ? "Vinculado al dojo: {dojo}"
      : "Linked to dojo: {dojo}",
    formScopeDojoEmpty: es
      ? "Vinculado a un dojo dentro de tu ambito."
      : "Linked to a dojo inside your scope.",
    totalForms: es ? "Formularios" : "Forms",
    copy: es ? "Copiar enlace" : "Copy link",
    activate: es ? "Activar enlace" : "Activate link",
    deactivate: es ? "Desactivar enlace" : "Deactivate link",
    delete: es ? "Eliminar enlace" : "Delete link",
    activeStatus: es ? "Activo" : "Active",
    inactiveStatus: es ? "Inactivo" : "Inactive",
    createdOn: es ? "Creado:" : "Created:",
    noForms: es ? "Aun no hay formularios creados." : "No forms created yet.",
    pendingRequests: es ? "Solicitudes recibidas" : "Incoming requests",
    allStatuses: es ? "Todos los estados" : "All statuses",
    approve: es ? "Aprobar" : "Approve",
    askInfo: es ? "Pedir mas informacion" : "Ask for more info",
    reject: es ? "Rechazar" : "Reject",
    pendingShort: es ? "Pendientes" : "Pending",
    needsInfoShort: es ? "Ampliar info" : "Needs info",
    approvedShort: es ? "Aprobadas" : "Approved",
    rejectedShort: es ? "Rechazadas" : "Rejected",
    requestedOn: es ? "Solicitada:" : "Requested:",
    noRequests: es ? "No hay solicitudes pendientes." : "No pending requests.",
    noName: es ? "Solicitud sin nombre visible" : "Unnamed request",
    linkCopied: es ? "Enlace copiado." : "Link copied.",
    deleted: es ? "Formulario eliminado." : "Form deleted.",
    activated: es ? "Formulario activado." : "Form activated.",
    deactivated: es ? "Formulario desactivado." : "Form deactivated.",
    approved: es ? "Solicitud aprobada." : "Request approved.",
    rejected: es ? "Solicitud rechazada." : "Request rejected.",
    needsInfo: es
      ? "Solicitud marcada para ampliar informacion."
      : "Request marked for more information.",
    loadError: es ? "No se pudieron cargar los formularios." : "Unable to load forms.",
    createError: es ? "No se pudo crear el formulario." : "Unable to create the form.",
    deleteError: es ? "No se pudo eliminar el formulario." : "Unable to delete the form.",
    toggleError: es
      ? "No se pudo cambiar el estado del formulario."
      : "Unable to change the form status.",
    actionError: es
      ? "No se pudo actualizar la solicitud."
      : "Unable to update the request.",
    loading: es ? "Cargando..." : "Loading...",
    deleteConfirm: es
      ? 'Se eliminara el formulario "{title}" y todas sus solicitudes pendientes. Continuar?'
      : 'This will delete the "{title}" form and all pending submissions. Continue?',
  };
}
