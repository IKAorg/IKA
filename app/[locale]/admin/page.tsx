import { LockKeyhole, PanelsTopLeft, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-4 text-4xl font-semibold">IKA Administration</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          This area will host CMS editing, countries, dojos, members, roles,
          audit logs, and scoped administration.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <AdminCapability
          icon={<LockKeyhole size={22} />}
          title="Supabase Auth"
          text="Admin access will be protected through Supabase sessions and RLS."
        />
        <AdminCapability
          icon={<PanelsTopLeft size={22} />}
          title="CMS"
          text="Pages, translations, content blocks, media, news, and events."
        />
        <AdminCapability
          icon={<ShieldCheck size={22} />}
          title="Scoped Roles"
          text="Country and dojo admins operate only within assigned scopes."
        />
      </div>
    </section>
  );
}

function AdminCapability({
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
      <div className="mb-5 flex size-11 items-center justify-center bg-black text-white">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}
