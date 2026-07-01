import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import {
  archiveMonths,
  getArchiveMonthLabel,
} from "@/lib/content/news-archive";
import { archiveLabels } from "@/lib/i18n/news-archive";

export function ArchiveSidebar({
  locale,
  activeMonth,
}: {
  locale: Locale;
  activeMonth?: string;
}) {
  const labels = archiveLabels[locale];

  return (
    <aside className="h-fit border border-[var(--line)] bg-white p-5 lg:sticky lg:top-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
        {labels.months}
      </h2>
      <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
        <Link
          href={`/${locale}/news/archive`}
          className={!activeMonth ? "font-semibold text-[var(--accent)]" : ""}
        >
          {labels.all}
        </Link>
        {archiveMonths.map((month) => (
          <Link
            key={month}
            href={`/${locale}/news/archive/${month}`}
            className={
              activeMonth === month ? "font-semibold text-[var(--accent)]" : ""
            }
          >
            {getArchiveMonthLabel(month, locale)}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
        {labels.category}
      </h2>
      <Link
        href={`/${locale}/news/archive`}
        className="mt-4 block text-sm text-[var(--muted)]"
      >
        {labels.all}
      </Link>
    </aside>
  );
}
