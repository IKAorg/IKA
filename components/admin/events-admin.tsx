"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, LogOut, Save, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import {
  defaultLocale,
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n/config";

type EventStatus = "draft" | "published" | "archived";

type AdminEventTranslation = {
  id?: string;
  language_code: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  location_label: string | null;
};

type AdminEvent = {
  id: string;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  event_translations: AdminEventTranslation[];
};

type EventForm = {
  id?: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  location: string;
};

function createEmptyForm(locale: Locale): EventForm {
  return {
    status: "draft",
    startsAt: "",
    endsAt: "",
    locale,
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    location: "",
  };
}

export function EventsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [form, setForm] = useState<EventForm>(() =>
    createEmptyForm(initialLocale),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,status,starts_at,ends_at,event_translations(id,language_code,title,slug,excerpt,body,location_label)",
      )
      .order("starts_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setEvents([]);
    } else {
      setEvents((data ?? []) as AdminEvent[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        void loadEvents();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadEvents();
      } else {
        setEvents([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadEvents, supabase]);

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
                : `${window.location.origin}/${form.locale}/admin`,
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else if (!password) {
      setMessage("Revisa tu email para entrar al admin.");
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setEvents([]);
  }

  function editEvent(event: AdminEvent, locale = form.locale) {
    setForm(hydrateEventForm(form, event, locale));
  }

  function changeFormLocale(locale: Locale) {
    setForm((current) => {
      const event = current.id
        ? events.find((item) => item.id === current.id)
        : undefined;

      return event
        ? hydrateEventForm(current, event, locale)
        : { ...current, locale };
    });
  }

  async function saveEvent() {
    setSaving(true);
    setMessage("");

    const eventPayload = {
      status: form.status,
      starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    const eventResult = form.id
      ? await supabase
          .from("events")
          .update(eventPayload)
          .eq("id", form.id)
          .select("id")
          .single()
      : await supabase
          .from("events")
          .insert(eventPayload)
          .select("id")
          .single();

    if (eventResult.error || !eventResult.data) {
      setMessage(eventResult.error?.message ?? "No se pudo guardar el evento.");
      setSaving(false);
      return;
    }

    const eventId = eventResult.data.id as string;
    const { error } = await supabase.from("event_translations").upsert(
      {
        event_id: eventId,
        language_code: form.locale,
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        body: form.body || null,
        location_label: form.location || null,
      },
      { onConflict: "event_id,language_code" },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setForm(createEmptyForm(form.locale));
    setMessage("Evento guardado.");
    await loadEvents();
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (form.id === id) {
      setForm(createEmptyForm(form.locale));
    }

    setMessage("Evento eliminado.");
    await loadEvents();
  }

  if (!session) {
    return (
      <div className="mt-10 grid gap-6 border border-[var(--line)] bg-white p-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold">Acceso admin</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Entra con un usuario de Supabase que tenga rol de administracion.
            Si dejas la contrasena vacia, Supabase enviara un enlace magico.
          </p>
        </div>
        <div className="grid gap-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            disabled={loading || !email}
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
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              CMS
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Eventos</h2>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>

        <div className="mt-4">
          <LocaleSelect
            label="Idioma de trabajo"
            value={form.locale}
            onChange={changeFormLocale}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Cargando eventos...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No hay eventos visibles para tu usuario.
            </p>
          ) : (
            events.map((event) => {
              const translation = getEventTranslation(
                event.event_translations,
                form.locale,
              );

              return (
                <article
                  key={event.id}
                  className="border border-[var(--line)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {event.status}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {translation?.title ?? "Evento sin titulo"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {formatDate(event.starts_at, form.locale)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editEvent(event)}
                        className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                      >
                        <Trash2 size={15} />
                        Borrar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <CalendarPlus size={22} className="text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">
            {form.id ? "Editar evento" : "Nuevo evento"}
          </h2>
        </div>

        <div className="mt-5 grid gap-4">
          <LocaleSelect
            label="Idioma editado"
            value={form.locale}
            onChange={changeFormLocale}
          />

          <label className="grid gap-2 text-sm font-semibold">
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as EventStatus,
                }))
              }
              className="border border-[var(--line)] px-3 py-2"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Inicio"
              type="datetime-local"
              value={form.startsAt}
              onChange={(value) =>
                setForm((current) => ({ ...current, startsAt: value }))
              }
            />
            <TextInput
              label="Fin"
              type="datetime-local"
              value={form.endsAt}
              onChange={(value) =>
                setForm((current) => ({ ...current, endsAt: value }))
              }
            />
          </div>

          <TextInput
            label="Titulo"
            value={form.title}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                title: value,
                slug: current.slug || slugify(value),
              }))
            }
          />
          <TextInput
            label="Slug"
            value={form.slug}
            onChange={(value) =>
              setForm((current) => ({ ...current, slug: slugify(value) }))
            }
          />
          <TextInput
            label="Lugar"
            value={form.location}
            onChange={(value) =>
              setForm((current) => ({ ...current, location: value }))
            }
          />
          <TextArea
            label="Resumen"
            value={form.excerpt}
            onChange={(value) =>
              setForm((current) => ({ ...current, excerpt: value }))
            }
          />
          <TextArea
            label="Cuerpo"
            value={form.body}
            onChange={(value) =>
              setForm((current) => ({ ...current, body: value }))
            }
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveEvent}
              disabled={saving || !form.startsAt || !form.title}
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar evento
            </button>
            <button
              onClick={() => setForm(createEmptyForm(form.locale))}
              className="border border-[var(--line)] px-4 py-2 font-semibold"
            >
              Limpiar
            </button>
          </div>

          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">
              {message}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LocaleSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Locale;
  onChange: (value: Locale) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
          </option>
        ))}
      </select>
    </label>
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

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
      />
    </label>
  );
}

function hydrateEventForm(
  current: EventForm,
  event: AdminEvent,
  locale: Locale,
): EventForm {
  const translation = event.event_translations.find(
    (item) => item.language_code === locale,
  );

  return {
    ...current,
    id: event.id,
    status: event.status,
    startsAt: toDateTimeInput(event.starts_at),
    endsAt: toDateTimeInput(event.ends_at),
    locale,
    title: translation?.title ?? "",
    slug: translation?.slug ?? "",
    excerpt: translation?.excerpt ?? "",
    body: translation?.body ?? "",
    location: translation?.location_label ?? "",
  };
}

function getEventTranslation(
  translations: AdminEventTranslation[],
  locale: Locale,
) {
  return (
    translations.find((translation) => translation.language_code === locale) ??
    translations[0]
  );
}

function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
