import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicEvents } from "@/lib/content/events-calendar";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type EventCalendarPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function EventCalendarPage({ params }: EventCalendarPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const events = await getPublicEvents(safeLocale);
  const upcomingEvents = events
    .filter((event) => !isPastEvent(event.endsAt, event.startsAt))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
      <Link
        href={`/${safeLocale}/events`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {getBackToEventsLabel(safeLocale)}
      </Link>

      <div className="mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {getCalendarEyebrow(safeLocale)}
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {getCalendarTitle(safeLocale)}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {getCalendarIntro(safeLocale)}
        </p>
      </div>

      <div className="mt-10 border-y border-[var(--line)] bg-white">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event, index) => (
            <article
              key={event.id}
              className={`grid gap-5 px-4 py-5 sm:px-5 sm:py-6 md:grid-cols-[180px_1fr] md:px-7 ${
                index > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <time
                dateTime={event.startsAt}
                className="flex items-start gap-3 text-[var(--ink-blue)]"
              >
                <CalendarDays size={22} aria-hidden="true" />
                <span>
                  <span className="block text-2xl font-semibold">
                    {formatEventDay(event.startsAt, safeLocale)}
                  </span>
                  <span className="mt-1 block text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {formatEventMonth(event.startsAt, safeLocale)}
                  </span>
                </span>
              </time>

              <div>
                {event.image ? (
                  <div className="mb-5 overflow-hidden border border-[var(--line)] bg-[var(--paper)] p-3">
                    <div className="relative min-h-[220px] bg-white sm:min-h-[320px]">
                      <Image
                        src={event.image}
                        alt={event.imageAlt || event.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  <span>{getTypeLabel(event.type, safeLocale)}</span>
                  <span>{event.organiser}</span>
                  {event.isOfficialIka ? <span>{getOfficialLabel(safeLocale)}</span> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-tight sm:text-2xl">
                  <Link
                    href={`/${safeLocale}/events/${event.slug || event.id}`}
                    className="hover:text-[var(--accent)]"
                  >
                    {event.title}
                  </Link>
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                  {event.summary}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-blue)]">
                  <MapPin size={16} aria-hidden="true" />
                  {event.locationLabel}
                </p>
                <div className="mt-5">
                  <Link
                    href={`/${safeLocale}/events/${event.slug || event.id}`}
                    className="inline-flex min-h-11 items-center border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                  >
                    {getMoreLabel(safeLocale)}
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-[var(--muted)] sm:px-5 md:px-7">
            {getCalendarEmpty(safeLocale)}
          </div>
        )}
      </div>
    </section>
  );
}

function formatEventDay(startsAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(new Date(startsAt));
}

function formatEventMonth(startsAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(startsAt));
}

function isPastEvent(endsAt?: string, startsAt?: string) {
  const compareDate = endsAt || startsAt;

  if (!compareDate) {
    return false;
  }

  const timestamp = Date.parse(compareDate);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < Date.now();
}

function getTypeLabel(
  type: "event" | "taikai" | "grading" | "seminar" | "course" | "meeting" | "encounter" | "busen",
  locale: Locale,
) {
  const labels = calendarTypeLabels[locale] ?? calendarTypeLabels[defaultLocale]!;
  return labels[type] ?? labels.event;
}

const calendarTypeLabels: Partial<
  Record<
    Locale,
    Record<
      "event" | "taikai" | "grading" | "seminar" | "course" | "meeting" | "encounter" | "busen",
      string
    >
  >
> = {
  en: {
    event: "Event",
    taikai: "Taikai",
    grading: "Grading",
    seminar: "Seminar",
    course: "Course",
    meeting: "Meeting",
    encounter: "Encounter",
    busen: "Busen",
  },
  es: {
    event: "Evento",
    taikai: "Taikai",
    grading: "Examen",
    seminar: "Seminario",
    course: "Curso",
    meeting: "Reunion",
    encounter: "Encuentro",
    busen: "Busen",
  },
};

function getBackToEventsLabel(locale: Locale) {
  switch (locale) {
    case "es":
      return "Volver a eventos";
    default:
      return "Back to events";
  }
}

function getCalendarEyebrow(locale: Locale) {
  switch (locale) {
    case "es":
      return "Agenda completa";
    default:
      return "Full calendar";
  }
}

function getCalendarTitle(locale: Locale) {
  switch (locale) {
    case "es":
      return "Calendario completo de eventos IKA";
    default:
      return "Full IKA events calendar";
  }
}

function getCalendarIntro(locale: Locale) {
  switch (locale) {
    case "es":
      return "Consulta toda la agenda futura de IKA para planificar cursos, encuentros y eventos con mas antelacion.";
    default:
      return "Review the full upcoming IKA schedule so you can plan courses, encounters, and events further ahead.";
  }
}

function getCalendarEmpty(locale: Locale) {
  switch (locale) {
    case "es":
      return "Ahora mismo no hay eventos futuros publicados.";
    default:
      return "There are no upcoming published events right now.";
  }
}

function getOfficialLabel(locale: Locale) {
  switch (locale) {
    case "es":
      return "Oficial IKA";
    default:
      return "Official IKA";
  }
}

function getMoreLabel(locale: Locale) {
  switch (locale) {
    case "es":
      return "Ver detalle";
    default:
      return "View details";
  }
}
