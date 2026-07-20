import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, normalizeEmail, normalizeText, slugify } from "@/lib/admin/request-forms";

type SubmissionBody = {
  locale?: string;
  applicantName?: string;
  email?: string;
  password?: string;
  payload?: Record<string, unknown>;
  consentAccepted?: boolean;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Falta configuracion Supabase." }, { status: 500 });
  }

  const { token } = await context.params;
  const form = await admin
    .from("request_forms")
    .select("id,form_type,title,status,locale,country_id,dojo_id,legal_text,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))")
    .eq("access_token", token)
    .maybeSingle<Record<string, unknown>>();

  if (form.error || !form.data) {
    return NextResponse.json({ error: "Formulario no encontrado." }, { status: 404 });
  }

  if (String(form.data.status) !== "active") {
    return NextResponse.json({ error: "Este formulario ya no esta disponible." }, { status: 410 });
  }

  return NextResponse.json({
    form: form.data,
    fields: getFormFields(String(form.data.form_type)),
  });
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Falta configuracion Supabase." }, { status: 500 });
  }

  const { token } = await context.params;
  const body = (await _request.json().catch(() => null)) as SubmissionBody | null;
  const form = await admin
    .from("request_forms")
    .select("id,form_type,status,locale,country_id,dojo_id")
    .eq("access_token", token)
    .maybeSingle<Record<string, unknown>>();

  if (form.error || !form.data) {
    return NextResponse.json({ error: "Formulario no encontrado." }, { status: 404 });
  }

  if (String(form.data.status) !== "active") {
    return NextResponse.json({ error: "Este formulario no acepta mas respuestas." }, { status: 410 });
  }

  const locale = normalizeText(body?.locale) || String(form.data.locale || "en");
  const payload = sanitizePayload(String(form.data.form_type), body?.payload ?? {}, form.data);
  const email = normalizeEmail(body?.email || payload.email);
  const password = normalizeText(body?.password || payload.password);

  if (!body?.consentAccepted) {
    return NextResponse.json({ error: locale === "es" ? "Debes aceptar el consentimiento legal." : "You must accept the legal consent." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: locale === "es" ? "Email y contrasena obligatorios." : "Email and password are required." }, { status: 400 });
  }

  const inserted = await admin
    .from("request_submissions")
    .insert({
      form_id: form.data.id,
      submission_type: form.data.form_type,
      status: "pending",
      locale,
      applicant_email: email,
      applicant_password: password,
      applicant_name: normalizeText(body?.applicantName) || normalizeText(payload.displayName) || [payload.firstName, payload.lastName].filter(Boolean).join(" "),
      payload,
      consent_accepted: true,
    })
    .select("id,status,created_at")
    .single();

  if (inserted.error || !inserted.data) {
    return NextResponse.json({ error: inserted.error?.message ?? "No se pudo guardar la solicitud." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submission: inserted.data });
}

function sanitizePayload(
  formType: string,
  raw: Record<string, unknown>,
  form: Record<string, unknown>,
) {
  if (formType === "country") {
    return {
      email: normalizeEmail(raw.email),
      password: normalizeText(raw.password),
      displayName: normalizeText(raw.displayName),
      countryCode: normalizeText(raw.countryCode).toUpperCase(),
      countryName: normalizeText(raw.countryName),
      responsiblePerson: normalizeText(raw.responsiblePerson),
      representativeEntity: normalizeText(raw.representativeEntity),
      responsibleEmail: normalizeEmail(raw.responsibleEmail),
      description: normalizeText(raw.description),
      notes: normalizeText(raw.notes),
    };
  }

  if (formType === "dojo") {
    return {
      email: normalizeEmail(raw.email),
      password: normalizeText(raw.password),
      displayName: normalizeText(raw.displayName),
      countryId: normalizeText(raw.countryId) || normalizeText(form.country_id),
      dojoName: normalizeText(raw.dojoName),
      city: normalizeText(raw.city),
      address: normalizeText(raw.address),
      responsibleInstructor: normalizeText(raw.responsibleInstructor),
      contactEmail: normalizeEmail(raw.contactEmail || raw.email),
      phone: normalizeText(raw.phone),
      website: normalizeText(raw.website),
      description: normalizeText(raw.description),
      notes: normalizeText(raw.notes),
    };
  }

  return {
    email: normalizeEmail(raw.email),
    password: normalizeText(raw.password),
    dojoId: normalizeText(raw.dojoId) || normalizeText(form.dojo_id),
    firstName: normalizeText(raw.firstName),
    lastName: normalizeText(raw.lastName),
    birthDate: normalizeText(raw.birthDate),
    joinedDate: normalizeText(raw.joinedDate),
    currentGrade: normalizeText(raw.currentGrade),
    phone: normalizeText(raw.phone),
    mainInstructor: normalizeText(raw.mainInstructor),
    memberGroup: normalizeText(raw.memberGroup),
    externalMemberId: normalizeText(raw.externalMemberId),
    notes: normalizeText(raw.notes),
    displayName: normalizeText(raw.displayName) || `${normalizeText(raw.firstName)} ${normalizeText(raw.lastName)}`.trim(),
  };
}

function getFormFields(formType: string) {
  if (formType === "country") {
    return ["displayName", "email", "password", "countryCode", "countryName", "responsiblePerson", "representativeEntity", "responsibleEmail", "description", "notes"];
  }
  if (formType === "dojo") {
    return ["displayName", "email", "password", "dojoName", "city", "address", "responsibleInstructor", "contactEmail", "phone", "website", "description", "notes"];
  }
  return ["email", "password", "firstName", "lastName", "birthDate", "joinedDate", "currentGrade", "phone", "mainInstructor", "memberGroup", "externalMemberId", "notes"];
}
