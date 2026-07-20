import { CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { EventRegistrationCard } from "@/components/public/event-registration-card";
import { getPublicEventBySlug } from "@/lib/content/events-calendar";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type EventDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60;

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const event = await getPublicEventBySlug(safeLocale, slug);
  const labels = eventDetailLabels[safeLocale] ?? eventDetailLabels[defaultLocale]!;

  if (!event) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-[var(--line)] bg-white p-6">
          {event.image ? (
            <div className="mb-6 overflow-hidden border border-[var(--line)] bg-[var(--paper)] p-3">
              <div className="relative min-h-[260px] bg-white sm:min-h-[420px]">
                <Image
                  src={event.image}
                  alt={event.imageAlt || event.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            <span>{labels.types[event.type] ?? labels.types.event}</span>
            {event.isOfficialIka ? <span>{labels.official}</span> : null}
          </div>

          <h1 className="mt-4 text-4xl font-semibold">{event.title}</h1>
          {event.summary ? (
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              {event.summary}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 border-t border-[var(--line)] pt-6 md:grid-cols-2">
            <div className="inline-flex items-start gap-3">
              <CalendarDays size={18} className="mt-1 text-[var(--ink-blue)]" />
              <div>
                <p className="text-sm font-semibold">{labels.date}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {formatEventDate(event.startsAt, event.endsAt, safeLocale)}
                </p>
              </div>
            </div>

            <div className="inline-flex items-start gap-3">
              <MapPin size={18} className="mt-1 text-[var(--ink-blue)]" />
              <div>
                <p className="text-sm font-semibold">{labels.place}</p>
                <p className="text-sm leading-6 text-[var(--muted)]">{event.locationLabel}</p>
              </div>
            </div>
          </div>

          {event.body ? (
            <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-[15px] leading-7 text-[var(--muted)]">
              {event.body}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6">
          <EventRegistrationCard
            locale={safeLocale}
            eventId={event.id}
            eventTitle={event.title}
            registrationOpen={Boolean(event.registrationOpen)}
            allowMemberRegistration={Boolean(event.allowMemberRegistration)}
            tshirtEnabled={Boolean(event.tshirtEnabled)}
          />

          <div className="border border-[var(--line)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {labels.host}
            </p>
            <p className="mt-3 text-xl font-semibold">{event.organiser}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {event.country}
              {event.city ? ` · ${event.city}` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const eventDetailLabels: Partial<
  Record<
    Locale,
    {
      date: string;
      place: string;
      host: string;
      official: string;
      types: Record<
        "event" | "taikai" | "grading" | "seminar" | "course" | "meeting" | "encounter" | "busen",
        string
      >;
    }
  >
> = {
  en: {
    date: "Date",
    place: "Place",
    host: "Host",
    official: "Official IKA",
    types: {
      event: "Event",
      taikai: "Taikai",
      grading: "Grading",
      seminar: "Seminar",
      course: "Course",
      meeting: "Meeting",
      encounter: "Encounter",
      busen: "Busen",
    },
  },
  es: {
    date: "Fecha",
    place: "Lugar",
    host: "Organiza",
    official: "Oficial IKA",
    types: {
      event: "Evento",
      taikai: "Taikai",
      grading: "Examen",
      seminar: "Seminario",
      course: "Curso",
      meeting: "Reunion",
      encounter: "Encuentro",
      busen: "Busen",
    },
  },
  it: {
    date: "Data",
    place: "Luogo",
    host: "Organizza",
    official: "IKA ufficiale",
    types: {
      event: "Evento",
      taikai: "Taikai",
      grading: "Esame",
      seminar: "Seminario",
      course: "Corso",
      meeting: "Riunione",
      encounter: "Incontro",
      busen: "Busen",
    },
  },
  fr: {
    date: "Date",
    place: "Lieu",
    host: "Organisation",
    official: "IKA officiel",
    types: {
      event: "Evenement",
      taikai: "Taikai",
      grading: "Examen",
      seminar: "Seminaire",
      course: "Cours",
      meeting: "Reunion",
      encounter: "Rencontre",
      busen: "Busen",
    },
  },
  ja: {
    date: "??",
    place: "??",
    host: "??",
    official: "IKA??",
    types: {
      event: "????",
      taikai: "Taikai",
      grading: "??????",
      seminar: "????",
      course: "??",
      meeting: "??",
      encounter: "???",
      busen: "Busen",
    },
  },
  zh: {
    date: "??",
    place: "??",
    host: "???",
    official: "IKA??",
    types: {
      event: "??",
      taikai: "Taikai",
      grading: "??",
      seminar: "???",
      course: "??",
      meeting: "??",
      encounter: "????",
      busen: "Busen",
    },
  },
  cs: {
    date: "Datum",
    place: "Misto",
    host: "Poradatel",
    official: "Oficialni IKA",
    types: {
      event: "Udalost",
      taikai: "Taikai",
      grading: "Zkouska",
      seminar: "Seminar",
      course: "Kurz",
      meeting: "Setkani",
      encounter: "Setkani",
      busen: "Busen",
    },
  },
  id: {
    date: "Tanggal",
    place: "Tempat",
    host: "Penyelenggara",
    official: "IKA resmi",
    types: {
      event: "Acara",
      taikai: "Taikai",
      grading: "Ujian",
      seminar: "Seminar",
      course: "Kursus",
      meeting: "Pertemuan",
      encounter: "Pertemuan bersama",
      busen: "Busen",
    },
  },
  ms: {
    date: "Tarikh",
    place: "Tempat",
    host: "Penganjur",
    official: "IKA rasmi",
    types: {
      event: "Acara",
      taikai: "Taikai",
      grading: "Penilaian",
      seminar: "Seminar",
      course: "Kursus",
      meeting: "Mesyuarat",
      encounter: "Perjumpaan",
      busen: "Busen",
    },
  },
  eu: {
    date: "Data",
    place: "Lekua",
    host: "Antolatzailea",
    official: "IKA ofiziala",
    types: {
      event: "Ekitaldia",
      taikai: "Taikai",
      grading: "Azterketa",
      seminar: "Mintegia",
      course: "Ikastaroa",
      meeting: "Bilera",
      encounter: "Topaketa",
      busen: "Busen",
    },
  },
  pt: {
    date: "Data",
    place: "Local",
    host: "Organizacao",
    official: "IKA oficial",
    types: {
      event: "Evento",
      taikai: "Taikai",
      grading: "Exame",
      seminar: "Seminario",
      course: "Curso",
      meeting: "Reuniao",
      encounter: "Encontro",
      busen: "Busen",
    },
  },
  de: {
    date: "Datum",
    place: "Ort",
    host: "Veranstalter",
    official: "Offizielle IKA",
    types: {
      event: "Veranstaltung",
      taikai: "Taikai",
      grading: "Prufung",
      seminar: "Seminar",
      course: "Lehrgang",
      meeting: "Treffen",
      encounter: "Begegnung",
      busen: "Busen",
    },
  },
};

function formatEventDate(startsAt: string, endsAt: string | undefined, locale: string) {
  const starts = new Date(startsAt);
  const startLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(starts);

  if (!endsAt) {
    return startLabel;
  }

  const ends = new Date(endsAt);
  const endLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ends);

  return `${startLabel} - ${endLabel}`;
}
