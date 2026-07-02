import Link from "next/link";
import { Mail, Send } from "lucide-react";
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
    note: "The message will open in your email application before sending.",
  },
  es: {
    required: "indica campo obligatorio",
    name: "Nombre",
    email: "Email",
    message: "Mensaje",
    submit: "Enviar",
    note: "El mensaje se abrirá en tu aplicación de email antes de enviarse.",
  },
  it: {
    required: "indica campo obbligatorio",
    name: "Nome",
    email: "Email",
    message: "Messaggio",
    submit: "Invia",
    note: "Il messaggio si aprirà nella tua applicazione email prima dell'invio.",
  },
  fr: {
    required: "indique un champ obligatoire",
    name: "Nom",
    email: "Email",
    message: "Message",
    submit: "Envoyer",
    note: "Le message s'ouvrira dans votre application email avant l'envoi.",
  },
  ja: {
    required: "必須項目",
    name: "名前",
    email: "Email",
    message: "メッセージ",
    submit: "送信",
    note: "送信前にメールアプリでメッセージが開きます。",
  },
  zh: {
    required: "必填字段",
    name: "姓名",
    email: "Email",
    message: "信息",
    submit: "提交",
    note: "发送前，信息将在你的电子邮件应用中打开。",
  },
  cs: {
    required: "označuje povinné pole",
    name: "Jméno",
    email: "Email",
    message: "Zpráva",
    submit: "Odeslat",
    note: "Zpráva se před odesláním otevře ve vaší emailové aplikaci.",
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
          <div className="mt-8 border border-[var(--line)] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center bg-[var(--ink-blue)] text-white">
                <Mail size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-[var(--muted)]">
                  {content.emailLabel}
                </p>
                <Link
                  href="mailto:internationalkempoassociation@gmail.com"
                  className="break-words font-semibold"
                >
                  internationalkempoassociation@gmail.com
                </Link>
              </div>
            </div>
          </div>
        </div>

        <form
          action="mailto:internationalkempoassociation@gmail.com"
          method="post"
          encType="text/plain"
          className="border border-[var(--line)] bg-white p-6 md:p-8"
        >
          <p className="text-sm italic text-[var(--muted)]">
            <span className="text-[var(--accent)]">*</span> {labels.required}
          </p>

          <div className="mt-8 space-y-7">
            <label className="block">
              <span className="text-xl font-semibold uppercase tracking-[0.06em]">
                {labels.name} <span className="text-[var(--accent)]">*</span>
              </span>
              <input
                name="name"
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
                name="email"
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
                name="message"
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
