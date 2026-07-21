import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicEvents } from "@/lib/content/events-calendar";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type EventArchivePageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function EventArchivePage({ params }: EventArchivePageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const events = await getPublicEvents(safeLocale);
  const pastEvents = events
    .filter((event) => isPastEvent(event.endsAt, event.startsAt))
    .sort((left, right) => right.startsAt.localeCompare(left.startsAt));

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
          {getArchiveEyebrow(safeLocale)}
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {getArchiveTitle(safeLocale)}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {getArchiveIntro(safeLocale)}
        </p>
      </div>

      <div className="mt-10 border-y border-[var(--line)] bg-white">
        {pastEvents.length > 0 ? (
          pastEvents.map((event, index) => (
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
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{getTypeLabel(event.type, safeLocale)}</span>
                  <span>{event.organiser}</span>
                  <span>{getPastEventBadge(safeLocale)}</span>
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
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-[var(--muted)] sm:px-5 md:px-7">
            {getArchiveEmpty(safeLocale)}
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
  const labels = archiveTypeLabels[locale] ?? archiveTypeLabels[defaultLocale]!;
  return labels[type] ?? labels.event;
}

const archiveTypeLabels: Partial<
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

function getArchiveEyebrow(locale: Locale) {
  switch (locale) {
    case "es":
      return "Historial";
    default:
      return "Archive";
  }
}

function getArchiveTitle(locale: Locale) {
  switch (locale) {
    case "es":
      return "Historial de eventos IKA";
    default:
      return "IKA event archive";
  }
}

function getArchiveIntro(locale: Locale) {
  switch (locale) {
    case "es":
      return "Aqui puedes consultar todos los eventos ya celebrados sin sobrecargar la vista principal de la agenda publica.";
    default:
      return "Here you can review past events without overloading the main public events page.";
  }
}

function getArchiveEmpty(locale: Locale) {
  switch (locale) {
    case "es":
      return "Todavia no hay eventos archivados.";
    default:
      return "There are no archived events yet.";
  }
}

function getPastEventBadge(locale: Locale) {
  switch (locale) {
    case "es":
      return "Evento pasado";
    default:
      return "Past event";
  }
}
