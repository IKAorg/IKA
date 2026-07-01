import { BadgeCheck, FileText, UserRound } from "lucide-react";

export default function PortalPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Kenshi Portal
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Private Kenshi Area</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          This will be the single private access point. After login, each user
          will enter the correct portal according to their role: Kenshi, dojo
          admin, country admin, global admin, or super admin.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <PortalCapability
          icon={<UserRound size={22} />}
          title="Profile"
          text="Read-only official member data with correction request workflow."
        />
        <PortalCapability
          icon={<BadgeCheck size={22} />}
          title="Grade History"
          text="Official grades, exam dates, places, examiners, and certificates."
        />
        <PortalCapability
          icon={<FileText size={22} />}
          title="IKA Passport"
          text="A digital passport view prepared for future PDF export."
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
