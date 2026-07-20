import { EventRegistrationsAdmin } from "@/components/admin/event-registrations-admin";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

type EventRegistrationsPageProps = {
  params: Promise<{ locale: string; eventId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EventRegistrationsPage({
  params,
}: EventRegistrationsPageProps) {
  const { locale, eventId } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <EventRegistrationsAdmin locale={safeLocale} eventId={eventId} />
    </section>
  );
}
