import { BadgeCheck, FileText, ShieldCheck, UserRound } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const content = await getEditablePublicPageContent(
    isLocale(locale) ? locale : "en",
    "portal",
  );
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
        {(blocks.length > 0
          ? blocks
          : [
              { title: "Kenshi", text: "" },
              { title: "Dojo Admin", text: "" },
              { title: "Country Admin", text: "" },
            ]
        ).map((block, index) => (
          <PortalCapability
            key={`${block.title}-${index}`}
            icon={getPortalIcon(index)}
            title={block.title}
            text={block.text}
          />
        ))}
      </div>
    </section>
  );
}

function getPortalIcon(index: number) {
  const icons = [
    <UserRound key="kenshi" size={22} />,
    <BadgeCheck key="dojo" size={22} />,
    <FileText key="country" size={22} />,
    <ShieldCheck key="admin" size={22} />,
  ];

  return icons[index % icons.length];
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
