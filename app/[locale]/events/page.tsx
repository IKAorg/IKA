import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPublicEvents } from "@/lib/content/events-calendar";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type EventsPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(safeLocale, "events");
  const events = await getPublicEvents(safeLocale);
  const labels = eventPageLabels[safeLocale] ?? eventPageLabels[defaultLocale]!;
  const upcomingEvents = events.filter((event) => !isPastEvent(event.endsAt, event.startsAt));
  const pastEvents = events
    .filter((event) => isPastEvent(event.endsAt, event.startsAt))
    .sort((left, right) => right.startsAt.localeCompare(left.startsAt));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{content.title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {content.intro}
        </p>
        <PublicContentBlocks blocks={content.blocks} />
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
                  <span>{labels.types[event.type] ?? labels.types.event}</span>
                  <span>{event.organiser}</span>
                  {event.isOfficialIka ? <span>{labels.official}</span> : null}
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
                    {labels.more}
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-[var(--muted)] sm:px-5 md:px-7">
            {labels.empty}
          </div>
        )}
      </div>

      {pastEvents.length > 0 ? (
        <section className="mt-10 border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-4 py-5 sm:px-5 md:px-7">
            <h2 className="text-2xl font-semibold">{getPastEventsTitle(safeLocale)}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {getPastEventsText(safeLocale)}
            </p>
          </div>
          <div>
            {pastEvents.map((event, index) => (
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
                    <span>{labels.types[event.type] ?? labels.types.event}</span>
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
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

const eventPageLabels: Partial<
  Record<
    Locale,
    {
      empty: string;
      more: string;
      official: string;
      types: Record<
        "event" | "taikai" | "grading" | "seminar" | "course" | "meeting" | "encounter" | "busen",
        string
      >;
    }
  >
> = {
  en: {
    empty: "New events will be announced soon.",
    more: "View details",
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
    empty: "Proximamente nuevos eventos.",
    more: "Ver detalle",
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
    empty: "Nuovi eventi saranno annunciati presto.",
    more: "Vedi dettagli",
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
    empty: "De nouveaux evenements seront annonces prochainement.",
    more: "Voir le detail",
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
    empty: "\u65b0\u3057\u3044\u30a4\u30d9\u30f3\u30c8\u306f\u8fd1\u65e5\u4e2d\u306b\u304a\u77e5\u3089\u305b\u3057\u307e\u3059\u3002",
    more: "詳細を見る",
    official: "IKA公式",
    types: {
      event: "イベント",
      taikai: "Taikai",
      grading: "昇級昇段審査",
      seminar: "セミナー",
      course: "講習",
      meeting: "会議",
      encounter: "交流会",
      busen: "Busen",
    },
  },
  zh: {
    empty: "\u65b0\u7684\u6d3b\u52a8\u5c06\u5f88\u5feb\u516c\u5e03\u3002",
    more: "查看详情",
    official: "IKA官方",
    types: {
      event: "活动",
      taikai: "Taikai",
      grading: "考级",
      seminar: "研讨会",
      course: "课程",
      meeting: "会议",
      encounter: "交流活动",
      busen: "Busen",
    },
  },
  cs: {
    empty: "Nove udalosti budou oznameny brzy.",
    more: "Zobrazit detail",
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
    empty: "Acara baru akan diumumkan segera.",
    more: "Lihat detail",
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
    empty: "Acara baharu akan diumumkan tidak lama lagi.",
    more: "Lihat butiran",
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
    empty: "Laster ekitaldi berriak iragarriko dira.",
    more: "Ikusi xehetasuna",
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
    empty: "Novos eventos serao anunciados em breve.",
    more: "Ver detalhe",
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
    empty: "Neue Veranstaltungen werden in Kurze bekanntgegeben.",
    more: "Details ansehen",
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

function getPastEventsTitle(locale: Locale) {
  switch (locale) {
    case "es":
      return "Eventos pasados";
    case "it":
      return "Eventi passati";
    case "fr":
      return "Evenements passes";
    case "ja":
      return "過去のイベント";
    case "zh":
      return "往期活动";
    case "cs":
      return "Minule udalosti";
    case "id":
      return "Acara lampau";
    case "ms":
      return "Acara lepas";
    case "eu":
      return "Iraganeko ekitaldiak";
    case "pt":
      return "Eventos passados";
    case "de":
      return "Vergangene Veranstaltungen";
    default:
      return "Past events";
  }
}

function getPastEventsText(locale: Locale) {
  switch (locale) {
    case "es":
      return "Los eventos completados se mueven aqui automaticamente cuando su fecha ya ha pasado.";
    case "it":
      return "Gli eventi completati vengono spostati qui automaticamente quando la loro data e gia passata.";
    case "fr":
      return "Les evenements termines sont deplaces ici automatiquement une fois leur date passee.";
    case "ja":
      return "終了したイベントは、日付を過ぎると自動的にこちらに移動されます。";
    case "zh":
      return "活动结束后，会在日期过去后自动移动到这一区域。";
    case "cs":
      return "Dokoncene udalosti se sem automaticky presunou po uplynuti jejich data.";
    case "id":
      return "Acara yang telah selesai akan dipindahkan ke sini secara otomatis setelah tanggalnya berlalu.";
    case "ms":
      return "Acara yang telah selesai akan dipindahkan ke sini secara automatik selepas tarikhnya berlalu.";
    case "eu":
      return "Amaitutako ekitaldiak automatikoki hona mugitzen dira haien data igarotzen denean.";
    case "pt":
      return "Os eventos concluidos sao movidos automaticamente para aqui quando a data ja passou.";
    case "de":
      return "Abgeschlossene Veranstaltungen werden nach ihrem Datum automatisch hierher verschoben.";
    default:
      return "Completed events are moved here automatically once their date has passed.";
  }
}

function getPastEventBadge(locale: Locale) {
  switch (locale) {
    case "es":
      return "Evento pasado";
    case "it":
      return "Evento passato";
    case "fr":
      return "Evenement passe";
    case "ja":
      return "終了済み";
    case "zh":
      return "已结束";
    case "cs":
      return "Minula udalost";
    case "id":
      return "Acara lampau";
    case "ms":
      return "Acara lepas";
    case "eu":
      return "Iraganeko ekitaldia";
    case "pt":
      return "Evento passado";
    case "de":
      return "Vergangene Veranstaltung";
    default:
      return "Past event";
  }
}
