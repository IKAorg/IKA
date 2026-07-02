import { LockKeyhole, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { EventsAdmin } from "@/components/admin/events-admin";
import { isLocale, type Locale } from "@/lib/i18n/config";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

const adminContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    authTitle: string;
    authText: string;
    cmsTitle: string;
    cmsText: string;
    rolesTitle: string;
    rolesText: string;
  }
> = {
  en: {
    eyebrow: "Admin",
    title: "IKA Administration",
    intro:
      "This area will host CMS editing, countries, dojos, members, roles, audit logs, and scoped administration.",
    authTitle: "Supabase Auth",
    authText:
      "Admin access will be protected through Supabase sessions and RLS.",
    cmsTitle: "CMS",
    cmsText:
      "Pages, translations, content blocks, media, news, and events.",
    rolesTitle: "Scoped Roles",
    rolesText:
      "Country and dojo admins operate only within assigned scopes.",
  },
  es: {
    eyebrow: "Admin",
    title: "Administración IKA",
    intro:
      "Esta área alojará la edición del CMS, países, dojos, miembros, roles, registros de auditoría y administración por alcance.",
    authTitle: "Supabase Auth",
    authText:
      "El acceso admin estará protegido mediante sesiones de Supabase y RLS.",
    cmsTitle: "CMS",
    cmsText:
      "Páginas, traducciones, bloques de contenido, medios, noticias y eventos.",
    rolesTitle: "Roles con alcance",
    rolesText:
      "Los administradores de país y dojo operan solo dentro de sus ámbitos asignados.",
  },
  it: {
    eyebrow: "Admin",
    title: "Amministrazione IKA",
    intro:
      "Quest'area ospiterà la modifica CMS, paesi, dojo, membri, ruoli, log di audit e amministrazione per ambito.",
    authTitle: "Supabase Auth",
    authText:
      "L'accesso admin sarà protetto tramite sessioni Supabase e RLS.",
    cmsTitle: "CMS",
    cmsText:
      "Pagine, traduzioni, blocchi di contenuto, media, notizie ed eventi.",
    rolesTitle: "Ruoli con ambito",
    rolesText:
      "Gli admin di paese e dojo operano solo negli ambiti assegnati.",
  },
  fr: {
    eyebrow: "Admin",
    title: "Administration IKA",
    intro:
      "Cette zone accueillera l'édition CMS, les pays, les dojos, les membres, les rôles, les journaux d'audit et l'administration par périmètre.",
    authTitle: "Supabase Auth",
    authText:
      "L'accès admin sera protégé par les sessions Supabase et RLS.",
    cmsTitle: "CMS",
    cmsText:
      "Pages, traductions, blocs de contenu, médias, actualités et événements.",
    rolesTitle: "Rôles par périmètre",
    rolesText:
      "Les admins de pays et de dojo opèrent uniquement dans leurs périmètres assignés.",
  },
  ja: {
    eyebrow: "管理",
    title: "IKA管理",
    intro:
      "この領域ではCMS編集、国、道場、会員、役割、監査ログ、範囲付き管理を扱います。",
    authTitle: "Supabase認証",
    authText:
      "管理者アクセスはSupabaseセッションとRLSによって保護されます。",
    cmsTitle: "CMS",
    cmsText: "ページ、翻訳、コンテンツブロック、メディア、ニュース、イベント。",
    rolesTitle: "範囲付き役割",
    rolesText:
      "国管理者と道場管理者は割り当てられた範囲内でのみ操作します。",
  },
  zh: {
    eyebrow: "管理",
    title: "IKA 管理",
    intro:
      "该区域将用于 CMS 编辑、国家、道场、成员、角色、审计日志和范围化管理。",
    authTitle: "Supabase 认证",
    authText: "管理员访问将通过 Supabase 会话和 RLS 保护。",
    cmsTitle: "CMS",
    cmsText: "页面、翻译、内容块、媒体、新闻和活动。",
    rolesTitle: "范围化角色",
    rolesText: "国家和道场管理员只能在分配的范围内操作。",
  },
  cs: {
    eyebrow: "Admin",
    title: "Administrace IKA",
    intro:
      "Tato oblast bude obsahovat úpravy CMS, země, dódžó, členy, role, auditní logy a správu podle rozsahu.",
    authTitle: "Supabase Auth",
    authText:
      "Admin přístup bude chráněn pomocí Supabase relací a RLS.",
    cmsTitle: "CMS",
    cmsText:
      "Stránky, překlady, obsahové bloky, média, novinky a události.",
    rolesTitle: "Role podle rozsahu",
    rolesText:
      "Administrátoři zemí a dódžó pracují pouze ve svých přidělených rozsazích.",
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const copy = adminContent[isLocale(locale) ? locale : "en"];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          {copy.intro}
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <AdminCapability
          icon={<LockKeyhole size={22} />}
          title={copy.authTitle}
          text={copy.authText}
        />
        <AdminCapability
          icon={<PanelsTopLeft size={22} />}
          title="Eventos CMS"
          text="Primer módulo operativo: crear, editar y publicar eventos del calendario."
        />
        <AdminCapability
          icon={<ShieldCheck size={22} />}
          title={copy.rolesTitle}
          text={copy.rolesText}
        />
      </div>

      <EventsAdmin />
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
