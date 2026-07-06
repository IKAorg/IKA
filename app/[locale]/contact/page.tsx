import { Send } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getEditablePublicPageContent } from "@/lib/content/public-pages-cms";
import { PublicContentBlocks } from "@/components/public/public-content-blocks";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 60;

const formLabels: Record<
  Locale,
  {
    required: string;
    name: string;
    email: string;
    message: string;
    submit: string;
    note: string;
  }
> = {
  en: {
    required: "indicates required field",
    name: "Name",
    email: "Email",
    message: "Message",
    submit: "Submit",
    note: "Your message will be sent to the IKA contact team.",
  },
  es: {
    required: "indica campo obligatorio",
    name: "Nombre",
    email: "Email",
    message: "Mensaje",
    submit: "Enviar",
    note: "Tu mensaje se enviara al equipo de contacto de IKA.",
  },
  it: {
    required: "indica campo obbligatorio",
    name: "Nome",
    email: "Email",
    message: "Messaggio",
    submit: "Invia",
    note: "Il messaggio sara inviato al team di contatto IKA.",
  },
  fr: {
    required: "indique un champ obligatoire",
    name: "Nom",
    email: "Email",
    message: "Message",
    submit: "Envoyer",
    note: "Votre message sera envoye a l'equipe de contact IKA.",
  },
  ja: {
    required: "必須項目",
    name: "名前",
    email: "Email",
    message: "メッセージ",
    submit: "送信",
    note: "Your message will be sent to the IKA contact team.",
  },
  zh: {
    required: "必填字段",
    name: "姓名",
    email: "Email",
    message: "信息",
    submit: "提交",
    note: "Your message will be sent to the IKA contact team.",
  },
  cs: {
    required: "označuje povinné pole",
    name: "Jméno",
    email: "Email",
    message: "Zpráva",
    submit: "Odeslat",
    note: "Zprava bude odeslana kontaktnimu tymu IKA.",
  },
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const content = await getEditablePublicPageContent(
    safeLocale,
    "contact",
  );
  const labels = formLabels[safeLocale];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            {content.intro}
          </p>
          <PublicContentBlocks blocks={content.blocks} />
        </div>

        <form
          action="https://www.weebly.com/weebly/apps/formSubmit.php"
          method="post"
          encType="multipart/form-data"
          className="border border-[var(--line)] bg-white p-6 md:p-8"
        >
          <input type="hidden" name="wsite_subject" value="IKA website contact" />
          <input type="hidden" name="form_version" value="2" />
          <input type="hidden" name="wsite_approved" value="approved" />
          <input type="hidden" name="ucfid" value="974784864271926947" />
          <input type="hidden" name="recaptcha_token" value="" />
          <p className="text-sm italic text-[var(--muted)]">
            <span className="text-[var(--accent)]">*</span> {labels.required}
          </p>

          <div className="mt-8 space-y-7">
            <label className="block">
              <span className="text-xl font-semibold uppercase tracking-[0.06em]">
                {labels.name} <span className="text-[var(--accent)]">*</span>
              </span>
              <input
                name="_u946283888663309420"
                required
                autoComplete="name"
                className="mt-3 w-full border border-[#9c9c9c] bg-white px-4 py-4 outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="text-xl font-semibold uppercase tracking-[0.06em]">
                {labels.email} <span className="text-[var(--accent)]">*</span>
              </span>
              <input
                name="_u586897620777281584"
                type="email"
                required
                autoComplete="email"
                className="mt-3 w-full border border-[#9c9c9c] bg-white px-4 py-4 outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="block">
              <span className="text-xl font-semibold uppercase tracking-[0.06em]">
                {labels.message}{" "}
                <span className="text-[var(--accent)]">*</span>
              </span>
              <textarea
                name="_u612625839544163071"
                required
                rows={9}
                className="mt-3 w-full resize-y border border-[#9c9c9c] bg-white px-4 py-4 outline-none transition focus:border-[var(--accent)]"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-8 inline-flex items-center gap-2 border border-black px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
          >
            <Send size={17} aria-hidden="true" />
            {labels.submit}
          </button>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
            {labels.note}
          </p>
        </form>
      </div>
    </section>
  );
}
