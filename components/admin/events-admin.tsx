"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  LogOut,
  Mail,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { optimizeImageForUpload } from "@/lib/media/optimize-image";
import { createClient } from "@/lib/supabase/browser";
import { getAdminSessionBridgeHeaders } from "@/lib/supabase/admin-session-bridge";
import {
  defaultLocale,
  localeLabels,
  locales,
  type Locale,
} from "@/lib/i18n/config";

type EventStatus = "draft" | "published" | "archived";
type EventType =
  | "event"
  | "seminar"
  | "course"
  | "taikai"
  | "grading"
  | "meeting"
  | "encounter"
  | "busen";

type AdminEventTranslation = {
  id?: string;
  language_code: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  location_label: string | null;
};

type AdminEventRegistration = {
  id: string;
  status: string;
  payment_status?: "pending" | "paid" | "waived";
  checked_in_at?: string | null;
  admin_notes?: string | null;
  wants_tshirt?: boolean;
  tshirt_size?: string | null;
  created_at: string;
  members: {
    id: string;
    ika_number: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    current_grade: string | null;
    country_id?: string | null;
    dojo_id?: string | null;
    countries?: {
      code?: string | null;
      country_translations?: Array<{ language_code: string; name: string }>;
    } | null;
    dojos?: {
      id?: string | null;
      city?: string | null;
      dojo_translations?: Array<{ language_code: string; name: string }>;
    } | null;
  } | null;
  event_registration_checkins?: Array<{
    day_number: number;
    checked_in_at: string;
  }>;
};

type AdminEvent = {
  id: string;
  status: EventStatus;
  event_type: EventType;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  taikai_config?: {
    modalities?: string[];
    categories?: string[];
    results?: string[];
    awards?: string[];
  } | null;
  is_official_ika: boolean;
  allow_member_registration: boolean;
  registration_open: boolean;
  tshirt_enabled: boolean;
  duration_days: number;
  starts_at: string | null;
  ends_at: string | null;
  country_id: string | null;
  dojo_id: string | null;
  countries?:
    | {
        code: string | null;
        country_translations?: Array<{ language_code: string; name: string }>;
      }
    | null;
  dojos?:
    | {
        city: string | null;
        dojo_translations?: Array<{ language_code: string; name: string }>;
      }
    | null;
  event_translations: AdminEventTranslation[];
  event_registrations?: AdminEventRegistration[];
};

type LocationRow = {
  id: string;
  country_id?: string;
  code?: string;
  name: string;
};

type EventAdminScope = {
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

type EventForm = {
  id?: string;
  status: EventStatus;
  type: EventType;
  isOfficialIka: boolean;
  allowMemberRegistration: boolean;
  registrationOpen: boolean;
  tshirtEnabled: boolean;
  durationDays: string;
  countryId: string;
  dojoId: string;
  startsAt: string;
  endsAt: string;
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  location: string;
  coverImageUrl: string;
  coverImageAlt: string;
  taikaiModalities: string;
  taikaiCategories: string;
  taikaiResults: string;
  taikaiAwards: string;
};

function createEmptyForm(locale: Locale): EventForm {
  return {
    status: "published",
    type: "event",
    isOfficialIka: false,
    allowMemberRegistration: true,
    registrationOpen: true,
    tshirtEnabled: false,
    durationDays: "1",
    countryId: "",
    dojoId: "",
    startsAt: "",
    endsAt: "",
    locale,
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    location: "",
    coverImageUrl: "",
    coverImageAlt: "",
    taikaiModalities: "",
    taikaiCategories: "",
    taikaiResults: "",
    taikaiAwards: "",
  };
}

export function EventsAdmin({
  initialLocale = defaultLocale,
}: {
  initialLocale?: Locale;
}) {
  const copy = eventsAdminCopy(initialLocale);
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [countries, setCountries] = useState<LocationRow[]>([]);
  const [dojos, setDojos] = useState<LocationRow[]>([]);
  const [scope, setScope] = useState<EventAdminScope | null>(null);
  const [form, setForm] = useState<EventForm>(() => createEmptyForm(initialLocale));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [registrationsCountryFilter, setRegistrationsCountryFilter] = useState("");
  const [registrationsDojoFilter, setRegistrationsDojoFilter] = useState("");
  const [registrationsQuery, setRegistrationsQuery] = useState("");
  const sessionUserIdRef = useRef("");
  const loadEventsInFlightRef = useRef(false);
  const loadLocationsInFlightRef = useRef(false);

  const availableDojos = useMemo(
    () =>
      form.countryId
        ? dojos.filter((dojo) => dojo.country_id === form.countryId)
        : dojos,
    [dojos, form.countryId],
  );

  const loadEvents = useCallback(async () => {
    if (loadEventsInFlightRef.current) {
      return;
    }

    loadEventsInFlightRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,status,event_type,cover_image_url,cover_image_alt,taikai_config,is_official_ika,allow_member_registration,registration_open,tshirt_enabled,duration_days,starts_at,ends_at,country_id,dojo_id,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name)),event_translations(id,language_code,title,slug,excerpt,body,location_label),event_registrations(id,status,payment_status,checked_in_at,admin_notes,wants_tshirt,tshirt_size,created_at,members(id,ika_number,first_name,last_name,email,current_grade,country_id,dojo_id,countries(code,country_translations(language_code,name)),dojos(id,city,dojo_translations(language_code,name))),event_registration_checkins(day_number,checked_in_at))",
        )
        .order("starts_at", { ascending: true });

      if (error) {
        setMessage(error.message);
        setEvents([]);
      } else {
        const normalizedEvents = ((data ?? []) as Array<Record<string, unknown>>).map(
          (row) => ({
            ...row,
            countries: Array.isArray(row.countries) ? row.countries[0] ?? null : row.countries ?? null,
            dojos: Array.isArray(row.dojos) ? row.dojos[0] ?? null : row.dojos ?? null,
          }),
        );
        setEvents(normalizedEvents as unknown as AdminEvent[]);
      }
    } finally {
      loadEventsInFlightRef.current = false;
      setLoading(false);
    }
  }, [supabase]);

  const loadLocations = useCallback(async (token?: string | null) => {
    if (loadLocationsInFlightRef.current) {
      return;
    }

    loadLocationsInFlightRef.current = true;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : getAdminSessionBridgeHeaders();
    try {
      const response = await fetch("/api/admin/locations", {
        cache: "no-store",
        headers,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        countries?: Array<{
          id: string;
          code: string;
          country_translations?: Array<{ language_code: string; name: string }>;
          name?: string;
        }>;
        dojos?: Array<{
          id: string;
          country_id: string;
          dojo_translations?: Array<{ language_code: string; name: string }>;
          city?: string;
          name?: string;
        }>;
        scope?: EventAdminScope;
        error?: string;
      };

      if (payload.error) {
        setMessage(payload.error);
        return;
      }

      setScope(payload.scope ?? null);

      setCountries(
        (payload.countries ?? []).map((country) => ({
          id: country.id,
          code: country.code,
          name:
            country.name ??
            country.country_translations?.find(
              (translation) => translation.language_code === form.locale,
            )?.name ??
            country.country_translations?.[0]?.name ??
            country.code,
        })),
      );
      setDojos(
        (payload.dojos ?? []).map((dojo) => ({
          id: dojo.id,
          country_id: dojo.country_id,
          name:
            dojo.name ??
            dojo.dojo_translations?.find(
              (translation) => translation.language_code === form.locale,
            )?.name ??
            dojo.dojo_translations?.[0]?.name ??
            dojo.city ??
            dojo.id,
        })),
      );
    } finally {
      loadLocationsInFlightRef.current = false;
    }
  }, [form.locale]);

  const isEventManageable = useCallback(
    (event: AdminEvent) => {
      if (!scope || scope.isGlobal) {
        return true;
      }

      if (event.country_id && scope.countryIds.includes(event.country_id)) {
        return true;
      }

      if (event.dojo_id) {
        if (scope.dojoIds.includes(event.dojo_id)) {
          return true;
        }

        const dojo = dojos.find((item) => item.id === event.dojo_id);
        if (dojo?.country_id && scope.countryIds.includes(dojo.country_id)) {
          return true;
        }
      }

      return false;
    },
    [dojos, scope],
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => isEventManageable(event)),
    [events, isEventManageable],
  );

  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === form.id),
    [visibleEvents, form.id],
  );
  const selectedEventCountryOptions = useMemo(() => {
    return (selectedEvent?.event_registrations ?? [])
      .reduce<Array<{ value: string; label: string }>>((acc, registration) => {
        const countryId = registration.members?.country_id?.trim();
        if (!countryId || acc.some((item) => item.value === countryId)) {
          return acc;
        }

        const label =
          registration.members?.countries?.country_translations?.find((item) => item.language_code === form.locale)?.name ??
          registration.members?.countries?.country_translations?.[0]?.name ??
          registration.members?.countries?.code ??
          copy.unknownCountry;
        acc.push({ value: countryId, label });
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label, form.locale));
  }, [copy.unknownCountry, form.locale, selectedEvent]);
  const selectedEventDojoOptions = useMemo(() => {
    return (selectedEvent?.event_registrations ?? [])
      .reduce<Array<{ value: string; label: string }>>((acc, registration) => {
        const dojoId = registration.members?.dojo_id?.trim();
        const countryId = registration.members?.country_id?.trim();
        if (!dojoId || acc.some((item) => item.value === dojoId)) {
          return acc;
        }
        if (registrationsCountryFilter && countryId !== registrationsCountryFilter) {
          return acc;
        }

        const label =
          registration.members?.dojos?.dojo_translations?.find((item) => item.language_code === form.locale)?.name ??
          registration.members?.dojos?.dojo_translations?.[0]?.name ??
          registration.members?.dojos?.city ??
          copy.unknownDojo;
        acc.push({ value: dojoId, label });
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label, form.locale));
  }, [copy.unknownDojo, form.locale, registrationsCountryFilter, selectedEvent]);
  const selectedEventScopedRegistrations = useMemo(() => {
    const normalizedQuery = registrationsQuery.trim().toLowerCase();
    return (selectedEvent?.event_registrations ?? []).filter((registration) => {
      const countryId = registration.members?.country_id?.trim() ?? "";
      const dojoId = registration.members?.dojo_id?.trim() ?? "";

      if (registrationsCountryFilter && countryId !== registrationsCountryFilter) {
        return false;
      }
      if (registrationsDojoFilter && dojoId !== registrationsDojoFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        registration.members?.first_name ?? "",
        registration.members?.last_name ?? "",
        registration.members?.email ?? "",
        registration.members?.ika_number ?? "",
        registration.members?.current_grade ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [registrationsCountryFilter, registrationsDojoFilter, registrationsQuery, selectedEvent]);
  const selectedEventCountryBreakdown = useMemo(() => {
    return Object.values(
      selectedEventScopedRegistrations
        .filter((registration) => registration.status === "registered")
        .reduce<Record<string, { label: string; count: number }>>((acc, registration) => {
          const countryId = registration.members?.country_id?.trim() || "__unknown__";
          const label =
            registration.members?.countries?.country_translations?.find((item) => item.language_code === form.locale)?.name ??
            registration.members?.countries?.country_translations?.[0]?.name ??
            registration.members?.countries?.code ??
            copy.unknownCountry;
          acc[countryId] = {
            label,
            count: (acc[countryId]?.count ?? 0) + 1,
          };
          return acc;
        }, {}),
    ).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label, form.locale);
    });
  }, [copy.unknownCountry, form.locale, selectedEventScopedRegistrations]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      sessionUserIdRef.current = data.session?.user?.id ?? "";
      setLoading(false);
      if (data.session) {
        void Promise.all([
          loadEvents(),
          loadLocations(data.session.access_token),
        ]);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

      const nextUserId = nextSession?.user?.id ?? "";
      const sameUserSession =
        Boolean(nextUserId) && nextUserId === sessionUserIdRef.current;
      sessionUserIdRef.current = nextUserId;

      setSession(nextSession);
      if (sameUserSession) {
        return;
      }
      if (nextSession) {
        void Promise.all([
          loadEvents(),
          loadLocations(nextSession.access_token),
        ]);
      } else {
        setEvents([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadEvents, loadLocations, supabase]);

  useEffect(() => {
    if (!form.countryId && countries.length === 1) {
      setForm((current) => ({ ...current, countryId: countries[0].id }));
    }
  }, [countries, form.countryId]);

  useEffect(() => {
    if (form.id && !visibleEvents.some((event) => event.id === form.id)) {
      setForm((current) => createEmptyForm(current.locale));
    }
  }, [form.id, visibleEvents]);

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
      setMessage(copy.checkEmail);
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
      event_type: form.type,
      cover_image_url: form.coverImageUrl || null,
      cover_image_alt: form.coverImageAlt || null,
      taikai_config: {
        modalities: normalizeListString(form.taikaiModalities),
        categories: normalizeListString(form.taikaiCategories),
        results: normalizeListString(form.taikaiResults),
        awards: normalizeListString(form.taikaiAwards),
      },
      is_official_ika: form.isOfficialIka,
      allow_member_registration: form.allowMemberRegistration,
      registration_open: form.registrationOpen,
      tshirt_enabled: form.tshirtEnabled,
      duration_days: Math.max(1, Number.parseInt(form.durationDays || "1", 10) || 1),
      country_id: form.countryId || null,
      dojo_id: form.dojoId || null,
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
      : await supabase.from("events").insert(eventPayload).select("id").single();

    if (eventResult.error || !eventResult.data) {
      setMessage(eventResult.error?.message ?? copy.saveError);
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
    setMessage(copy.saved);
    await loadEvents();
    setSaving(false);
  }

  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(copy.selectImage);
      return;
    }

    setUploading(true);
    setMessage("");
    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.8,
      maxBytes: 550 * 1024,
      outputType: "image/webp",
      fileNameBase: file.name,
    });
    const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(file.lastModified);
    const safeName = slugify(optimizedFile.name.replace(/\.[^.]+$/, "")) || "event-cover";
    const storagePath = `events/${uniqueId}-${safeName}.${extension}`;

    const { error } = await supabase.storage.from("public-media").upload(storagePath, optimizedFile, {
      cacheControl: "31536000",
      contentType: optimizedFile.type,
      upsert: true,
    });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("public-media").getPublicUrl(storagePath);
    setForm((current) => ({ ...current, coverImageUrl: data.publicUrl }));
    setUploading(false);
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

    setMessage(copy.deleted);
    await loadEvents();
  }

  async function closeEvent(event: AdminEvent) {
    const confirmed = window.confirm(
      copy.closeEventConfirm.replace(
        "{title}",
        getEventTranslation(event.event_translations, form.locale)?.title ??
          copy.untitledEvent,
      ),
    );
    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({
        status: "archived",
        registration_open: false,
      })
      .eq("id", event.id);

    if (error) {
      setMessage(error.message || copy.closeEventError);
      return;
    }

    if (form.id === event.id) {
      setForm((current) => ({
        ...current,
        status: "archived",
        registrationOpen: false,
      }));
    }

    setMessage(copy.eventClosed);
    await loadEvents();
  }

  async function copyRegisteredEmails() {
    const emails = selectedEventScopedRegistrations
      .filter((item) => item.status === "registered")
      .map((item) => item.members?.email ?? "")
      .filter(Boolean)
      .join(", ");

    if (!emails) {
      setMessage(copy.noEmailsToCopy);
      return;
    }

    await navigator.clipboard.writeText(emails);
    setMessage(copy.emailsCopied);
  }

  async function exportRegistrationsCsv() {
    if (!selectedEvent) {
      return;
    }

    const rows = selectedEventScopedRegistrations
      .filter((item) => item.status === "registered")
      .map((item) => ({
        ika_number: item.members?.ika_number ?? "",
        first_name: item.members?.first_name ?? "",
        last_name: item.members?.last_name ?? "",
        email: item.members?.email ?? "",
        current_grade: item.members?.current_grade ?? "",
        registration_status: item.status ?? "",
        payment_status: item.payment_status ?? "pending",
        wants_tshirt: item.wants_tshirt ? "yes" : "no",
        tshirt_size: item.tshirt_size ?? "",
        checked_in_at: item.checked_in_at ?? "",
        registered_at: item.created_at ?? "",
        admin_notes: item.admin_notes ?? "",
      }));

    if (rows.length === 0) {
      setMessage(copy.noRegistrations);
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => escapeCsvValue(String(row[header as keyof typeof row] ?? "")))
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(
      getEventTranslation(selectedEvent.event_translations, form.locale)?.title ?? "event",
    )}-registrations.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage(copy.csvExported);
  }

  async function updateRegistration(
    registrationId: string,
    patch: Partial<
      Pick<
        AdminEventRegistration,
        "payment_status" | "checked_in_at" | "admin_notes" | "status" | "wants_tshirt" | "tshirt_size"
      >
    >,
  ) {
    const { error } = await supabase
      .from("event_registrations")
      .update(patch)
      .eq("id", registrationId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(copy.registrationUpdated);
    await loadEvents();
  }

  async function toggleCheckIn(
    registration: AdminEventRegistration,
    dayNumber: number,
  ) {
    const alreadyCheckedIn = Boolean(registration.event_registration_checkins?.some((item) => item.day_number === dayNumber));

    if (alreadyCheckedIn) {
      const { error } = await supabase
        .from("event_registration_checkins")
        .delete()
        .eq("registration_id", registration.id)
        .eq("day_number", dayNumber);

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("event_registration_checkins")
        .upsert(
          {
            registration_id: registration.id,
            day_number: dayNumber,
            checked_in_at: new Date().toISOString(),
          },
          { onConflict: "registration_id,day_number" },
        );

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setMessage(copy.registrationUpdated);
    await loadEvents();
  }

  async function updatePaymentStatus(
    registration: AdminEventRegistration,
    value: string,
  ) {
    await updateRegistration(registration.id, {
      payment_status: value as "pending" | "paid" | "waived",
    });
  }

  async function updateAdminNotes(
    registration: AdminEventRegistration,
    value: string,
  ) {
    await updateRegistration(registration.id, {
      admin_notes: value || null,
    });
  }

  async function toggleRegistrationStatus(registration: AdminEventRegistration) {
    await updateRegistration(registration.id, {
      status: registration.status === "registered" ? "cancelled" : "registered",
    });
  }

  async function updateTshirtChoice(
    registration: AdminEventRegistration,
    wantsTshirt: boolean,
  ) {
    await updateRegistration(registration.id, {
      wants_tshirt: wantsTshirt,
      tshirt_size: wantsTshirt ? registration.tshirt_size ?? null : null,
    });
  }

  async function updateTshirtSize(
    registration: AdminEventRegistration,
    tshirtSize: string,
  ) {
    await updateRegistration(registration.id, {
      wants_tshirt: Boolean(tshirtSize),
      tshirt_size: tshirtSize || null,
    });
  }

  function openTemplateEmail(
    type: "opening" | "schedule" | "reminder",
  ) {
    if (!selectedEvent) {
      return;
    }

    const recipients = (selectedEvent.event_registrations ?? [])
      .filter((item) => item.status === "registered")
      .map((item) => item.members?.email ?? "")
      .filter(Boolean)
      .join(",");

    if (!recipients) {
      setMessage(copy.noEmailsToCopy);
      return;
    }

    const title =
      getEventTranslation(selectedEvent.event_translations, form.locale)?.title ??
      copy.untitledEvent;
    const place = getDojoLabel(selectedEvent.dojos, form.locale) ??
      getCountryLabel(selectedEvent.countries, form.locale) ??
      "";
    const dateText = formatDate(selectedEvent.starts_at, form.locale);
    const subjects = {
      opening:
        form.locale === "es"
          ? `Inscripcion abierta · ${title}`
          : `Registration open · ${title}`,
      schedule:
        form.locale === "es"
          ? `Cambio de horario · ${title}`
          : `Schedule change · ${title}`,
      reminder:
        form.locale === "es"
          ? `Recordatorio · ${title}`
          : `Reminder · ${title}`,
    };
    const bodies = {
      opening:
        form.locale === "es"
          ? `Hola,\n\nLa inscripcion para ${title} ya esta abierta.\n\nFecha: ${dateText}\nLugar: ${place}\n\nUn saludo,\nIKA`
          : `Hello,\n\nRegistration for ${title} is now open.\n\nDate: ${dateText}\nPlace: ${place}\n\nBest regards,\nIKA`,
      schedule:
        form.locale === "es"
          ? `Hola,\n\nTe avisamos de un cambio de horario para ${title}.\n\nNueva referencia: ${dateText}\nLugar: ${place}\n\nPor favor revisa la informacion del evento.\n\nUn saludo,\nIKA`
          : `Hello,\n\nWe are informing you about a schedule change for ${title}.\n\nUpdated schedule: ${dateText}\nPlace: ${place}\n\nPlease review the event information.\n\nBest regards,\nIKA`,
      reminder:
        form.locale === "es"
          ? `Hola,\n\nTe recordamos que ${title} se celebrara en 7 dias.\n\nFecha: ${dateText}\nLugar: ${place}\n\nNos vemos pronto.\n\nUn saludo,\nIKA`
          : `Hello,\n\nThis is a reminder that ${title} will take place in 7 days.\n\nDate: ${dateText}\nPlace: ${place}\n\nSee you soon.\n\nBest regards,\nIKA`,
    };

    window.location.href = `mailto:?bcc=${encodeURIComponent(recipients)}&subject=${encodeURIComponent(
      subjects[type],
    )}&body=${encodeURIComponent(bodies[type])}`;
  }

  if (!session) {
    return (
      <div className="mt-8 grid gap-6 border border-[var(--line)] bg-white p-4 sm:mt-10 sm:p-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-semibold">{copy.adminAccess}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {copy.loginHelp}
          </p>
        </div>
        <div className="grid gap-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.email}
            type="email"
            className="border border-[var(--line)] px-3 py-2"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.optionalPassword}
            type="password"
            className="border border-[var(--line)] px-3 py-2"
          />
          <button
            onClick={signIn}
            disabled={loading || !email}
            className="inline-flex items-center justify-center gap-2 bg-[var(--ink-blue)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {copy.enter}
          </button>
          {message ? (
            <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              CMS
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{copy.events}</h2>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
          >
            <LogOut size={16} />
            {copy.signOut}
          </button>
        </div>

        <div className="mt-4">
          <LocaleSelect label={copy.workLanguage} value={form.locale} onChange={changeFormLocale} />
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <p className="text-sm text-[var(--muted)]">{copy.loadingEvents}</p>
          ) : visibleEvents.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.noEvents}</p>
          ) : (
            visibleEvents.map((event) => {
              const translation = getEventTranslation(event.event_translations, form.locale);
              const registrations =
                event.event_registrations?.filter((item) => item.status === "registered")
                  .length ?? 0;

              return (
                <article key={event.id} className="border border-[var(--line)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {copy.typeLabels[event.event_type]} - {event.status}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {translation?.title ?? copy.untitledEvent}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {formatDate(event.starts_at, form.locale)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {getDojoLabel(event.dojos, form.locale) ??
                          getCountryLabel(event.countries, form.locale) ??
                          copy.unscopedEvent}
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {registrations} {copy.registeredMembers}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/${form.locale}/admin/events/${event.id}`}
                        className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        {copy.viewRegistrations} ({registrations})
                      </Link>
                      {event.status !== "archived" ? (
                        <button
                          onClick={() => closeEvent(event)}
                          className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                        >
                          {copy.closeEvent}
                        </button>
                      ) : null}
                      <button
                        onClick={() => editEvent(event)}
                        className="border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        {copy.edit}
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                      >
                        <Trash2 size={15} />
                        {copy.delete}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="border border-[var(--line)] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <CalendarPlus size={22} className="text-[var(--accent)]" />
            <h2 className="text-2xl font-semibold">
              {form.id ? copy.editEvent : copy.newEvent}
            </h2>
          </div>

          <div className="mt-5 grid gap-4">
            <LocaleSelect
              label={copy.editedLanguage}
              value={form.locale}
              onChange={changeFormLocale}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={copy.eventType}
                value={form.type}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    type: value as EventType,
                    taikaiModalities:
                      value === "taikai" && !current.taikaiModalities
                        ? getDefaultTaikaiModalities(current.locale).join("\n")
                        : current.taikaiModalities,
                    taikaiCategories:
                      value === "taikai" && !current.taikaiCategories
                        ? getDefaultTaikaiCategories(current.locale).join("\n")
                        : current.taikaiCategories,
                    taikaiResults:
                      value === "taikai" && !current.taikaiResults
                        ? getDefaultTaikaiResults(current.locale).join("\n")
                        : current.taikaiResults,
                    taikaiAwards:
                      value === "taikai" && !current.taikaiAwards
                        ? getDefaultTaikaiAwards(current.locale).join("\n")
                        : current.taikaiAwards,
                  }))
                }
                options={Object.entries(copy.typeLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <SelectField
                label={copy.status}
                value={form.status}
                onChange={(value) =>
                  setForm((current) => ({ ...current, status: value as EventStatus }))
                }
                options={[
                  { value: "draft", label: copy.draft },
                  { value: "published", label: copy.published },
                  { value: "archived", label: copy.archived },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={copy.countryScope}
                value={form.countryId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, countryId: value, dojoId: "" }))
                }
                options={[
                  { value: "", label: copy.selectCountry },
                  ...countries.map((country) => ({
                    value: country.id,
                    label: country.name,
                  })),
                ]}
              />
              <SelectField
                label={copy.dojoScope}
                value={form.dojoId}
                onChange={(value) => setForm((current) => ({ ...current, dojoId: value }))}
                options={[
                  { value: "", label: copy.selectDojo },
                  ...availableDojos.map((dojo) => ({
                    value: dojo.id,
                    label: dojo.name,
                  })),
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ToggleField
                label={copy.officialIka}
                checked={form.isOfficialIka}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, isOfficialIka: checked }))
                }
                trueLabel={copy.yes}
                falseLabel={copy.no}
              />
              <ToggleField
                label={copy.allowRegistration}
                checked={form.allowMemberRegistration}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, allowMemberRegistration: checked }))
                }
                trueLabel={copy.yes}
                falseLabel={copy.no}
              />
              <ToggleField
                label={copy.registrationOpen}
                checked={form.registrationOpen}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, registrationOpen: checked }))
                }
                trueLabel={copy.yes}
                falseLabel={copy.no}
              />
              <ToggleField
                label={copy.tshirtEnabled}
                checked={form.tshirtEnabled}
                onChange={(checked) =>
                  setForm((current) => ({ ...current, tshirtEnabled: checked }))
                }
                trueLabel={copy.yes}
                falseLabel={copy.no}
              />
            </div>

            {form.tshirtEnabled ? (
              <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
                <p className="text-sm font-semibold">{copy.availableTshirtSizes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TSHIRT_SIZES.map((size) => (
                    <span
                      key={`event-size-${size}`}
                      className="border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <TextInput
                label={copy.durationDays}
                type="number"
                value={form.durationDays}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    durationDays: String(Math.min(30, Math.max(1, Number.parseInt(value || "1", 10) || 1))),
                  }))
                }
              />
              <TextInput
                label={copy.start}
                type="datetime-local"
                value={form.startsAt}
                onChange={(value) =>
                  setForm((current) => ({ ...current, startsAt: value }))
                }
              />
              <TextInput
                label={copy.end}
                type="datetime-local"
                value={form.endsAt}
                onChange={(value) =>
                  setForm((current) => ({ ...current, endsAt: value }))
                }
              />
            </div>

            <TextInput
              label={copy.title}
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
              label={copy.slug}
              value={form.slug}
              onChange={(value) =>
                setForm((current) => ({ ...current, slug: slugify(value) }))
              }
            />
            <TextInput
              label={copy.place}
              value={form.location}
              onChange={(value) =>
                setForm((current) => ({ ...current, location: value }))
              }
            />
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-2 text-sm font-semibold">
                <span>{copy.eventImage}</span>
                <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
                  {form.coverImageUrl ? (
                    <div className="relative mb-3 min-h-[220px] overflow-hidden border border-[var(--line)] bg-white">
                      <Image
                        src={form.coverImageUrl}
                        alt={form.coverImageAlt || form.title || copy.eventImage}
                        fill
                        sizes="(min-width: 1024px) 420px, 100vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-28 items-center justify-center border border-dashed border-[var(--line)] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {copy.noImage}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 bg-[var(--ink-blue)] px-3 py-2 text-sm font-semibold text-white">
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                      {form.coverImageUrl ? copy.changeImage : copy.uploadImage}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) {
                            void uploadCover(file);
                          }
                        }}
                      />
                    </label>
                    {form.coverImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, coverImageUrl: "", coverImageAlt: "" }))}
                        className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                      >
                        <X size={16} />
                        {copy.removeImage}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <TextInput
                label={copy.imageAlt}
                value={form.coverImageAlt}
                onChange={(value) => setForm((current) => ({ ...current, coverImageAlt: value }))}
              />
            </div>
            <TextArea
              label={copy.summary}
              value={form.excerpt}
              onChange={(value) =>
                setForm((current) => ({ ...current, excerpt: value }))
              }
            />
            <TextArea
              label={copy.body}
              value={form.body}
              onChange={(value) =>
                setForm((current) => ({ ...current, body: value }))
              }
            />

            {form.type === "taikai" ? (
              <div className="grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4">
                <div>
                  <p className="text-sm font-semibold">{copy.taikaiConfigTitle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{copy.taikaiConfigIntro}</p>
                </div>
                <TextArea
                  label={copy.taikaiModalities}
                  value={form.taikaiModalities}
                  onChange={(value) => setForm((current) => ({ ...current, taikaiModalities: value }))}
                />
                <TextArea
                  label={copy.taikaiCategories}
                  value={form.taikaiCategories}
                  onChange={(value) => setForm((current) => ({ ...current, taikaiCategories: value }))}
                />
                <TextArea
                  label={copy.taikaiResults}
                  value={form.taikaiResults}
                  onChange={(value) => setForm((current) => ({ ...current, taikaiResults: value }))}
                />
                <TextArea
                  label={copy.taikaiAwards}
                  value={form.taikaiAwards}
                  onChange={(value) => setForm((current) => ({ ...current, taikaiAwards: value }))}
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveEvent}
                disabled={saving || !form.startsAt || !form.title || !form.countryId}
                className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {copy.saveEvent}
              </button>
              <button
                onClick={() => setForm(createEmptyForm(form.locale))}
                className="border border-[var(--line)] px-4 py-2 font-semibold"
              >
                {copy.clear}
              </button>
            </div>
          </div>
        </div>

        {selectedEvent ? (
          <div className="border border-[var(--line)] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {copy.registrations}
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {getEventTranslation(selectedEvent.event_translations, form.locale)?.title ??
                    copy.untitledEvent}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${form.locale}/admin/events/${selectedEvent.id}`}
                  className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                >
                  {copy.viewRegistrations} ({(selectedEvent.event_registrations ?? []).filter((item) => item.status === "registered").length})
                </Link>
                <button
                  type="button"
                  onClick={() => void copyRegisteredEmails()}
                  className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                >
                  <Copy size={15} />
                  {copy.copyEmails}
                </button>
                <a
                  href={`mailto:?bcc=${encodeURIComponent(
                    (selectedEvent.event_registrations ?? [])
                      .filter((item) => item.status === "registered")
                      .map((item) => item.members?.email ?? "")
                      .filter(Boolean)
                      .join(","),
                  )}`}
                  className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                >
                  <Mail size={15} />
                  {copy.emailNotice}
                </a>
                <button
                  type="button"
                  onClick={() => void exportRegistrationsCsv()}
                  className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                >
                  <Download size={15} />
                  {copy.exportCsv}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openTemplateEmail("opening")}
                className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
              >
                <Mail size={15} />
                {copy.noticeOpening}
              </button>
              <button
                type="button"
                onClick={() => openTemplateEmail("schedule")}
                className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
              >
                <Mail size={15} />
                {copy.noticeSchedule}
              </button>
              <button
                type="button"
                onClick={() => openTemplateEmail("reminder")}
                className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold"
              >
                <Mail size={15} />
                {copy.noticeReminder}
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 border border-[var(--line)] bg-[var(--paper)] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <label className="grid gap-2 text-sm font-semibold">
                  {copy.searchRegistration}
                  <input
                    value={registrationsQuery}
                    onChange={(event) => setRegistrationsQuery(event.target.value)}
                    placeholder={copy.searchRegistrationPlaceholder}
                    className="border border-[var(--line)] bg-white px-3 py-2 font-normal"
                  />
                </label>
                <SelectField
                  label={copy.filterCountry}
                  value={registrationsCountryFilter}
                  onChange={(value) => {
                    setRegistrationsCountryFilter(value);
                    setRegistrationsDojoFilter("");
                  }}
                  options={[
                    { value: "", label: copy.allCountries },
                    ...selectedEventCountryOptions,
                  ]}
                />
                <SelectField
                  label={copy.filterDojo}
                  value={registrationsDojoFilter}
                  onChange={setRegistrationsDojoFilter}
                  options={[
                    { value: "", label: copy.allDojos },
                    ...selectedEventDojoOptions,
                  ]}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="border border-[var(--line)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {copy.filteredRegistrations}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{copy.registrationRegistered}</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {selectedEventScopedRegistrations.filter((item) => item.status === "registered").length}
                      </p>
                    </div>
                    <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{copy.registrationCancelled}</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {selectedEventScopedRegistrations.filter((item) => item.status === "cancelled").length}
                      </p>
                    </div>
                    <div className="border border-[var(--line)] bg-[var(--paper)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{copy.checkInDone}</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {selectedEventScopedRegistrations.filter((item) => (item.event_registration_checkins ?? []).length > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border border-[var(--line)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    {copy.registrationsByCountry}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {selectedEventCountryBreakdown.length > 0 ? (
                      selectedEventCountryBreakdown.map((item) => (
                        <div
                          key={`${item.label}-${item.count}`}
                          className="flex items-center justify-between gap-3 border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
                        >
                          <span className="font-semibold">{item.label}</span>
                          <span className="text-sm font-semibold text-[var(--accent)]">
                            {copy.registrationsCount(item.count)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">{copy.noRegistrationsForFilters}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
              {selectedEventScopedRegistrations.map((registration) => (
                  <article
                    key={registration.id}
                    className="grid gap-3 border border-[var(--line)] p-3 sm:p-4 md:grid-cols-[1.1fr_0.8fr_0.8fr_1fr]"
                  >
                    <div>
                      <p className="font-semibold">
                        {registration.members
                          ? `${registration.members.first_name} ${registration.members.last_name}`
                          : copy.memberUnknown}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {registration.members?.email ?? copy.noEmail}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {registration.status === "registered"
                          ? copy.registrationRegistered
                          : copy.registrationCancelled}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p>{registration.members?.ika_number ?? "-"}</p>
                      <p className="text-[var(--muted)]">
                        {registration.members?.current_grade ?? "-"}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <SelectField
                        label={copy.paymentStatus}
                        value={registration.payment_status ?? "pending"}
                        onChange={(value) => void updatePaymentStatus(registration, value)}
                        options={[
                          { value: "pending", label: copy.paymentPending },
                          { value: "paid", label: copy.paymentPaid },
                          { value: "waived", label: copy.paymentWaived },
                        ]}
                      />
                      <div className="grid gap-2">
                        <p className="text-sm font-semibold">{copy.checkInByDay}</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: Math.max(1, selectedEvent.duration_days || 1) }, (_, index) => {
                            const dayNumber = index + 1;
                            const dayCheckin = registration.event_registration_checkins?.find(
                              (item) => item.day_number === dayNumber,
                            );

                            return (
                              <button
                                key={`${registration.id}-day-${dayNumber}`}
                                type="button"
                                onClick={() => void toggleCheckIn(registration, dayNumber)}
                                className={`inline-flex items-center justify-center gap-2 border px-3 py-2 font-semibold ${
                                  dayCheckin
                                    ? "border-green-700 bg-green-700 text-white"
                                    : "border-[var(--line)] bg-white text-[var(--text)]"
                                }`}
                              >
                                <CheckCircle2 size={15} />
                                {copy.dayLabel(dayNumber)}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          {(registration.event_registration_checkins ?? []).length > 0
                            ? copy.checkInSummary(
                                (registration.event_registration_checkins ?? []).length,
                                Math.max(1, selectedEvent.duration_days || 1),
                              )
                            : copy.notCheckedIn}
                        </p>
                      </div>
                      {selectedEvent.tshirt_enabled ? (
                        <>
                          <SelectField
                            label={copy.tshirtQuestion}
                            value={registration.wants_tshirt ? "yes" : "no"}
                            onChange={(value) =>
                              void updateTshirtChoice(registration, value === "yes")
                            }
                            options={[
                              { value: "no", label: copy.no },
                              { value: "yes", label: copy.yes },
                            ]}
                          />
                          <SelectField
                            label={copy.tshirtSize}
                            value={registration.tshirt_size ?? ""}
                            onChange={(value) => void updateTshirtSize(registration, value)}
                            options={[
                              { value: "", label: copy.selectSize },
                              ...TSHIRT_SIZES.map((size) => ({ value: size, label: size })),
                            ]}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      <label className="grid gap-2 text-sm font-semibold">
                        {copy.adminNotes}
                        <textarea
                          defaultValue={registration.admin_notes ?? ""}
                          onBlur={(event) =>
                            void updateAdminNotes(registration, event.target.value)
                          }
                          rows={3}
                          className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
                        />
                      </label>
                      <p className="text-xs text-[var(--muted)]">
                        {copy.registeredAt}: {formatDate(registration.created_at, form.locale)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void toggleRegistrationStatus(registration)}
                        className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 font-semibold"
                      >
                        <Trash2 size={15} />
                        {registration.status === "registered"
                          ? copy.cancelRegistration
                          : copy.restoreRegistration}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {(selectedEvent.event_registrations ?? []).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{copy.noRegistrations}</p>
              ) : null}
              {(selectedEvent.event_registrations ?? []).length > 0 &&
              selectedEventScopedRegistrations.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{copy.noRegistrationsForFilters}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="text-sm font-semibold text-[var(--accent)]">{message}</p>
        ) : null}
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  trueLabel,
  falseLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={checked ? "yes" : "no"}
        onChange={(event) => onChange(event.target.value === "yes")}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        <option value="yes">{trueLabel}</option>
        <option value="no">{falseLabel}</option>
      </select>
    </label>
  );
}

function hydrateEventForm(current: EventForm, event: AdminEvent, locale: Locale): EventForm {
  const translation = event.event_translations.find((item) => item.language_code === locale);
  const taikaiConfig = event.taikai_config ?? {};

  return {
    ...current,
    id: event.id,
    status: event.status,
    type: event.event_type ?? "event",
    isOfficialIka: Boolean(event.is_official_ika),
    allowMemberRegistration: Boolean(event.allow_member_registration),
    registrationOpen: Boolean(event.registration_open),
    tshirtEnabled: Boolean(event.tshirt_enabled),
    durationDays: String(Math.max(1, Number(event.duration_days ?? 1))),
    countryId: event.country_id ?? "",
    dojoId: event.dojo_id ?? "",
    startsAt: toDateTimeInput(event.starts_at),
    endsAt: toDateTimeInput(event.ends_at),
    locale,
    title: translation?.title ?? "",
    slug: translation?.slug ?? "",
    excerpt: translation?.excerpt ?? "",
    body: translation?.body ?? "",
    location: translation?.location_label ?? "",
    coverImageUrl: event.cover_image_url ?? "",
    coverImageAlt: event.cover_image_alt ?? "",
    taikaiModalities: (taikaiConfig.modalities ?? getDefaultTaikaiModalities(locale)).join("\n"),
    taikaiCategories: (taikaiConfig.categories ?? getDefaultTaikaiCategories(locale)).join("\n"),
    taikaiResults: (taikaiConfig.results ?? getDefaultTaikaiResults(locale)).join("\n"),
    taikaiAwards: (taikaiConfig.awards ?? getDefaultTaikaiAwards(locale)).join("\n"),
  };
}

function getEventTranslation(translations: AdminEventTranslation[], locale: Locale) {
  return translations.find((translation) => translation.language_code === locale) ?? translations[0];
}

function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return locale === "es" ? "Sin fecha" : "No date";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCountryLabel(
  country:
    | {
        code: string | null;
        country_translations?: Array<{ language_code: string; name: string }>;
      }
    | null
    | undefined,
  locale: Locale,
) {
  return (
    country?.country_translations?.find((item) => item.language_code === locale)?.name ??
    country?.country_translations?.[0]?.name ??
    country?.code ??
    ""
  );
}

function getDojoLabel(
  dojo:
    | {
        city: string | null;
        dojo_translations?: Array<{ language_code: string; name: string }>;
      }
    | null
    | undefined,
  locale: Locale,
) {
  return (
    dojo?.dojo_translations?.find((item) => item.language_code === locale)?.name ??
    dojo?.dojo_translations?.[0]?.name ??
    dojo?.city ??
    ""
  );
}

function eventsAdminCopy(locale: Locale) {
  const es = locale === "es";

  return {
    email: "Email",
    checkEmail: es ? "Revisa tu email para entrar al admin." : "Check your email to access admin.",
    saveError: es ? "No se pudo guardar el evento." : "The event could not be saved.",
    saved: es ? "Evento guardado." : "Event saved.",
    deleted: es ? "Evento eliminado." : "Event deleted.",
    adminAccess: es ? "Acceso admin" : "Admin access",
    loginHelp: es
      ? "Accede con un usuario administrador. Los admin de pais pueden crear y gestionar eventos de su pais."
      : "Sign in with an administrator user. Country admins can create and manage events for their own country.",
    optionalPassword: es ? "Contrasena opcional" : "Optional password",
    enter: es ? "Entrar" : "Enter",
    events: es ? "Eventos" : "Events",
    signOut: es ? "Salir" : "Sign out",
    workLanguage: es ? "Idioma de trabajo" : "Working language",
    loadingEvents: es ? "Cargando eventos..." : "Loading events...",
    noEvents: es ? "No hay eventos visibles para tu usuario." : "There are no events visible for your user.",
    untitledEvent: es ? "Evento sin titulo" : "Untitled event",
    edit: es ? "Editar" : "Edit",
    delete: es ? "Borrar" : "Delete",
    closeEvent: es ? "Cerrar evento" : "Close event",
    closeEventConfirm: es
      ? 'Se cerrara el evento "{title}", se archivara y se cerrara la inscripcion web. Continuar?'
      : 'This will close "{title}", archive it, and stop web registration. Continue?',
    closeEventError: es ? "No se pudo cerrar el evento." : "The event could not be closed.",
    eventClosed: es ? "Evento cerrado y archivado." : "Event closed and archived.",
    editEvent: es ? "Editar evento" : "Edit event",
    newEvent: es ? "Nuevo evento" : "New event",
    editedLanguage: es ? "Idioma editado" : "Edited language",
    eventType: es ? "Tipo de evento" : "Event type",
    status: es ? "Estado" : "Status",
    draft: es ? "Borrador" : "Draft",
    published: es ? "Publicado" : "Published",
    archived: es ? "Archivado" : "Archived",
    officialIka: es ? "Oficial IKA" : "Official IKA",
    allowRegistration: es ? "Permitir inscripcion web" : "Allow web registration",
    registrationOpen: es ? "Inscripcion abierta" : "Registration open",
    tshirtEnabled: es ? "Camiseta del evento" : "Event T-shirt",
    availableTshirtSizes: es ? "Tallas disponibles para este evento" : "Available sizes for this event",
    durationDays: es ? "Dias del evento" : "Event days",
    countryScope: es ? "Pais del evento" : "Event country",
    dojoScope: es ? "Dojo organizador" : "Hosting dojo",
    selectCountry: es ? "Selecciona pais" : "Select country",
    selectDojo: es ? "Selecciona dojo" : "Select dojo",
    yes: es ? "Si" : "Yes",
    no: es ? "No" : "No",
    start: es ? "Inicio" : "Start",
    end: es ? "Fin" : "End",
    title: es ? "Titulo" : "Title",
    slug: "Slug",
    place: es ? "Lugar" : "Place",
    eventImage: es ? "Imagen del evento" : "Event image",
    uploadImage: es ? "Subir imagen" : "Upload image",
    changeImage: es ? "Cambiar imagen" : "Change image",
    removeImage: es ? "Quitar imagen" : "Remove image",
    imageAlt: es ? "Texto alternativo de imagen" : "Image alt text",
    noImage: es ? "Sin imagen" : "No image",
    selectImage: es ? "Selecciona una imagen valida." : "Select a valid image.",
    summary: es ? "Resumen" : "Summary",
    body: es ? "Cuerpo" : "Body",
    taikaiConfigTitle: es ? "Configuracion del taikai" : "Taikai setup",
    taikaiConfigIntro: es
      ? "Define aqui las modalidades, categorias, resultados y premios que el organizador podra adjudicar despues a los inscritos."
      : "Define the modalities, categories, results, and awards that the organiser will later assign to registered participants.",
    taikaiModalities: es ? "Modalidades del taikai" : "Taikai modalities",
    taikaiCategories: es ? "Categorias disponibles" : "Available categories",
    taikaiResults: es ? "Resultados disponibles" : "Available results",
    taikaiAwards: es ? "Premios o trofeos" : "Awards or trophies",
    saveEvent: es ? "Guardar evento" : "Save event",
    clear: es ? "Limpiar" : "Clear",
    registrations: es ? "Inscritos" : "Registrations",
    viewRegistrations: es ? "Ver inscritos" : "View registrations",
    registeredMembers: es ? "inscritos" : "registered",
    searchRegistration: es ? "Buscar inscrito" : "Search registration",
    searchRegistrationPlaceholder: es
      ? "Nombre, apellido, email, IKA ID o grado"
      : "Name, surname, email, IKA ID or grade",
    filterCountry: es ? "Filtrar por pais" : "Filter by country",
    filterDojo: es ? "Filtrar por dojo" : "Filter by dojo",
    allCountries: es ? "Todos los paises" : "All countries",
    allDojos: es ? "Todos los dojos" : "All dojos",
    unknownCountry: es ? "Pais sin identificar" : "Unknown country",
    unknownDojo: es ? "Dojo sin identificar" : "Unknown dojo",
    filteredRegistrations: es ? "Vista filtrada" : "Filtered view",
    registrationsByCountry: es ? "Inscritos por pais" : "Registrations by country",
    registrationsCount: (count: number) => (es ? `${count} inscritos` : `${count} registrations`),
    noRegistrationsForFilters: es
      ? "No hay inscritos que coincidan con los filtros actuales."
      : "No registrations match the current filters.",
    copyEmails: es ? "Copiar emails" : "Copy emails",
    emailNotice: es ? "Enviar aviso" : "Send notice",
    exportCsv: es ? "Exportar CSV" : "Export CSV",
    noticeOpening: es ? "Plantilla apertura" : "Opening template",
    noticeSchedule: es ? "Plantilla cambio horario" : "Schedule change template",
    noticeReminder: es ? "Plantilla recordatorio 7 dias" : "7-day reminder template",
    noRegistrations: es ? "Todavia no hay inscritos en este evento." : "There are no registrations for this event yet.",
    noEmailsToCopy: es ? "No hay emails para copiar." : "There are no emails to copy.",
    emailsCopied: es ? "Emails copiados." : "Emails copied.",
    csvExported: es ? "CSV exportado." : "CSV exported.",
    registrationUpdated: es ? "Inscripcion actualizada." : "Registration updated.",
    memberUnknown: es ? "Kenshi sin ficha visible" : "Kenshi not visible",
    noEmail: es ? "Sin email" : "No email",
    unscopedEvent: es ? "Evento sin ambito visible" : "Event without visible scope",
    paymentStatus: es ? "Pago" : "Payment",
    paymentPending: es ? "Pendiente" : "Pending",
    paymentPaid: es ? "Pagado" : "Paid",
    paymentWaived: es ? "Exento" : "Waived",
    checkInByDay: es ? "Check-in por dias" : "Daily check-in",
    checkInDone: es ? "Check-in hecho" : "Checked in",
    dayLabel: (dayNumber: number) => (es ? `Dia ${dayNumber}` : `Day ${dayNumber}`),
    checkInSummary: (checked: number, total: number) =>
      es ? `${checked} de ${total} dias marcados` : `${checked} of ${total} days checked in`,
    notCheckedIn: es ? "Todavia sin check-in" : "Not checked in yet",
    tshirtQuestion: es ? "Camiseta" : "T-shirt",
    tshirtSize: es ? "Talla" : "Size",
    selectSize: es ? "Selecciona talla" : "Select size",
    adminNotes: es ? "Notas admin" : "Admin notes",
    registeredAt: es ? "Inscrito el" : "Registered on",
    cancelRegistration: es ? "Cancelar inscripcion" : "Cancel registration",
    restoreRegistration: es ? "Reactivar inscripcion" : "Restore registration",
    registrationRegistered: es ? "Inscrito" : "Registered",
    registrationCancelled: es ? "Cancelado" : "Cancelled",
    typeLabels: {
      event: es ? "Evento" : "Event",
      seminar: es ? "Seminario" : "Seminar",
      course: es ? "Curso" : "Course",
      taikai: es ? "Taikai" : "Taikai",
      grading: es ? "Examen" : "Grading",
      meeting: es ? "Reunion" : "Meeting",
      encounter: es ? "Encuentro" : "Encounter",
      busen: "Busen",
    } satisfies Record<EventType, string>,
  };
}

function escapeCsvValue(value: string) {
  const normalized = value.replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${normalized}"`;
}

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "XS", "2XS", "3XS"] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeListString(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function getDefaultTaikaiModalities(locale: Locale) {
  if (locale === "es") {
    return [
      "Randori (sparring)",
      "Tanen embu",
      "Kumi embu",
      "Dantai embu",
      "Houki embu",
      "Goshin jutsu",
    ];
  }

  return [
    "Randori (sparring)",
    "Tanen embu",
    "Kumi embu",
    "Dantai embu",
    "Houki embu",
    "Goshin jutsu",
  ];
}

function getDefaultTaikaiCategories(locale: Locale) {
  if (locale === "es") {
    return [
      "Kyu infantil",
      "Kyu adulto",
      "Dan",
      "Open",
      "Parejas",
      "Equipos",
    ];
  }

  return [
    "Junior kyu",
    "Adult kyu",
    "Dan",
    "Open",
    "Pairs",
    "Teams",
  ];
}

function getDefaultTaikaiResults(locale: Locale) {
  if (locale === "es") {
    return [
      "Campeon",
      "Subcampeon",
      "Tercer puesto",
      "Finalista",
      "Participacion destacada",
    ];
  }

  return [
    "Champion",
    "Runner-up",
    "Third place",
    "Finalist",
    "Outstanding participation",
  ];
}

function getDefaultTaikaiAwards(locale: Locale) {
  if (locale === "es") {
    return [
      "Trofeo",
      "Medalla",
      "Diploma",
      "Mencion especial",
      "Premio tecnico",
    ];
  }

  return [
    "Trophy",
    "Medal",
    "Diploma",
    "Special mention",
    "Technical award",
  ];
}
