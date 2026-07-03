import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PortalClient } from "@/components/portal/portal-client";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(
    safeLocale,
    "portal",
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Acceso privado
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Portal Kenshi</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          Entra con tu usuario para ver tu ficha, grados y permisos IKA segun
          tu rol.
        </p>
      </div>

      <PortalClient locale={safeLocale} />

      <details className="mt-10 border border-[var(--line)] bg-white p-5">
        <summary className="cursor-pointer text-xl font-semibold">
          Informacion sobre roles del portal
        </summary>
        <div className="mt-5 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">{content.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {content.intro}
          </p>
        </div>
      </details>
    </section>
  );
}
