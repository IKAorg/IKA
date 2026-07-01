import { BadgeCheck, FileText, UserRound } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const content = getPublicPageContent(isLocale(locale) ? locale : "en", "portal");
  const blocks = content.blocks ?? [];

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

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <PortalCapability
          icon={<UserRound size={22} />}
          title={blocks[0]?.title ?? "Kenshi"}
          text={blocks[0]?.text ?? ""}
        />
        <PortalCapability
          icon={<BadgeCheck size={22} />}
          title={blocks[1]?.title ?? "Dojo Admin"}
          text={blocks[1]?.text ?? ""}
        />
        <PortalCapability
          icon={<FileText size={22} />}
          title={blocks[2]?.title ?? "Country Admin"}
          text={blocks[2]?.text ?? ""}
        />
      </div>
    </section>
  );
}

function PortalCapability({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[var(--line)] bg-white p-5">
      <div className="mb-5 flex size-11 items-center justify-center bg-[var(--accent)] text-white">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}
