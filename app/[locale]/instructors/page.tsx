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
  const instructors = await getOfficialInstructors(safeLocale);
  const chiefInstructor =
    instructors.find((instructor) => instructor.isChiefInstructor) ?? null;
  const regularInstructors = chiefInstructor
    ? instructors.filter((instructor) => instructor.id !== chiefInstructor.id)
    : instructors;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {copy.eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
        {copy.intro}
      </p>

      {instructors.length === 0 ? (
        <div className="mt-10 border border-[var(--line)] bg-white p-6 text-[var(--muted)]">
          {copy.empty}
        </div>
      ) : (
          <div className="mt-10 space-y-8 sm:space-y-10">
          {chiefInstructor ? (
            <article className="overflow-hidden border border-[var(--accent)] bg-[linear-gradient(135deg,rgba(160,29,48,0.06),rgba(255,255,255,0.98)_32%,rgba(20,30,48,0.04))] shadow-[0_18px_45px_rgba(20,30,48,0.08)]">
              <div className="h-1.5 w-full bg-[var(--accent)]" />
              <div className="p-4 sm:p-6 md:p-8">
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                {chiefInstructor.photo ? (
                  <div className="overflow-hidden border border-[var(--accent)] bg-white shadow-[0_12px_30px_rgba(20,30,48,0.12)]">
                    <Image
                      src={chiefInstructor.photo}
                      alt={chiefInstructor.photoAlt ?? chiefInstructor.name}
                      width={220}
                      height={260}
                      className="h-[260px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-[260px] items-center justify-center border border-[var(--accent)] bg-white text-5xl font-semibold text-[var(--ink-blue)] shadow-[0_12px_30px_rgba(20,30,48,0.12)]">
                    {getInitials(chiefInstructor.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="inline-flex items-center border border-[rgba(160,29,48,0.18)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {copy.chiefBadge}
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
                    {chiefInstructor.name}
                  </h2>
                  <p className="mt-4 text-base font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-lg">
                    {chiefInstructor.grade || copy.noGrade}
                  </p>
                  {chiefInstructor.chiefNote ? (
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
                      {chiefInstructor.chiefNote}
                    </p>
                  ) : null}

                  <dl className="mt-6 grid gap-5 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
                    <div className="grid gap-1">
                      <dt className="font-semibold text-[var(--foreground)]">
                        {copy.countryLabel}
                      </dt>
                      <dd>{chiefInstructor.country}</dd>
                    </div>
                    <div className="grid gap-1">
                      <dt className="font-semibold text-[var(--foreground)]">
                        {copy.gradeLabel}
                      </dt>
                      <dd>{chiefInstructor.grade || copy.noGrade}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              </div>
            </article>
          ) : null}

          {regularInstructors.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {regularInstructors.map((instructor) => (
                <article
                  key={instructor.id}
                  className="flex h-full flex-col border border-[var(--line)] bg-white p-4 sm:p-6 lg:p-7"
                >
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5">
                    {instructor.photo ? (
                      <div className="overflow-hidden border border-[var(--line)] bg-[var(--paper)]">
                        <Image
                          src={instructor.photo}
                          alt={instructor.photoAlt ?? instructor.name}
                          width={112}
                          height={112}
                          className="size-24 object-cover sm:size-28"
                        />
                      </div>
                    ) : (
                      <div className="flex size-24 items-center justify-center border border-[var(--line)] bg-[var(--paper)] text-3xl font-semibold text-[var(--ink-blue)] sm:size-28">
                        {getInitials(instructor.name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                        {instructor.name}
                      </h2>
                      <p className="mt-4 text-base font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        {instructor.grade || copy.noGrade}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-6 grid flex-1 gap-4 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]">
                    <div className="grid gap-1">
                      <dt className="font-semibold text-[var(--foreground)]">
                        {copy.countryLabel}
                      </dt>
                      <dd>{instructor.country}</dd>
                    </div>
                    <div className="grid gap-1">
                      <dt className="font-semibold text-[var(--foreground)]">
                        {copy.gradeLabel}
                      </dt>
                      <dd>{instructor.grade || copy.noGrade}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      )}
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
