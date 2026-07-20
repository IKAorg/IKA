import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createAdminClient } from "@/lib/admin/request-forms";
import { RequestFormPage } from "@/components/public/request-form-page";

export default async function RequestTokenPage({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale, token } = await params;
  const admin = createAdminClient();

  if (!admin) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="border border-[var(--line)] bg-white p-8 text-[var(--accent)]">
          Supabase configuration missing.
        </div>
      </section>
    );
  }

  const form = await admin
    .from("request_forms")
    .select("id,form_type,title,status,locale,country_id,dojo_id,legal_text,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))")
    .eq("access_token", token)
    .maybeSingle<Record<string, unknown>>();

  if (form.error || !form.data) {
    notFound();
  }

  if (String(form.data.status) !== "active") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="border border-[var(--line)] bg-white p-8 text-[var(--accent)]">
          {locale === "es"
            ? "Este formulario ya no esta disponible."
            : "This form is no longer available."}
        </div>
      </section>
    );
  }

  return <RequestFormPage locale={locale} token={token} form={form.data as never} />;
}
