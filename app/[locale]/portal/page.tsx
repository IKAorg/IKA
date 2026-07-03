import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PortalClient } from "@/components/portal/portal-client";
import type { Locale } from "@/lib/i18n/config";

type PortalPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const portalPageCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    infoSummary: string;
  }
> = {
  en: {
    eyebrow: "Private access",
    title: "Kenshi Portal",
    intro:
      "Sign in to view your record, grades, and IKA permissions according to your role.",
    infoSummary: "Portal role information",
  },
  es: {
    eyebrow: "Acceso privado",
    title: "Portal Kenshi",
    intro:
      "Entra con tu usuario para ver tu ficha, grados y permisos IKA segun tu rol.",
    infoSummary: "Informacion sobre roles del portal",
  },
  it: {
    eyebrow: "Accesso privato",
    title: "Portale Kenshi",
    intro:
      "Accedi per vedere la tua scheda, i gradi e i permessi IKA secondo il tuo ruolo.",
    infoSummary: "Informazioni sui ruoli del portale",
  },
  fr: {
    eyebrow: "Acces prive",
    title: "Portail Kenshi",
    intro:
      "Connectez-vous pour voir votre fiche, vos grades et vos permissions IKA selon votre role.",
    infoSummary: "Informations sur les roles du portail",
  },
  ja: {
    eyebrow: "プライベートアクセス",
    title: "拳士ポータル",
    intro:
      "ログインすると、あなたの記録、級段、ロールに応じたIKA権限を確認できます。",
    infoSummary: "ポータルのロール情報",
  },
  zh: {
    eyebrow: "私人访问",
    title: "拳士门户",
    intro: "登录后可根据你的角色查看档案、等级和 IKA 权限。",
    infoSummary: "门户角色信息",
  },
  cs: {
    eyebrow: "Soukromy pristup",
    title: "Portal Kenshi",
    intro:
      "Prihlaste se a zobrazte svuj zaznam, stupne a opravneni IKA podle sve role.",
    infoSummary: "Informace o rolích portalu",
  },
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const copy = portalPageCopy[safeLocale];
  const content = await getEditablePublicPageContent(
    safeLocale,
    "portal",
  );

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

      <PortalClient locale={safeLocale} />

      <details className="mt-10 border border-[var(--line)] bg-white p-5">
        <summary className="cursor-pointer text-xl font-semibold">
          {copy.infoSummary}
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
