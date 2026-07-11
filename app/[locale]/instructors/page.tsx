import Image from "next/image";
import { isLocale } from "@/lib/i18n/config";
import {
  getOfficialInstructors,
  getOfficialInstructorsPageCopy,
} from "@/lib/content/official-instructors";

type InstructorsPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function InstructorsPage({
  params,
}: InstructorsPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = getOfficialInstructorsPageCopy(safeLocale);
  const instructors = getOfficialInstructors(safeLocale);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {copy.eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        {copy.intro}
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {instructors.map((instructor) => (
          <article
            key={instructor.id}
            className="grid gap-5 border border-[var(--line)] bg-white p-5"
          >
            <div className="flex items-start gap-4">
              {instructor.photo ? (
                <Image
                  src={instructor.photo}
                  alt={instructor.photoAlt ?? instructor.name}
                  width={112}
                  height={112}
                  className="size-28 shrink-0 object-cover"
                />
              ) : (
                <div className="flex size-28 shrink-0 items-center justify-center bg-[var(--paper)] text-3xl font-semibold text-[var(--ink-blue)]">
                  {getInitials(instructor.name)}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-2xl font-semibold">{instructor.name}</h2>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {instructor.grade || copy.noGrade}
                </p>
              </div>
            </div>

            <dl className="grid gap-3 border-t border-[var(--line)] pt-4 text-sm leading-6 text-[var(--muted)]">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">
                  {copy.countryLabel}
                </dt>
                <dd>{instructor.country}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">
                  {copy.gradeLabel}
                </dt>
                <dd>{instructor.grade || copy.noGrade}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
