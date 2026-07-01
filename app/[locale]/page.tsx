import Link from "next/link";
import { ArrowRight, Globe2, Handshake, MapPin, ShieldCheck } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { latestReports } from "@/lib/content/latest-reports";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const heroImage =
  "/images/home/hero.webp";

const featureImage = "/images/home/about.webp";

const membersImage = "/images/home/members.webp";

const eventsImage = "/images/home/events.webp";

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);

  return (
    <div>
      <section className="relative min-h-[82vh] overflow-hidden border-b border-[var(--line)] bg-black text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.42),rgba(0,0,0,0.18))]" />

        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-5 py-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-white/75">
              {dictionary.home.eyebrow}
            </p>
            <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
              {dictionary.home.summary}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              >
                {dictionary.home.primaryAction}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/countries`}
                className="inline-flex items-center gap-2 border border-white/55 px-5 py-3 text-sm font-semibold text-white"
              >
                {dictionary.home.secondaryAction}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <blockquote className="border-l-4 border-[var(--accent)] pl-6 text-3xl font-semibold leading-tight text-[var(--ink-blue)] md:text-4xl">
            “{dictionary.home.quote}”
          </blockquote>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              IKA
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {dictionary.home.introTitle}
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--muted)]">
              {dictionary.home.introText}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-3">
        <PublicPillar
          icon={<Globe2 size={24} />}
          title={dictionary.home.familyTitle}
          text={dictionary.home.familyText}
        />
        <PublicPillar
          icon={<Handshake size={24} />}
          title={dictionary.home.practiceTitle}
          text={dictionary.home.practiceText}
        />
        <PublicPillar
          icon={<ShieldCheck size={24} />}
          title="Private member access"
          text="Kenshi, dojo administrators, country administrators, and global administrators enter through one secure access point according to their role."
        />
      </section>

      <section className="overflow-hidden border-t border-[var(--line)] bg-[var(--ink-blue)] text-white">
        <div className="mx-auto max-w-7xl px-5 pt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
                Latest reports
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                News from the IKA family
              </h2>
            </div>
            <Link
              href={`/${locale}/news`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              View all news
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="home-marquee py-10">
          <div className="home-marquee-track home-marquee-track-slow">
            {[...latestReports, ...latestReports].map((report, index) => (
              <ReportCard
                key={`${report.title}-${index}`}
                href={`/${locale}/news`}
                date={report.date}
                title={report.title}
                image={report.image}
                ariaHidden={index >= latestReports.length}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[var(--line)] bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Read more
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Explore the association
          </h2>
        </div>
        <div className="home-marquee py-10">
          <div className="home-marquee-track">
            <ArticleLink
              href={`/${locale}/about`}
              image={featureImage}
              label="About the IKA"
              title="Shared heritage, training, and philosophy"
            />
            <ArticleLink
              href={`/${locale}/countries`}
              image={membersImage}
              label="Member organisations"
              title="An international association across continents"
            />
            <ArticleLink
              href={`/${locale}/events`}
              image={eventsImage}
              label="Upcoming events"
              title="Seminars, courses, and gatherings"
            />
            <ArticleLink
              href={`/${locale}/about`}
              image={featureImage}
              label="About the IKA"
              title="Shared heritage, training, and philosophy"
              ariaHidden
            />
            <ArticleLink
              href={`/${locale}/countries`}
              image={membersImage}
              label="Member organisations"
              title="An international association across continents"
              ariaHidden
            />
            <ArticleLink
              href={`/${locale}/events`}
              image={eventsImage}
              label="Upcoming events"
              title="Seminars, courses, and gatherings"
              ariaHidden
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Join IKA
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Train together for mutual self-development.
          </h2>
        </div>
        <Link
          href={`/${locale}/join`}
          className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          Contact the association
          <MapPin size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function ReportCard({
  href,
  date,
  title,
  image,
  ariaHidden = false,
}: {
  href: string;
  date: string;
  title: string;
  image: string;
  ariaHidden?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className="group grid min-h-[300px] w-[min(86vw,620px)] shrink-0 overflow-hidden border border-white/20 bg-white/8 text-white backdrop-blur transition-colors hover:bg-white/14 md:grid-cols-[0.95fr_1.05fr]"
    >
      <div
        className="min-h-[220px] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="flex flex-col justify-between p-6">
        <span className="text-sm font-semibold text-white/65">{date}</span>
        <h3 className="mt-8 text-2xl font-semibold leading-tight">{title}</h3>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
          Read report
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function PublicPillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-l border-[var(--line)] pl-5">
      <div className="mb-5 flex size-12 items-center justify-center bg-[var(--ink-blue)] text-white">
        {icon}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}

function ArticleLink({
  href,
  image,
  label,
  title,
  ariaHidden = false,
}: {
  href: string;
  image: string;
  label: string;
  title: string;
  ariaHidden?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className="group grid min-h-[360px] w-[min(86vw,720px)] shrink-0 overflow-hidden border border-[var(--line)] md:grid-cols-2"
    >
      <div
        className="min-h-[240px] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="flex flex-col justify-end bg-[var(--background)] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          {label}
        </p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight">{title}</h3>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
          Read more
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
