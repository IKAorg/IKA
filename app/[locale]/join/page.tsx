import { isLocale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";
import Link from "next/link";

type JoinPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const joinGuidance = {
  en: {
    title: "Before contacting IKA",
    existing:
      "If IKA already exists in your country, contact the national representative first. Their email and public details are listed on the Countries page.",
    newCountry:
      "If your country is not listed, contact the IKA direction directly and introduce your organisation, background, and country.",
    countries: "See countries",
    contact: "Contact IKA",
  },
  es: {
    title: "Antes de contactar con IKA",
    existing:
      "Si IKA ya existe en tu pais, el primer paso es contactar con el responsable nacional. Su email y datos publicos estan en la pagina de paises.",
    newCountry:
      "Si tu pais no aparece en IKA, contacta directamente con la direccion de IKA y presenta tu organizacion, trayectoria y pais.",
    countries: "Ver paises",
    contact: "Contactar con IKA",
  },
  it: {
    title: "Prima di contattare IKA",
    existing:
      "Se IKA esiste gia nel tuo paese, contatta prima il responsabile nazionale. Email e dati pubblici sono nella pagina dei paesi.",
    newCountry:
      "Se il tuo paese non e presente in IKA, contatta direttamente la direzione IKA e presenta organizzazione, percorso e paese.",
    countries: "Vedi paesi",
    contact: "Contatta IKA",
  },
  fr: {
    title: "Avant de contacter IKA",
    existing:
      "Si IKA existe deja dans votre pays, contactez d'abord le responsable national. Son email et ses informations publiques sont sur la page des pays.",
    newCountry:
      "Si votre pays n'est pas liste, contactez directement la direction IKA et presentez votre organisation, votre parcours et votre pays.",
    countries: "Voir les pays",
    contact: "Contacter IKA",
  },
  ja: {
    title: "IKAへ連絡する前に",
    existing:
      "あなたの国にすでにIKAがある場合は、まず国の責任者へ連絡してください。連絡先は国一覧ページに掲載されています。",
    newCountry:
      "あなたの国が一覧にない場合は、団体、活動歴、国を明記してIKA本部へ直接連絡してください。",
    countries: "国を見る",
    contact: "IKAへ連絡",
  },
  zh: {
    title: "联系 IKA 之前",
    existing:
      "如果你的国家已有 IKA，请先联系国家负责人。邮箱和公开信息可在国家页面查看。",
    newCountry:
      "如果你的国家尚未列入 IKA，请直接联系 IKA 管理层，并介绍你的组织、背景和国家。",
    countries: "查看国家",
    contact: "联系 IKA",
  },
  cs: {
    title: "Pred kontaktovanim IKA",
    existing:
      "Pokud IKA ve vasi zemi jiz existuje, nejprve kontaktujte narodniho zastupce. Email a verejne udaje jsou na strance zemi.",
    newCountry:
      "Pokud vase zeme v IKA neni uvedena, kontaktujte primo vedeni IKA a predstavte organizaci, historii a zemi.",
    countries: "Zobrazit zeme",
    contact: "Kontaktovat IKA",
  },
} as const;

export default async function JoinPage({ params }: JoinPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(
    safeLocale,
    "join",
  );
  const guidance = joinGuidance[safeLocale];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
        {content.title}
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        {content.intro}
      </p>
      <div className="mt-8 border border-[var(--line)] bg-white p-6">
        <h2 className="text-2xl font-semibold">{guidance.title}</h2>
        <div className="mt-4 grid gap-4 text-base leading-7 text-[var(--muted)] md:grid-cols-2">
          <p>{guidance.existing}</p>
          <p>{guidance.newCountry}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${safeLocale}/countries`}
            className="inline-flex border border-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] transition hover:bg-black hover:text-white"
          >
            {guidance.countries}
          </Link>
          <Link
            href={`/${safeLocale}/contact`}
            className="inline-flex border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--accent-dark)]"
          >
            {guidance.contact}
          </Link>
        </div>
      </div>
      <PublicContentBlocks blocks={content.blocks} />
      {!content.hasCmsBlocks ? (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {content.steps?.map((step) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              text={step.text}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[var(--line)] bg-white p-5">
      <span className="text-sm font-semibold text-[var(--accent)]">{number}</span>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
