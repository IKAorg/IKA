import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getLegalCopy } from "@/lib/i18n/legal-pages";

export function LegalPage({ locale, type }: { locale: Locale; type: "privacy" | "terms" }) {
  const copy = getLegalCopy(locale);
  const privacy = type === "privacy";
  const sections = privacy
    ? [
        [copy.controller, "International Kempo Association (IKA) is responsible for information processed through this platform. Questions and requests may be submitted through the IKA contact page."],
        [copy.data, "We process account and contact details, membership and dojo records, grades, course and event registrations, attendance, administrative requests, photographs voluntarily uploaded by authorised users, and technical security records."],
        [copy.purpose, "Information is used to manage IKA membership, countries and dojos; provide private portal functions; organise courses and events; maintain historical and sporting records; respond to requests; and protect the platform. Processing is based on the association relationship, consent where required, legitimate administration and applicable legal obligations."],
        [copy.providers, "The platform uses specialised providers, including Vercel for web hosting, Supabase for database and authentication services, and Google Drive for managed image storage. These providers process information only to deliver their services and under their own security and privacy commitments."],
        [copy.retention, "Information is retained for as long as required for active membership, association records, legal obligations and legitimate historical records. Access is role-based and reasonable technical and organisational safeguards are applied."],
        [copy.rights, "You may request access, correction, deletion, restriction or portability of your personal information, or object to its processing where applicable. Use the contact page and identify the account or membership concerned. You may also contact the competent data-protection authority."],
      ]
    : [
        [copy.use, "Use the platform only for legitimate IKA activities and in accordance with applicable law. Do not attempt unauthorised access, interfere with the service, impersonate another person or upload unlawful or harmful material."],
        [copy.accounts, "Private areas require an authorised account. Users are responsible for keeping credentials and administrator PINs confidential and for promptly reporting suspected unauthorised access. Permissions depend on the assigned IKA role and organisational scope."],
        [copy.content, "IKA names, marks, publications and platform content remain the property of IKA or their respective owners. Member and event material may only be used for the authorised association purpose and with the necessary rights and permissions."],
        [copy.availability, "IKA may maintain, improve or modify the platform and may temporarily limit access for security or operational reasons. Reasonable efforts are made to preserve data and service continuity, but uninterrupted availability cannot be guaranteed."],
        [copy.liability, "Users must ensure that information they submit is accurate and that they are authorised to provide it. The platform does not replace formal legal, medical or safeguarding advice. Liability is limited to the extent permitted by applicable law."],
        [copy.changes, "These terms may be updated when the platform, applicable rules or IKA operations change. The current version and its update date will remain available on this page."],
      ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">International Kempo Association</p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">{privacy ? copy.privacyTitle : copy.termsTitle}</h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">{privacy ? copy.privacyIntro : copy.termsIntro}</p>
      <p className="mt-3 text-sm text-[var(--muted)]">{copy.updated}</p>
      <div className="mt-10 border-t border-[var(--line)]">
        {sections.map(([heading, body]) => (
          <article key={heading} className="grid gap-3 border-b border-[var(--line)] py-7 md:grid-cols-[15rem_1fr] md:gap-8">
            <h2 className="text-lg font-semibold">{heading}</h2>
            <p className="max-w-3xl leading-7 text-[var(--muted)]">{body}</p>
          </article>
        ))}
        <article className="grid gap-3 border-b border-[var(--line)] py-7 md:grid-cols-[15rem_1fr] md:gap-8">
          <h2 className="text-lg font-semibold">{copy.contact}</h2>
          <p className="leading-7 text-[var(--muted)]"><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href={`/${locale}/contact`}>Contact IKA</Link></p>
        </article>
      </div>
    </section>
  );
}
