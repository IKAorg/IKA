"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Mail, Save, Search, Shirt, Trash2, Trophy, UsersRound } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  eventId: string;
};

type Registration = {
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
      country_translations?: Array<{
        language_code: string;
        name: string;
      }>;
    } | null;
    dojos?: {
      id?: string | null;
      city?: string | null;
      dojo_translations?: Array<{
        language_code: string;
        name: string;
      }>;
    } | null;
  } | null;
  event_registration_checkins?: Array<{
    day_number: number;
    checked_in_at: string;
  }>;
};

type EventRow = {
  id: string;
  status: string;
  event_type: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  taikai_config?: {
    modalities?: string[];
    categories?: string[];
    results?: string[];
    awards?: string[];
  } | null;
  tshirt_enabled: boolean;
  duration_days: number;
  starts_at: string | null;
  country_id: string | null;
  dojo_id: string | null;
  event_translations: Array<{
    language_code: string;
    title: string;
  }>;
  event_registrations: Registration[];
};

type EventAchievement = {
  id: string;
  member_id: string;
  course_id: string | null;
  title: string;
  modality?: string | null;
  category?: string | null;
  result?: string | null;
  award?: string | null;
  medal_type?: "gold" | "silver" | "bronze" | "finalist" | "participant" | null;
  podium_position?: number | null;
  achieved_on: string;
  achieved_place?: string | null;
  notes?: string | null;
};

export function EventRegistrationsAdmin({ locale, eventId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const copy = getCopy(locale);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [event, setEvent] = useState<EventRow | null>(null);
  const [achievements, setAchievements] = useState<EventAchievement[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedDojoId, setSelectedDojoId] = useState("");

  const loadEvent = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/events/${eventId}`, {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      event?: EventRow;
      achievements?: EventAchievement[];
      error?: string;
    };

    if (!response.ok || !payload.event) {
      setEvent(null);
      setAchievements([]);
      setMessage(payload.error ?? copy.notFound);
      setLoading(false);
      return;
    }

    setEvent(payload.event);
    setAchievements(payload.achievements ?? []);
    setLoading(false);
  }, [copy.notFound, eventId, supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadEvent();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadEvent();
    });

    return () => subscription.unsubscribe();
  }, [loadEvent, supabase]);

  async function patchRegistration(
    registrationId: string,
    patch: Partial<Registration>,
    doneMessage: string,
  ) {
    setSavingKey(registrationId);
    setMessage("");
    const { error } = await supabase
      .from("event_registrations")
      .update(patch)
      .eq("id", registrationId);

    if (error) {
      setMessage(error.message);
      setSavingKey("");
      return;
    }

    setMessage(doneMessage);
    setSavingKey("");
    await loadEvent();
  }

  async function deleteRegistration(registrationId: string) {
    setSavingKey(registrationId);
    setMessage("");
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("id", registrationId);

    if (error) {
      setMessage(error.message);
      setSavingKey("");
      return;
    }

    setMessage(copy.deleted);
    setSavingKey("");
    await loadEvent();
  }

  async function toggleCheckInByDay(registration: Registration, dayNumber: number) {
    setSavingKey(`${registration.id}-${dayNumber}`);
    setMessage("");
    const alreadyCheckedIn = Boolean(
      registration.event_registration_checkins?.some((item) => item.day_number === dayNumber),
    );

    if (alreadyCheckedIn) {
      const { error } = await supabase
        .from("event_registration_checkins")
        .delete()
        .eq("registration_id", registration.id)
        .eq("day_number", dayNumber);

      if (error) {
        setMessage(error.message);
        setSavingKey("");
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
        setSavingKey("");
        return;
      }
    }

    setMessage(copy.updated);
    setSavingKey("");
    await loadEvent();
  }

  async function saveAchievement(
    memberId: string,
    achievement: Partial<EventAchievement>,
  ) {
    if (!memberId) {
      return;
    }

    setSavingKey(`achievement-${memberId}-${achievement.id ?? "new"}`);
    setMessage("");
    const response = await fetch(`/api/admin/events/${eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_achievement",
        achievementId: achievement.id,
        memberId,
        title: eventTitle,
        modality: achievement.modality ?? "",
        category: achievement.category ?? "",
        result: achievement.result ?? "",
        award: achievement.award ?? "",
        medalType: achievement.medal_type ?? "",
        podiumPosition: achievement.podium_position ?? "",
        notes: achievement.notes ?? "",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? copy.achievementSaveError);
      setSavingKey("");
      return;
    }

    setMessage(copy.achievementSaved);
    setSavingKey("");
    await loadEvent();
  }

  async function removeAchievement(achievementId: string) {
    setSavingKey(`achievement-delete-${achievementId}`);
    setMessage("");
    const response = await fetch(`/api/admin/events/${eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_achievement",
        achievementId,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? copy.achievementDeleteError);
      setSavingKey("");
      return;
    }

    setMessage(copy.achievementDeleted);
    setSavingKey("");
    await loadEvent();
  }

  function exportExcel() {
    const rows = scopedRegistrations.map((registration) => ({
      ika_id: registration.members?.ika_number ?? "",
      first_name: registration.members?.first_name ?? "",
      last_name: registration.members?.last_name ?? "",
      email: registration.members?.email ?? "",
      grade: registration.members?.current_grade ?? "",
      status: registration.status ?? "",
      payment_status: registration.payment_status ?? "pending",
      checked_in_days: (registration.event_registration_checkins ?? []).map((item) => item.day_number).join(" | "),
      wants_tshirt: registration.wants_tshirt ? "yes" : "no",
      tshirt_size: registration.tshirt_size ?? "",
      registered_at: registration.created_at ?? "",
      admin_notes: registration.admin_notes ?? "",
    }));

    const headers = Object.keys(rows[0] ?? {
      ika_id: "",
      first_name: "",
      last_name: "",
      email: "",
      grade: "",
      status: "",
      payment_status: "",
      checked_in: "",
      wants_tshirt: "",
      tshirt_size: "",
      registered_at: "",
      admin_notes: "",
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header as keyof typeof row] ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${slugifyFilename(eventTitle)}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }

  function exportPdf() {
    const gradeRows = orderedGradeSummary
      .map(([grade, count]) => `<tr><td>${escapeHtml(grade)}</td><td>${count}</td></tr>`)
      .join("");
    const registrationRows = scopedRegistrations
      .map((registration) => {
        const name = registration.members
          ? `${registration.members.first_name} ${registration.members.last_name}`
          : copy.memberUnknown;
        return `<tr>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(registration.members?.ika_number ?? "-")}</td>
          <td>${escapeHtml(registration.members?.email ?? "-")}</td>
          <td>${escapeHtml(registration.members?.current_grade ?? copy.noGrade)}</td>
          <td>${escapeHtml(registration.status === "registered" ? copy.registered : copy.cancelled)}</td>
          <td>${escapeHtml(registration.payment_status ?? copy.pending)}</td>
          <td>${escapeHtml(registration.wants_tshirt ? `${copy.yes}${registration.tshirt_size ? ` - ${registration.tshirt_size}` : ""}` : copy.no)}</td>
          <td>${escapeHtml((registration.event_registration_checkins ?? []).map((item) => copy.dayLabel(item.day_number)).join(", ") || "-")}</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(eventTitle)} - ${escapeHtml(copy.pdfTitle)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      @page { size: A4 landscape; margin: 14mm; }
      body { font-family: Arial, Helvetica, sans-serif; padding: 0; margin: 0; color: #111; background: #fff; }
      h1, h2 { margin: 0; }
      .page { padding: 8mm; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #8b1e2d; padding-bottom: 14px; margin-bottom: 18px; }
      .eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #8b1e2d; margin-bottom: 8px; }
      .title { font-size: 28px; font-weight: 700; line-height: 1.15; }
      .meta { margin-top: 8px; font-size: 13px; color: #555; }
      .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
      .card { border: 1px solid #d8d2c8; background: #faf8f3; padding: 12px; min-height: 92px; }
      .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8b1e2d; font-weight: 700; }
      .value { font-size: 26px; font-weight: 700; margin-top: 10px; }
      .section { margin-top: 22px; }
      .section h2 { font-size: 18px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 10px; font-size: 11px; }
      th, td { border: 1px solid #d8d2c8; padding: 8px 9px; text-align: left; vertical-align: top; word-break: break-word; }
      th { background: #f3ede4; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5b5560; }
      tbody tr:nth-child(even) td { background: #fcfbf8; }
      .footer-note { margin-top: 12px; font-size: 11px; color: #666; }
      @media print {
        .page { padding: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <div>
          <div class="eyebrow">${escapeHtml(copy.pdfTitle)}</div>
          <h1 class="title">${escapeHtml(eventTitle)}</h1>
          <div class="meta">${escapeHtml(copy.registeredCount)}: ${registeredCount} - ${escapeHtml(copy.search)}: ${escapeHtml(query || (locale === "es" ? "sin filtro" : "no filter"))}</div>
        </div>
        <div class="meta">${new Date().toLocaleDateString(locale)}</div>
      </header>
      <section class="summary">
        <div class="card"><div class="label">${escapeHtml(copy.summaryRegistered)}</div><div class="value">${registeredCount}</div></div>
        <div class="card"><div class="label">${escapeHtml(copy.summaryCancelled)}</div><div class="value">${cancelledCount}</div></div>
        <div class="card"><div class="label">${escapeHtml(copy.summaryCheckIn)}</div><div class="value">${checkedInCount}</div></div>
        <div class="card"><div class="label">${escapeHtml(copy.summaryTshirts)}</div><div class="value">${tshirtCount}</div></div>
        <div class="card"><div class="label">${escapeHtml(copy.summaryPendingPayments)}</div><div class="value">${pendingPaymentCount}</div></div>
      </section>
      <section class="section">
        <h2>${escapeHtml(copy.gradeSummaryTitle)}</h2>
        <table>
          <thead><tr><th>${escapeHtml(copy.gradeLabel)}</th><th>${escapeHtml(copy.summaryRegistered)}</th></tr></thead>
          <tbody>${gradeRows || `<tr><td colspan="2">${escapeHtml(copy.noGradeSummary)}</td></tr>`}</tbody>
        </table>
      </section>
      <section class="section">
        <h2>${escapeHtml(copy.pdfRegistrations)}</h2>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(copy.pdfName)}</th>
              <th>${escapeHtml(copy.pdfIkaId)}</th>
              <th>${escapeHtml(copy.pdfEmail)}</th>
              <th>${escapeHtml(copy.gradeLabel)}</th>
              <th>${escapeHtml(copy.pdfStatus)}</th>
              <th>${escapeHtml(copy.payment)}</th>
              <th>${escapeHtml(copy.tshirt)}</th>
              <th>${escapeHtml(copy.pdfCheckIn)}</th>
            </tr>
          </thead>
          <tbody>${registrationRows || `<tr><td colspan="8">${escapeHtml(copy.noResults)}</td></tr>`}</tbody>
        </table>
        <p class="footer-note">${escapeHtml(locale === "es" ? "Documento generado desde el panel de administracion IKA." : "Document generated from the IKA administration panel.")}</p>
      </section>
    </main>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 500);
      });
    </script>
  </body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const printWindow = window.open(objectUrl, "_blank", "width=1200,height=900");

    if (!printWindow) {
      setMessage(copy.popupBlocked);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  }

  if (!session) {
    return (
      <div className="border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
        {copy.authRequired}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          {copy.loading}
        </span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="border border-[var(--line)] bg-white p-6 text-sm font-semibold text-[var(--accent)]">
        {message || copy.notFound}
      </div>
    );
  }

  const eventTitle =
    event.event_translations.find((item) => item.language_code === locale)?.title ??
    event.event_translations[0]?.title ??
    copy.untitled;
  const registrations = event.event_registrations ?? [];
  const registeredCount = registrations.filter((item) => item.status === "registered").length;
  const cancelledCount = registrations.filter((item) => item.status === "cancelled").length;
  const checkedInCount = registrations.filter((item) => (item.event_registration_checkins ?? []).length > 0).length;
  const tshirtCount = registrations.filter((item) => item.status === "registered" && item.wants_tshirt).length;
  const pendingPaymentCount = registrations.filter(
    (item) => item.status === "registered" && (item.payment_status ?? "pending") === "pending",
  ).length;
  const normalizedQuery = query.trim().toLowerCase();
  const registeredMembers = registrations
    .filter((registration) => registration.status === "registered" && registration.members)
    .map((registration) => registration.members!)
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, locale),
    );
  const registeredMemberOptions = registeredMembers.map((member) => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}${member.current_grade ? ` · ${member.current_grade}` : ""}`,
  }));
  const filteredRegistrations = registrations.filter((registration) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      registration.members?.first_name ?? "",
      registration.members?.last_name ?? "",
      registration.members?.email ?? "",
      registration.members?.ika_number ?? "",
      registration.members?.current_grade ?? "",
      registration.tshirt_size ?? "",
      registration.payment_status ?? "",
      registration.status ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
  const countryOptions = registrations
    .reduce<Array<{ value: string; label: string }>>((acc, registration) => {
      const countryId = registration.members?.country_id?.trim();
      if (!countryId || acc.some((option) => option.value === countryId)) {
        return acc;
      }

      const label =
        registration.members?.countries?.country_translations?.find((item) => item.language_code === locale)?.name ??
        registration.members?.countries?.country_translations?.find((item) => item.language_code === "en")?.name ??
        registration.members?.countries?.country_translations?.[0]?.name ??
        registration.members?.countries?.code ??
        copy.countryUnknown;

      acc.push({ value: countryId, label });
      return acc;
    }, [])
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const dojoOptions = registrations
    .reduce<Array<{ value: string; label: string }>>((acc, registration) => {
      const dojoId = registration.members?.dojo_id?.trim();
      const countryId = registration.members?.country_id?.trim();
      if (!dojoId || acc.some((option) => option.value === dojoId)) {
        return acc;
      }

      if (selectedCountryId && countryId !== selectedCountryId) {
        return acc;
      }

      const label =
        registration.members?.dojos?.dojo_translations?.find((item) => item.language_code === locale)?.name ??
        registration.members?.dojos?.dojo_translations?.find((item) => item.language_code === "en")?.name ??
        registration.members?.dojos?.dojo_translations?.[0]?.name ??
        registration.members?.dojos?.city ??
        copy.dojoUnknown;

      acc.push({ value: dojoId, label });
      return acc;
    }, [])
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const scopedRegistrations = filteredRegistrations.filter((registration) => {
    const registrationCountryId = registration.members?.country_id?.trim() ?? "";
    const registrationDojoId = registration.members?.dojo_id?.trim() ?? "";

    if (selectedCountryId && registrationCountryId !== selectedCountryId) {
      return false;
    }

    if (selectedDojoId && registrationDojoId !== selectedDojoId) {
      return false;
    }

    return true;
  });
  const scopedRegisteredMembers = scopedRegistrations
    .filter((registration) => registration.status === "registered" && registration.members)
    .map((registration) => registration.members!)
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, locale),
    );
  const scopedRegisteredMemberOptions = scopedRegisteredMembers.map((member) => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name}${member.current_grade ? ` · ${member.current_grade}` : ""}`,
  }));
  const filteredRegisteredCount = scopedRegistrations.filter((item) => item.status === "registered").length;
  const filteredCancelledCount = scopedRegistrations.filter((item) => item.status === "cancelled").length;
  const filteredCheckedInCount = scopedRegistrations.filter(
    (item) => (item.event_registration_checkins ?? []).length > 0,
  ).length;
  const filteredGradeSummary = scopedRegistrations
    .filter((item) => item.status === "registered")
    .reduce<Record<string, number>>((acc, item) => {
      const grade = item.members?.current_grade?.trim() || copy.noGrade;
      acc[grade] = (acc[grade] ?? 0) + 1;
      return acc;
    }, {});
  const orderedGradeSummary = Object.entries(filteredGradeSummary).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return a[0].localeCompare(b[0], locale);
  });
  const orderedCountrySummary = Object.values(
    scopedRegistrations
      .filter((item) => item.status === "registered")
      .reduce<Record<string, { label: string; count: number }>>((acc, registration) => {
        const countryId = registration.members?.country_id?.trim() || "__unknown__";
        const label =
          registration.members?.countries?.country_translations?.find((item) => item.language_code === locale)?.name ??
          registration.members?.countries?.country_translations?.find((item) => item.language_code === "en")?.name ??
          registration.members?.countries?.country_translations?.[0]?.name ??
          copy.countryUnknown;
        acc[countryId] = {
          label,
          count: (acc[countryId]?.count ?? 0) + 1,
        };
        return acc;
      }, {}),
  ).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label, locale);
  });
  const taikaiConfig = event.taikai_config ?? {};
  const taikaiModalities = taikaiConfig.modalities?.length ? taikaiConfig.modalities : DEFAULT_TAIKAI_MODALITIES;
  const taikaiCategories = taikaiConfig.categories ?? [];
  const taikaiResults = taikaiConfig.results ?? [];
  const taikaiAwards = taikaiConfig.awards ?? [];
  const sortedAchievements = [...achievements]
    .filter((achievement) =>
      scopedRegisteredMembers.some((member) => member.id === achievement.member_id),
    )
    .sort((a, b) => {
    const memberA = scopedRegisteredMembers.find((member) => member.id === a.member_id);
    const memberB = scopedRegisteredMembers.find((member) => member.id === b.member_id);
    const nameA = memberA ? `${memberA.first_name} ${memberA.last_name}` : "";
    const nameB = memberB ? `${memberB.first_name} ${memberB.last_name}` : "";
    return nameA.localeCompare(nameB, locale);
  });
  const taikaiGroups = buildTaikaiGroups(
    taikaiModalities,
    sortedAchievements,
    locale,
  );

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] bg-white p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{eventTitle}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {registeredCount} {copy.registeredCount}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className="border border-[var(--line)] px-4 py-2 text-sm font-semibold"
        >
          {copy.back}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={<UsersRound size={18} />}
          label={copy.summaryRegistered}
          value={registeredCount}
        />
        <SummaryCard
          icon={<Trash2 size={18} />}
          label={copy.summaryCancelled}
          value={cancelledCount}
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} />}
          label={copy.summaryCheckIn}
          value={checkedInCount}
        />
        <SummaryCard
          icon={<Shirt size={18} />}
          label={copy.summaryTshirts}
          value={tshirtCount}
        />
        <SummaryCard
          icon={<Mail size={18} />}
          label={copy.summaryPendingPayments}
          value={pendingPaymentCount}
        />
      </div>

      <div className="border border-[var(--line)] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">{copy.exportTitle}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold"
            >
              <Download size={15} />
              {copy.exportExcel}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-2 text-sm font-semibold"
            >
              <FileText size={15} />
              {copy.exportPdf}
            </button>
          </div>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          {copy.search}
          <span className="flex items-center border border-[var(--line)] bg-white px-3">
            <Search size={16} className="text-[var(--muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full px-3 py-3 outline-none"
            />
          </span>
        </label>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SelectControl
            label={copy.countryFilter}
            value={selectedCountryId}
            onChange={(value) => {
              setSelectedCountryId(value);
              setSelectedDojoId("");
            }}
            options={[{ value: "", label: copy.allCountries }, ...countryOptions]}
          />
          <SelectControl
            label={copy.dojoFilter}
            value={selectedDojoId}
            onChange={setSelectedDojoId}
            options={[{ value: "", label: copy.allDojos }, ...dojoOptions]}
          />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-[var(--line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.filteredSummaryEyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{copy.filteredSummaryTitle}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryCard icon={<UsersRound size={18} />} label={copy.summaryRegistered} value={filteredRegisteredCount} />
            <SummaryCard icon={<Trash2 size={18} />} label={copy.summaryCancelled} value={filteredCancelledCount} />
            <SummaryCard icon={<CheckCircle2 size={18} />} label={copy.summaryCheckIn} value={filteredCheckedInCount} />
          </div>
        </div>

        <div className="border border-[var(--line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.countryBreakdownEyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{copy.countryBreakdownTitle}</h3>
          <div className="mt-5 grid gap-2">
            {orderedCountrySummary.length > 0 ? (
              orderedCountrySummary.map((item) => (
                <div
                  key={`${item.label}-${item.count}`}
                  className="flex items-center justify-between gap-3 border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
                >
                  <span className="font-semibold text-[var(--text)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--accent)]">
                    {copy.countryCountLabel(item.count)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">{copy.noCountryBreakdown}</p>
            )}
          </div>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.gradeEyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{copy.gradeSummaryTitle}</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {orderedGradeSummary.length} {copy.gradeBandsCount}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {orderedGradeSummary.length > 0 ? (
            orderedGradeSummary.map(([grade, count]) => (
              <article
                key={grade}
                className="border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  {copy.gradeLabel}
                </p>
                <h4 className="mt-2 text-lg font-semibold">{grade}</h4>
                <p className="mt-3 text-3xl font-semibold">{count}</p>
                <p className="text-sm text-[var(--muted)]">{copy.registeredInGrade}</p>
              </article>
            ))
          ) : (
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)] md:col-span-2 xl:col-span-4">
              {copy.noGradeSummary}
            </div>
          )}
        </div>
      </section>

      {event.event_type === "taikai" ? (
        <section className="border border-[var(--line)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {copy.taikaiAwardsEyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{copy.taikaiAwardsTitle}</h3>
              <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
                {copy.taikaiAwardsIntro}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
              <span className="border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-[var(--muted)]">
                {copy.savedResultsCount(sortedAchievements.length)}
              </span>
              <span className="border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-[var(--muted)]">
                {copy.registeredCompetitorsCount(scopedRegisteredMembers.length)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {copy.savedResultsTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{copy.savedResultsHelp}</p>
            </div>
            {sortedAchievements.length === 0 ? (
              <div className="border border-dashed border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--muted)]">
                {copy.noSavedResults}
              </div>
            ) : null}

            <div className="grid gap-4">
              {taikaiGroups.map((group) => (
                <section key={group.key} className="border border-[var(--line)] bg-[var(--paper)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                        {copy.modalityGroup}
                      </p>
                      <h4 className="mt-1 text-lg font-semibold">{group.label}</h4>
                    </div>
                    <span className="border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {copy.savedResultsCount(group.achievements.length)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="hidden grid-cols-[1.1fr_1fr_1fr_0.8fr_0.7fr_1.3fr_auto] gap-2 border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:grid">
                      <span>{copy.category}</span>
                      <span>{copy.resultLabel}</span>
                      <span>{copy.awardLabel}</span>
                      <span>{copy.medalLabel}</span>
                      <span>{copy.positionLabel}</span>
                      <span>{copy.memberLabel}</span>
                      <span>{copy.actionsLabel}</span>
                    </div>
                    {group.achievements.length > 0 ? (
                      group.achievements.map((achievement, index) => (
                        <div key={achievement.id} className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            <span className="border border-[var(--line)] bg-white px-3 py-1">
                              {copy.savedResultLabel(index + 1)}
                            </span>
                          </div>
                          <TaikaiAwardAssignmentRow
                            copy={copy}
                            achievement={achievement}
                            taikaiModalities={taikaiModalities}
                            taikaiCategories={taikaiCategories}
                            taikaiResults={taikaiResults}
                            taikaiAwards={taikaiAwards}
                            memberOptions={scopedRegisteredMemberOptions}
                            saving={savingKey === `achievement-${achievement.member_id}-${achievement.id}`}
                            onSave={(nextAchievement) =>
                              void saveAchievement(nextAchievement.member_id ?? "", nextAchievement)
                            }
                            onDelete={() => void removeAchievement(achievement.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                        {copy.noResultsForModality}
                      </div>
                    )}

                    <div className="grid gap-3 border-t border-[var(--line)] pt-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                          {copy.addResultForModality}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {copy.addResultForModalityHelp}
                        </p>
                      </div>
                      {scopedRegisteredMembers.length > 0 ? (
                        <TaikaiAwardAssignmentRow
                          copy={copy}
                          achievement={{
                            id: "",
                            member_id: scopedRegisteredMembers[0]?.id ?? "",
                            course_id: null,
                            title: eventTitle,
                            modality: group.value,
                            category: taikaiCategories[0] ?? "",
                            result: taikaiResults[0] ?? "",
                            award: taikaiAwards[0] ?? "",
                            medal_type: null,
                            podium_position: null,
                            achieved_on: event.starts_at ?? "",
                            achieved_place: "",
                            notes: "",
                          }}
                          taikaiModalities={taikaiModalities}
                          taikaiCategories={taikaiCategories}
                          taikaiResults={taikaiResults}
                          taikaiAwards={taikaiAwards}
                          memberOptions={scopedRegisteredMemberOptions}
                          saving={savingKey === `achievement-${scopedRegisteredMembers[0]?.id ?? ""}-new-${group.key}`}
                          saveLabel={copy.addAchievement}
                          onSave={(nextAchievement) =>
                            void saveAchievement(nextAchievement.member_id ?? "", nextAchievement)
                          }
                        />
                      ) : (
                        <div className="border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                          {copy.noRegisteredMembersForAwards}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4">
        {scopedRegistrations.map((registration) => (
          <article
            key={registration.id}
            className="grid gap-4 border border-[var(--line)] bg-white p-4 sm:p-5 xl:grid-cols-[1.05fr_0.85fr_0.95fr_1fr]"
          >
            <div>
              <p className="text-lg font-semibold">
                {registration.members
                  ? `${registration.members.first_name} ${registration.members.last_name}`
                  : copy.memberUnknown}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {registration.members?.email ?? copy.noEmail}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                {registration.status === "registered" ? copy.registered : copy.cancelled}
              </p>
            </div>

            <div className="grid gap-2 text-sm">
              <p>{registration.members?.ika_number ?? "-"}</p>
              <p className="text-[var(--muted)]">{registration.members?.current_grade ?? "-"}</p>
              <label className="grid gap-2 font-semibold">
                {copy.payment}
                <select
                  value={registration.payment_status ?? "pending"}
                  onChange={(event) =>
                    void patchRegistration(
                      registration.id,
                      { payment_status: event.target.value as Registration["payment_status"] },
                      copy.updated,
                    )
                  }
                  className="border border-[var(--line)] px-3 py-2 font-normal"
                >
                  <option value="pending">{copy.pending}</option>
                  <option value="paid">{copy.paid}</option>
                  <option value="waived">{copy.waived}</option>
                </select>
              </label>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="grid gap-2">
                <p className="text-sm font-semibold">{copy.checkInByDay}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.max(1, event.duration_days || 1) }, (_, index) => {
                    const dayNumber = index + 1;
                    const dayCheckin = registration.event_registration_checkins?.find(
                      (item) => item.day_number === dayNumber,
                    );

                    return (
                      <button
                        key={`${registration.id}-checkin-${dayNumber}`}
                        type="button"
                        onClick={() => void toggleCheckInByDay(registration, dayNumber)}
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
                        Math.max(1, event.duration_days || 1),
                      )
                    : copy.notCheckedIn}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void patchRegistration(
                    registration.id,
                    { status: registration.status === "registered" ? "cancelled" : "registered" },
                    copy.updated,
                  )
                }
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 font-semibold"
              >
                {registration.status === "registered" ? copy.cancel : copy.restore}
              </button>
              <a
                href={`mailto:${encodeURIComponent(registration.members?.email ?? "")}`}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 font-semibold"
              >
                <Mail size={15} />
                {copy.notify}
              </a>
              <button
                type="button"
                onClick={() => void deleteRegistration(registration.id)}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 font-semibold text-[var(--accent)]"
              >
                <Trash2 size={15} />
                {copy.delete}
              </button>
            </div>

            <div className="grid gap-2 text-sm">
              {event.tshirt_enabled ? (
                <>
                  <label className="grid gap-2 font-semibold">
                    {copy.tshirt}
                    <select
                      value={registration.wants_tshirt ? "yes" : "no"}
                      onChange={(event) =>
                        void patchRegistration(
                          registration.id,
                          {
                            wants_tshirt: event.target.value === "yes",
                            tshirt_size: event.target.value === "yes" ? registration.tshirt_size ?? null : null,
                          },
                          copy.updated,
                        )
                      }
                      className="border border-[var(--line)] px-3 py-2 font-normal"
                    >
                      <option value="no">{copy.no}</option>
                      <option value="yes">{copy.yes}</option>
                    </select>
                  </label>
                  <label className="grid gap-2 font-semibold">
                    {copy.size}
                    <select
                      value={registration.tshirt_size ?? ""}
                      onChange={(event) =>
                        void patchRegistration(
                          registration.id,
                          {
                            wants_tshirt: Boolean(event.target.value),
                            tshirt_size: event.target.value || null,
                          },
                          copy.updated,
                        )
                      }
                      className="border border-[var(--line)] px-3 py-2 font-normal"
                    >
                      <option value="">{copy.selectSize}</option>
                      {TSHIRT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              <label className="grid gap-2 font-semibold">
                {copy.notes}
                <textarea
                  defaultValue={registration.admin_notes ?? ""}
                  onBlur={(event) =>
                    void patchRegistration(
                      registration.id,
                      { admin_notes: event.target.value || null },
                      copy.updated,
                    )
                  }
                  rows={3}
                  className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
                />
              </label>
            </div>

          </article>
        ))}

        {registrations.length === 0 ? (
          <div className="border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
            {copy.empty}
          </div>
        ) : null}
        {registrations.length > 0 && scopedRegistrations.length === 0 ? (
          <div className="border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
            {copy.noResults}
          </div>
        ) : null}
      </div>

      {message ? <p className="text-sm font-semibold text-[var(--accent)]">{message}</p> : null}
      {savingKey ? (
        <p className="text-sm text-[var(--muted)]">{copy.saving}</p>
      ) : null}
    </div>
  );
}

function TaikaiAchievementEditor({
  copy,
  achievement,
  taikaiModalities,
  taikaiCategories,
  taikaiResults,
  taikaiAwards,
  memberOptions,
  saving = false,
  saveLabel,
  onSave,
  onDelete,
}: {
  copy: ReturnType<typeof getCopy>;
  achievement: EventAchievement;
  taikaiModalities: readonly string[];
  taikaiCategories: readonly string[];
  taikaiResults: readonly string[];
  taikaiAwards: readonly string[];
  memberOptions: ReadonlyArray<{ value: string; label: string }>;
  saving?: boolean;
  saveLabel?: string;
  onSave: (achievement: Partial<EventAchievement>) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<Partial<EventAchievement>>(achievement);

  useEffect(() => {
    setDraft(achievement);
  }, [achievement]);

  const selectedMemberLabel =
    memberOptions.find((option) => option.value === (draft.member_id ?? ""))?.label ??
    copy.memberPending;
  const resultPreview = [draft.category, draft.result, draft.award]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {copy.awardAssignment}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text)]">
            {resultPreview || copy.awardPending}
          </p>
        </div>
        <span className="border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {copy.assignedToLabel(selectedMemberLabel)}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SelectControl
          label={copy.modality}
          value={draft.modality ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, modality: value }))}
          options={taikaiModalities}
        />
        <SelectControl
          label={copy.category}
          value={draft.category ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
          options={taikaiCategories}
          allowCustom
        />
        <SelectControl
          label={copy.resultLabel}
          value={draft.result ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, result: value }))}
          options={taikaiResults}
          allowCustom
        />
        <SelectControl
          label={copy.awardLabel}
          value={draft.award ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, award: value }))}
          options={taikaiAwards}
          allowCustom
        />
        <SelectControl
          label={copy.medalLabel}
          value={draft.medal_type ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, medal_type: (value || null) as EventAchievement["medal_type"] }))}
          options={[
            { value: "", label: copy.noMedal },
            { value: "gold", label: copy.medalGold },
            { value: "silver", label: copy.medalSilver },
            { value: "bronze", label: copy.medalBronze },
            { value: "finalist", label: copy.medalFinalist },
            { value: "participant", label: copy.medalParticipant },
          ]}
        />
        <label className="grid gap-2 text-sm font-semibold">
          {copy.positionLabel}
          <input
            type="number"
            min={1}
            value={draft.podium_position ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                podium_position: event.target.value ? Number.parseInt(event.target.value, 10) : null,
              }))
            }
            className="border border-[var(--line)] px-3 py-2 font-normal"
          />
        </label>
        <SelectControl
          label={copy.memberLabel}
          value={draft.member_id ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, member_id: value }))}
          options={memberOptions}
        />
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        {copy.notes}
        <textarea
          value={draft.notes ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          rows={2}
          className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="inline-flex items-center gap-2 bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saveLabel ?? copy.saveAchievement}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
          >
            <Trash2 size={15} />
            {copy.deleteAchievement}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TaikaiAwardAssignmentRow({
  copy,
  achievement,
  taikaiModalities,
  taikaiCategories,
  taikaiResults,
  taikaiAwards,
  memberOptions,
  saving = false,
  saveLabel,
  onSave,
  onDelete,
}: {
  copy: ReturnType<typeof getCopy>;
  achievement: EventAchievement;
  taikaiModalities: readonly string[];
  taikaiCategories: readonly string[];
  taikaiResults: readonly string[];
  taikaiAwards: readonly string[];
  memberOptions: ReadonlyArray<{ value: string; label: string }>;
  saving?: boolean;
  saveLabel?: string;
  onSave: (achievement: Partial<EventAchievement>) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<Partial<EventAchievement>>(achievement);

  useEffect(() => {
    setDraft(achievement);
  }, [achievement]);

  const selectedMemberLabel =
    memberOptions.find((option) => option.value === (draft.member_id ?? ""))?.label ??
    copy.memberPending;
  const resultPreview = [draft.category, draft.result, draft.award]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-white p-4 lg:grid-cols-[1.1fr_1fr_1fr_0.8fr_0.7fr_1.3fr_auto] lg:items-start">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3 lg:col-span-full lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {copy.awardAssignment}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text)]">
            {resultPreview || copy.awardPending}
          </p>
        </div>
        <span className="border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {copy.assignedToLabel(selectedMemberLabel)}
        </span>
      </div>

      <div className="grid gap-2 lg:hidden">
        <label className="text-sm font-semibold">{copy.modality}</label>
        <div className="border border-dashed border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm">
          {draft.modality || copy.modalityUnset}
        </div>
      </div>

      <SelectControl
        label={copy.category}
        value={draft.category ?? ""}
        onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
        options={taikaiCategories}
        allowCustom
      />
      <SelectControl
        label={copy.resultLabel}
        value={draft.result ?? ""}
        onChange={(value) => setDraft((current) => ({ ...current, result: value }))}
        options={taikaiResults}
        allowCustom
      />
      <SelectControl
        label={copy.awardLabel}
        value={draft.award ?? ""}
        onChange={(value) => setDraft((current) => ({ ...current, award: value }))}
        options={taikaiAwards}
        allowCustom
      />
      <SelectControl
        label={copy.medalLabel}
        value={draft.medal_type ?? ""}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            medal_type: (value || null) as EventAchievement["medal_type"],
          }))
        }
        options={[
          { value: "", label: copy.noMedal },
          { value: "gold", label: copy.medalGold },
          { value: "silver", label: copy.medalSilver },
          { value: "bronze", label: copy.medalBronze },
          { value: "finalist", label: copy.medalFinalist },
          { value: "participant", label: copy.medalParticipant },
        ]}
      />
      <label className="grid gap-2 text-sm font-semibold">
        {copy.positionLabel}
        <input
          type="number"
          min={1}
          value={draft.podium_position ?? ""}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              podium_position: event.target.value ? Number.parseInt(event.target.value, 10) : null,
            }))
          }
          className="border border-[var(--line)] px-3 py-2 font-normal"
        />
      </label>
      <div className="grid gap-2">
        <SelectControl
          label={copy.memberLabel}
          value={draft.member_id ?? ""}
          onChange={(value) => setDraft((current) => ({ ...current, member_id: value }))}
          options={memberOptions}
        />
        <div className="hidden border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:block">
          {copy.assignedToLabel(selectedMemberLabel)}
        </div>
      </div>
      <div className="grid gap-2">
        <div className="hidden border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:block">
          {resultPreview || copy.awardPending}
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saveLabel ?? copy.saveAchievement}
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
            >
              <Trash2 size={15} />
              {copy.deleteAchievement}
            </button>
          ) : null}
        </div>
      </div>

      <label className="grid gap-2 text-sm font-semibold lg:col-span-full">
        {copy.notes}
        <textarea
          value={draft.notes ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          rows={2}
          className="resize-y border border-[var(--line)] px-3 py-2 font-normal"
        />
      </label>
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
  allowCustom = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | ReadonlyArray<{ value: string; label: string }>;
  allowCustom?: boolean;
}) {
  const normalizedOptions = Array.isArray(options) && typeof options[0] === "string"
    ? [...(options as readonly string[])].map((option) => ({ value: option, label: option }))
    : [...(options as ReadonlyArray<{ value: string; label: string }>)];

  const hasValue = value && normalizedOptions.some((option) => option.value === value);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold">{label}</label>
      <select
        value={hasValue ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="border border-[var(--line)] px-3 py-2 font-normal"
      >
        <option value="">{allowCustom ? "-" : `- ${label} -`}</option>
        {normalizedOptions.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {allowCustom ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border border-[var(--line)] px-3 py-2 text-sm font-normal"
        />
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugifyFilename(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";
}

function buildTaikaiGroups(
  modalities: readonly string[],
  achievements: readonly EventAchievement[],
  locale: Locale,
) {
  const fallbackLabel = locale === "es" ? "Otras modalidades" : "Other modalities";
  const normalizedModalities = modalities.length > 0 ? [...modalities] : [fallbackLabel];

  const groups = normalizedModalities.map((modality, index) => ({
    key: `modality-${index}-${modality || "general"}`,
    value: modality,
    label: modality || fallbackLabel,
    achievements: achievements.filter((achievement) => (achievement.modality ?? "") === modality),
  }));

  const remainingAchievements = achievements.filter((achievement) => {
    const modality = achievement.modality ?? "";
    return modality && !normalizedModalities.includes(modality);
  });

  if (remainingAchievements.length > 0) {
    groups.push({
      key: "modality-other",
      value: "",
      label: fallbackLabel,
      achievements: remainingAchievements,
    });
  }

  return groups;
}

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "XS", "2XS", "3XS"] as const;
const DEFAULT_TAIKAI_MODALITIES = [
  "Randori (sparring)",
  "Tanen embu",
  "Kumi embu",
  "Dantai embu",
  "Houki embu",
  "Goshin jutsu",
] as const;

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="border border-[var(--line)] bg-white p-4">
      <div className="inline-flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function getCopy(locale: Locale) {
  const es = locale === "es";

  return {
    eyebrow: es ? "Inscritos del evento" : "Event registrations",
    back: es ? "Volver a administracion" : "Back to admin",
    loading: es ? "Cargando inscritos..." : "Loading registrations...",
    notFound: es ? "No se encontro el evento o no tienes acceso." : "Event not found or access denied.",
    untitled: es ? "Evento sin titulo" : "Untitled event",
    registeredCount: es ? "inscritos activos" : "active registrations",
    summaryRegistered: es ? "Inscritos" : "Registered",
    summaryCancelled: es ? "Cancelados" : "Cancelled",
    summaryCheckIn: es ? "Check-in hecho" : "Checked in",
    summaryTshirts: es ? "Camisetas pedidas" : "T-shirts requested",
    summaryPendingPayments: es ? "Pagos pendientes" : "Pending payments",
    exportTitle: es ? "Exportar inscripciones" : "Export registrations",
    exportExcel: es ? "Exportar Excel" : "Export Excel",
    exportPdf: es ? "Exportar PDF" : "Export PDF",
    search: es ? "Buscar inscrito" : "Search registration",
    searchPlaceholder: es
      ? "Nombre, apellido, email, IKA ID, grado, talla..."
      : "Name, surname, email, IKA ID, grade, size...",
    countryFilter: es ? "Filtrar por pais" : "Filter by country",
    dojoFilter: es ? "Filtrar por dojo" : "Filter by dojo",
    allCountries: es ? "Todos los paises" : "All countries",
    allDojos: es ? "Todos los dojos" : "All dojos",
    countryUnknown: es ? "Pais sin identificar" : "Unknown country",
    dojoUnknown: es ? "Dojo sin identificar" : "Unknown dojo",
    filteredSummaryEyebrow: es ? "Resumen filtrado" : "Filtered summary",
    filteredSummaryTitle: es ? "Vista actual de inscritos" : "Current registration view",
    countryBreakdownEyebrow: es ? "Distribucion" : "Breakdown",
    countryBreakdownTitle: es ? "Inscritos por pais" : "Registrations by country",
    countryCountLabel: (count: number) => (es ? `${count} inscritos` : `${count} registrations`),
    noCountryBreakdown: es ? "Todavia no hay inscritos activos para resumir por pais." : "There are no active registrations to summarise by country yet.",
    memberUnknown: es ? "Kenshi sin ficha visible" : "Kenshi not visible",
    noEmail: es ? "Sin email" : "No email",
    noGrade: es ? "Sin grado" : "No grade",
    registered: es ? "Inscrito" : "Registered",
    cancelled: es ? "Cancelado" : "Cancelled",
    gradeEyebrow: es ? "Resumen por grado" : "Summary by grade",
    gradeSummaryTitle: es ? "Distribucion de inscritos por grado" : "Registration distribution by grade",
    gradeBandsCount: es ? "grados detectados" : "grades detected",
    gradeLabel: es ? "Grado" : "Grade",
    registeredInGrade: es ? "inscritos en este grado" : "registrations in this grade",
    noGradeSummary: es ? "Todavia no hay inscritos activos para resumir por grado." : "There are no active registrations to summarize by grade yet.",
    pdfTitle: es ? "Resumen de inscripciones" : "Registration summary",
    pdfRegistrations: es ? "Listado de inscritos" : "Registration list",
    pdfName: es ? "Nombre" : "Name",
    pdfIkaId: es ? "IKA ID" : "IKA ID",
    pdfEmail: es ? "Email" : "Email",
    pdfStatus: es ? "Estado" : "Status",
    pdfCheckIn: es ? "Check-in" : "Check-in",
    popupBlocked: es ? "El navegador ha bloqueado la ventana del PDF. Permite ventanas emergentes e intentalo de nuevo." : "The browser blocked the PDF window. Allow pop-ups and try again.",
    payment: es ? "Pago" : "Payment",
    pending: es ? "Pendiente" : "Pending",
    paid: es ? "Pagado" : "Paid",
    waived: es ? "Exento" : "Waived",
    checkInByDay: es ? "Check-in por dias" : "Daily check-in",
    dayLabel: (dayNumber: number) => (es ? `Dia ${dayNumber}` : `Day ${dayNumber}`),
    checkInSummary: (checked: number, total: number) =>
      es ? `${checked} de ${total} dias marcados` : `${checked} of ${total} days checked in`,
    notCheckedIn: es ? "Todavia sin check-in" : "Not checked in yet",
    cancel: es ? "Cancelar inscripcion" : "Cancel registration",
    restore: es ? "Reactivar inscripcion" : "Restore registration",
    notify: es ? "Enviar notificacion" : "Send notification",
    delete: es ? "Eliminar" : "Delete",
    tshirt: es ? "Camiseta" : "T-shirt",
    size: es ? "Talla" : "Size",
    selectSize: es ? "Selecciona talla" : "Select size",
    yes: es ? "Si" : "Yes",
    no: es ? "No" : "No",
    notes: es ? "Notas admin" : "Admin notes",
    taikaiResultsTitle: es ? "Resultados del taikai" : "Taikai results",
    taikaiResultsIntro: es
      ? "Desde aqui el organizador y el super admin pueden adjudicar modalidades, posiciones, medallas y premios a cada inscrito."
      : "From here the organiser and super admin can assign modalities, placings, medals, and awards to each participant.",
    taikaiAwardsEyebrow: es ? "Adjudicacion" : "Awards",
    taikaiAwardsTitle: es ? "Panel de premios y resultados" : "Awards and results panel",
    taikaiAwardsIntro: es
      ? "Primero defines modalidades, categorias y premios al crear el taikai. Despues, desde aqui, adjudicas cada resultado directamente a uno de los Kenshis inscritos."
      : "First define modalities, categories, and awards when creating the taikai. Then assign each result directly to one of the registered Kenshis here.",
    savedResultsTitle: es ? "Resultados ya guardados" : "Saved results",
    savedResultsHelp: es
      ? "Aqui puedes revisar, corregir o eliminar los resultados ya adjudicados a este Kenshi."
      : "Here you can review, correct, or remove the results already assigned to this Kenshi.",
    noSavedResults: es ? "Todavia no hay resultados guardados para este inscrito." : "There are no saved results for this participant yet.",
    modalityGroup: es ? "Modalidad" : "Modality",
    noResultsForModality: es
      ? "Todavia no hay resultados guardados en esta modalidad."
      : "There are no saved results for this modality yet.",
    addResultForModality: es ? "Anadir resultado en esta modalidad" : "Add result in this modality",
    addResultForModalityHelp: es
      ? "Selecciona un Kenshi inscrito y adjudica aqui su medalla, posicion o premio dentro de esta modalidad."
      : "Select a registered Kenshi and assign their medal, placing, or award here within this modality.",
    awardAssignment: es ? "Adjudicacion de premio" : "Award assignment",
    awardPending: es ? "Premio o resultado pendiente de definir" : "Award or result still to be defined",
    memberPending: es ? "Sin Kenshi asignado" : "No Kenshi assigned",
    assignedToLabel: (member: string) => (es ? `Asignado a ${member}` : `Assigned to ${member}`),
    modalityUnset: es ? "Modalidad sin definir" : "Modality not set",
    actionsLabel: es ? "Acciones" : "Actions",
    noRegisteredMembersForAwards: es
      ? "No hay Kenshis inscritos disponibles para adjudicar premios en este taikai."
      : "There are no registered Kenshis available to assign awards in this taikai.",
    addNewResultTitle: es ? "Anadir nuevo resultado" : "Add new result",
    addNewResultHelp: es
      ? "Usa este bloque para anadir otra modalidad, premio o posicion al mismo Kenshi dentro del taikai."
      : "Use this block to add another modality, award, or placing for the same Kenshi within the taikai.",
    memberLabel: es ? "Kenshi inscrito" : "Registered Kenshi",
    modality: es ? "Modalidad" : "Modality",
    category: es ? "Categoria" : "Category",
    resultLabel: es ? "Resultado" : "Result",
    awardLabel: es ? "Premio o trofeo" : "Award or trophy",
    medalLabel: es ? "Medalla" : "Medal",
    noMedal: es ? "Sin medalla" : "No medal",
    medalGold: es ? "Oro" : "Gold",
    medalSilver: es ? "Plata" : "Silver",
    medalBronze: es ? "Bronce" : "Bronze",
    medalFinalist: es ? "Finalista" : "Finalist",
    medalParticipant: es ? "Participante" : "Participant",
    positionLabel: es ? "Posicion" : "Position",
    savedResultsCount: (count: number) => (es ? `${count} resultados guardados` : `${count} saved results`),
    registeredCompetitorsCount: (count: number) => (es ? `${count} inscritos disponibles` : `${count} available registrants`),
    savedResultLabel: (index: number) => (es ? `Resultado ${index}` : `Result ${index}`),
    saveAchievement: es ? "Guardar resultado" : "Save result",
    addAchievement: es ? "Anadir resultado" : "Add result",
    deleteAchievement: es ? "Quitar resultado" : "Remove result",
    achievementSaved: es ? "Resultado del taikai guardado." : "Taikai result saved.",
    achievementDeleted: es ? "Resultado del taikai eliminado." : "Taikai result removed.",
    achievementSaveError: es ? "No se pudo guardar el resultado del taikai." : "The taikai result could not be saved.",
    achievementDeleteError: es ? "No se pudo eliminar el resultado del taikai." : "The taikai result could not be removed.",
    updated: es ? "Inscripcion actualizada." : "Registration updated.",
    deleted: es ? "Inscripcion eliminada." : "Registration deleted.",
    empty: es ? "Todavia no hay inscritos en este evento." : "There are no registrations for this event yet.",
    noResults: es ? "No hay inscritos que coincidan con los filtros actuales." : "No registrations match the current filters.",
    authRequired: es ? "Debes iniciar sesion como admin para ver esta pagina." : "You must sign in as an admin to view this page.",
    saving: es ? "Guardando cambios..." : "Saving changes...",
  };
}
