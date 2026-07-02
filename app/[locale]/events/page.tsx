import { CalendarDays, MapPin } from "lucide-react";
import { getPublicEvents } from "@/lib/content/events-calendar";
import { isLocale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";

type EventsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = getPublicPageContent(safeLocale, "events");
  const events = getPublicEvents(safeLocale);
  const labels = eventPageLabels[safeLocale];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{content.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          {content.intro}
        </p>
      </div>

      <div className="mt-10 border-y border-[var(--line)] bg-white">
        {events.length > 0 ? (
          events.map((event, index) => (
            <article
              key={event.id}
              className={`grid gap-5 px-5 py-6 md:grid-cols-[180px_1fr] md:px-7 ${
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
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  <span>{labels.types[event.type]}</span>
                  <span>{event.organiser}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-tight">
                  {event.title}
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
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
          <div className="px-5 py-10 text-[var(--muted)] md:px-7">
            {labels.empty}
          </div>
        )}
      </div>
    </section>
  );
}

const eventPageLabels = {
  en: {
    empty: "There are no published events yet.",
    types: {
      taikai: "Taikai",
      grading: "Grading",
      seminar: "Seminar",
      course: "Course",
      meeting: "Meeting",
    },
  },
  es: {
    empty: "Todavía no hay eventos publicados.",
    types: {
      taikai: "Taikai",
      grading: "Examen",
      seminar: "Seminario",
      course: "Curso",
      meeting: "Reunión",
    },
  },
  it: {
    empty: "Non ci sono ancora eventi pubblicati.",
    types: {
      taikai: "Taikai",
      grading: "Esame",
      seminar: "Seminario",
      course: "Corso",
      meeting: "Riunione",
    },
  },
  fr: {
    empty: "Aucun événement publié pour le moment.",
    types: {
      taikai: "Taikai",
      grading: "Passage de grade",
      seminar: "Séminaire",
      course: "Cours",
      meeting: "Réunion",
    },
  },
  ja: {
    empty: "公開済みイベントはまだありません。",
    types: {
      taikai: "大会",
      grading: "審査",
      seminar: "セミナー",
      course: "講習",
      meeting: "会議",
    },
  },
  zh: {
    empty: "尚无已发布活动。",
    types: {
      taikai: "大会",
      grading: "考试",
      seminar: "研讨会",
      course: "课程",
      meeting: "会议",
    },
  },
  cs: {
    empty: "Zatím nejsou publikovány žádné události.",
    types: {
      taikai: "Taikai",
      grading: "Zkoušky",
      seminar: "Seminář",
      course: "Kurz",
      meeting: "Setkání",
    },
  },
};

function formatEventDay(startsAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(
    new Date(startsAt),
  );
}

function formatEventMonth(startsAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(startsAt));
}
