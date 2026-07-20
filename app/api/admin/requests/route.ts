import { NextResponse, type NextRequest } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  canManageCountry,
  canManageDojo,
  normalizeEmail,
  normalizeText,
  requireScopedAdmin,
  slugify,
  type AdminScope,
  type SupabaseAdminClient,
} from "@/lib/admin/request-forms";

type FormType = "country" | "dojo" | "kenshi";
type SubmissionStatus = "pending" | "needs_info" | "approved" | "rejected";

type Body = {
  action?:
    | "create_form"
    | "toggle_form"
    | "delete_form"
    | "approve_submission"
    | "update_submission_status";
  formType?: FormType;
  formId?: string;
  submissionId?: string;
  status?: "active" | "inactive" | SubmissionStatus;
  locale?: string;
  title?: string;
  countryId?: string;
  dojoId?: string;
  legalText?: string;
  reviewNotes?: string;
  sendEmail?: boolean;
};

export async function GET(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const [formsResult, submissionsResult, countriesResult, dojosResult] = await Promise.all([
    guard.admin
      .from("request_forms")
      .select("id,form_type,title,status,locale,country_id,dojo_id,created_by,access_token,legal_text,created_at,updated_at"),
    guard.admin
      .from("request_submissions")
      .select("id,form_id,submission_type,status,locale,applicant_email,applicant_name,payload,consent_accepted,review_notes,approved_entity_id,reviewed_by,reviewed_at,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(500),
    guard.admin
      .from("countries")
      .select("id,code,country_translations(language_code,name)")
      .order("code", { ascending: true }),
    guard.admin
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
  ]);

  const firstError =
    formsResult.error ??
    submissionsResult.error ??
    countriesResult.error ??
    dojosResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const dojos = (dojosResult.data ?? []) as Array<{
    id: string;
    country_id: string;
    city: string;
    dojo_translations?: Array<{ language_code: string; name: string }>;
  }>;
  const countries = (countriesResult.data ?? []) as Array<{
    id: string;
    code: string;
    country_translations?: Array<{ language_code: string; name: string }>;
  }>;
  const forms = ((formsResult.data ?? []) as Array<Record<string, unknown>>).filter((form) =>
    canSeeForm(guard.scope, form, dojos),
  );
  const visibleFormIds = new Set(forms.map((form) => String(form.id)));
  const submissions = ((submissionsResult.data ?? []) as Array<Record<string, unknown>>).filter(
    (submission) => visibleFormIds.has(String(submission.form_id)),
  ).map((submission) => ({
    ...submission,
    payload: sanitizeSubmissionPayload(
      (submission.payload as Record<string, unknown> | null) ?? {},
    ),
  }));

  return NextResponse.json({
    forms,
    submissions,
    countries: countries.filter((country) => canManageCountry(guard.scope, country.id)),
    dojos: dojos.filter((dojo) => canManageDojo(guard.scope, dojo.id, dojo.country_id)),
    permissions: {
      canCreateCountryForms: guard.scope.isSuperAdmin,
      canCreateDojoForms:
        guard.scope.isSuperAdmin || guard.scope.isGlobalAdmin || guard.scope.countryIds.length > 0,
      canCreateKenshiForms:
        guard.scope.isSuperAdmin ||
        guard.scope.isGlobalAdmin ||
        guard.scope.countryIds.length > 0 ||
        guard.scope.dojoIds.length > 0,
    },
    scope: guard.scope,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = (await request.json().catch(() => null)) as Body | null;

  if (body?.action === "create_form") {
    return createForm(guard.admin, guard.scope, request, body);
  }

  if (body?.action === "toggle_form") {
    return toggleForm(guard.admin, guard.scope, body);
  }

  if (body?.action === "delete_form") {
    return deleteForm(guard.admin, guard.scope, body);
  }

  if (body?.action === "approve_submission") {
    return approveSubmission(guard.admin, guard.scope, request, body);
  }

  if (body?.action === "update_submission_status") {
    return updateSubmissionStatus(guard.admin, guard.scope, body);
  }

  return NextResponse.json({ error: "Accion no valida." }, { status: 400 });
}

async function createForm(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  request: NextRequest,
  body: Body,
) {
  const formType = body.formType;
  if (!formType) {
    return NextResponse.json({ error: "Tipo de formulario obligatorio." }, { status: 400 });
  }

  if (formType === "country" && !scope.isSuperAdmin) {
    return NextResponse.json({ error: "Solo super admin puede crear formularios de pais." }, { status: 403 });
  }

  if (formType === "dojo") {
    const countryId = normalizeText(body.countryId);
    if (!countryId || !canManageCountry(scope, countryId)) {
      return NextResponse.json({ error: "Debes elegir un pais dentro de tu ambito." }, { status: 403 });
    }
  }

  if (formType === "kenshi") {
    const dojoId = normalizeText(body.dojoId);
    if (!dojoId) {
      return NextResponse.json({ error: "Debes elegir un dojo para el formulario Kenshi." }, { status: 400 });
    }
    const dojo = await admin.from("dojos").select("id,country_id").eq("id", dojoId).maybeSingle<{id:string;country_id:string}>();
    if (dojo.error || !dojo.data || !canManageDojo(scope, dojo.data.id, dojo.data.country_id)) {
      return NextResponse.json({ error: "Ese dojo no pertenece a tu ambito." }, { status: 403 });
    }
  }

  const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const locale = normalizeText(body.locale) || "en";
  const inserted = await admin
    .from("request_forms")
    .insert({
      form_type: formType,
      title: normalizeText(body.title) || defaultTitle(formType, locale),
      status: "active",
      locale,
      country_id: formType === "dojo" ? normalizeText(body.countryId) : null,
      dojo_id: formType === "kenshi" ? normalizeText(body.dojoId) : null,
      created_by: scope.profileId,
      access_token: token,
      legal_text: normalizeText(body.legalText) || defaultLegalText(locale),
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    return NextResponse.json({ error: inserted.error?.message ?? "No se pudo crear el formulario." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    form: inserted.data,
    publicUrl: `${request.nextUrl.origin}/${locale}/requests/${token}`,
  });
}

async function toggleForm(admin: SupabaseAdminClient, scope: AdminScope, body: Body) {
  const form = await getManagedForm(admin, scope, body.formId ?? "");
  if ("error" in form) {
    return NextResponse.json({ error: form.error }, { status: form.status });
  }

  const status = body.status === "inactive" ? "inactive" : "active";
  const updated = await admin
    .from("request_forms")
    .update({ status })
    .eq("id", String(form.data.id))
    .select("*")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, form: updated.data });
}

async function deleteForm(admin: SupabaseAdminClient, scope: AdminScope, body: Body) {
  const form = await getManagedForm(admin, scope, body.formId ?? "");
  if ("error" in form) {
    return NextResponse.json({ error: form.error }, { status: form.status });
  }

  const deleted = await admin
    .from("request_forms")
    .delete()
    .eq("id", String(form.data.id));

  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deletedFormId: String(form.data.id),
  });
}

async function updateSubmissionStatus(admin: SupabaseAdminClient, scope: AdminScope, body: Body) {
  const submission = await getManagedSubmission(admin, scope, body.submissionId ?? "");
  if ("error" in submission) {
    return NextResponse.json({ error: submission.error }, { status: submission.status });
  }

  const status = body.status === "rejected" ? "rejected" : "needs_info";
  const updated = await admin
    .from("request_submissions")
    .update({
      status,
      review_notes: normalizeText(body.reviewNotes),
      reviewed_by: scope.profileId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", String(submission.data.id))
    .select("*")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submission: updated.data });
}

async function approveSubmission(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  request: NextRequest,
  body: Body,
) {
  const submission = await getManagedSubmission(admin, scope, body.submissionId ?? "");
  if ("error" in submission) {
    return NextResponse.json({ error: submission.error }, { status: submission.status });
  }

  const form = (submission as { data: Record<string, unknown>; form: Record<string, unknown> }).form;
  const payload = ((submission.data.payload as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const applicantPassword = normalizeText(submission.data.applicant_password);

  if (submission.data.status === "approved") {
    return NextResponse.json({ error: "Esta solicitud ya esta aprobada." }, { status: 400 });
  }

  let approvedEntityId = "";
  let approvedEntityLabel = "";

  if (form.form_type === "country") {
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: "Solo super admin puede aprobar paises." }, { status: 403 });
    }
    const result = await createCountryFromSubmission(admin, scope, payload, submission.data.locale as string);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    approvedEntityId = result.countryId;
    approvedEntityLabel = result.ikaCountryId;
    if (result.profileEmail && applicantPassword) {
      await ensureScopedAdminUser(admin, result.profileEmail, applicantPassword, result.displayName, "country_admin", scope.profileId, result.countryId, null);
    }
  } else if (form.form_type === "dojo") {
    const result = await createDojoFromSubmission(admin, scope, form.country_id as string | null, payload, submission.data.locale as string);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    approvedEntityId = result.dojoId;
    approvedEntityLabel = result.ikaDojoId;
    if (result.profileEmail && applicantPassword) {
      await ensureScopedAdminUser(admin, result.profileEmail, applicantPassword, result.displayName, "dojo_admin", scope.profileId, null, result.dojoId);
    }
  } else {
    const result = await createKenshiFromSubmission(admin, scope, form.dojo_id as string | null, payload, submission.data.locale as string);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    approvedEntityId = result.memberId;
    approvedEntityLabel = result.ikaNumber;
  }

  const updated = await admin
    .from("request_submissions")
    .update({
      status: "approved",
      review_notes: normalizeText(body.reviewNotes),
      approved_entity_id: approvedEntityId,
      reviewed_by: scope.profileId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", String(submission.data.id))
    .select("*")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  if (body.sendEmail !== false) {
    const email = normalizeEmail(submission.data.applicant_email);
    if (email) {
      const publicClient = createPublicSupabaseClient();
      await publicClient?.auth.resetPasswordForEmail(email, {
        redirectTo: `${request.nextUrl.origin}/${submission.data.locale}/portal`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    submission: updated.data,
    approvedEntityLabel,
  });
}

async function createCountryFromSubmission(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  payload: Record<string, unknown>,
  locale: string,
) {
  const code = normalizeText(payload.countryCode).toUpperCase();
  const name = normalizeText(payload.countryName);
  if (!code || !name) {
    return { error: "La solicitud no contiene codigo y nombre de pais." };
  }

  const country = await admin
    .from("countries")
    .insert({
      code,
      status: "published",
      is_public: true,
      responsible_person: normalizeText(payload.responsiblePerson),
      representative_entity: normalizeText(payload.representativeEntity),
      responsible_email: normalizeEmail(payload.responsibleEmail) || null,
      created_by: scope.profileId,
      updated_by: scope.profileId,
    })
    .select("id,ika_country_id")
    .single<{ id: string; ika_country_id: string }>();

  if (country.error || !country.data) {
    return { error: country.error?.message ?? "No se pudo crear el pais." };
  }

  await upsertAllCountryTranslations(admin, country.data.id, locale, name, normalizeText(payload.description));

  return {
    countryId: country.data.id,
    ikaCountryId: country.data.ika_country_id,
    profileEmail: normalizeEmail(payload.email),
    displayName: normalizeText(payload.displayName) || name,
  };
}

async function createDojoFromSubmission(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  formCountryId: string | null,
  payload: Record<string, unknown>,
  locale: string,
) {
  const countryId = normalizeText(payload.countryId) || formCountryId || "";
  const city = normalizeText(payload.city);
  const name = normalizeText(payload.dojoName);
  if (!countryId || !city || !name) {
    return { error: "La solicitud no contiene pais, ciudad y nombre de dojo." };
  }
  if (!canManageCountry(scope, countryId)) {
    return { error: "No puedes aprobar un dojo fuera de tu pais." };
  }

  const dojo = await admin
    .from("dojos")
    .insert({
      country_id: countryId,
      city,
      address: normalizeText(payload.address) || null,
      responsible_instructor: normalizeText(payload.responsibleInstructor) || null,
      email: normalizeEmail(payload.contactEmail) || null,
      phone: normalizeText(payload.phone) || null,
      website: normalizeText(payload.website) || null,
      status: "published",
      is_public: true,
      created_by: scope.profileId,
      updated_by: scope.profileId,
    })
    .select("id,ika_dojo_id")
    .single<{ id: string; ika_dojo_id: string }>();

  if (dojo.error || !dojo.data) {
    return { error: dojo.error?.message ?? "No se pudo crear el dojo." };
  }

  await upsertAllDojoTranslations(admin, dojo.data.id, locale, name, normalizeText(payload.description));

  return {
    dojoId: dojo.data.id,
    ikaDojoId: dojo.data.ika_dojo_id,
    profileEmail: normalizeEmail(payload.email),
    displayName: normalizeText(payload.displayName) || name,
  };
}

async function createKenshiFromSubmission(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  formDojoId: string | null,
  payload: Record<string, unknown>,
  _locale: string,
) {
  const dojoId = normalizeText(payload.dojoId) || formDojoId || "";
  const dojo = await admin.from("dojos").select("id,country_id").eq("id", dojoId).maybeSingle<{id:string;country_id:string}>();
  if (dojo.error || !dojo.data || !canManageDojo(scope, dojo.data.id, dojo.data.country_id)) {
    return { error: "No puedes aprobar Kenshi fuera de tu dojo o pais." };
  }

  const email = normalizeEmail(payload.email);
  const password = normalizeText(payload.password);
  const firstName = normalizeText(payload.firstName);
  const lastName = normalizeText(payload.lastName);

  if (!firstName || !lastName || !email || !password) {
    return { error: "La solicitud Kenshi necesita nombre, apellidos, email y contrasena." };
  }

  const authUserId = await ensureAuthUser(admin, email, password, `${firstName} ${lastName}`.trim());
  const profileId = await upsertProfile(admin, email, `${firstName} ${lastName}`.trim(), authUserId);
  const roleId = await getRoleId(admin, "kenshi");

  await admin.from("user_roles").upsert(
    {
      profile_id: profileId,
      role_id: roleId,
      country_id: null,
      dojo_id: null,
      created_by: scope.profileId,
    },
    { onConflict: "profile_id,role_id,country_id,dojo_id", ignoreDuplicates: true },
  );

  const existing = await admin
    .from("members")
    .select("id,ika_number")
    .eq("email", email)
    .maybeSingle<{ id: string; ika_number: string }>();

  if (existing.data) {
    return { memberId: existing.data.id, ikaNumber: existing.data.ika_number };
  }

  const inserted = await admin
    .from("members")
    .insert({
      profile_id: profileId,
      external_member_id: normalizeText(payload.externalMemberId) || null,
      first_name: firstName,
      last_name: lastName,
      birth_date: normalizeText(payload.birthDate) || null,
      country_id: dojo.data.country_id,
      dojo_id: dojo.data.id,
      main_instructor: normalizeText(payload.mainInstructor) || null,
      email,
      phone: normalizeText(payload.phone) || null,
      joined_date: normalizeText(payload.joinedDate) || null,
      status: "active",
      current_grade: normalizeText(payload.currentGrade) || null,
      internal_notes: normalizeText(payload.notes) || null,
      member_group: normalizeText(payload.memberGroup) || null,
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
      privacy_policy_version: "IKA-INTL-2026-07",
      created_by: scope.profileId,
      updated_by: scope.profileId,
    })
    .select("id,ika_number")
    .single<{ id: string; ika_number: string }>();

  if (inserted.error || !inserted.data) {
    return { error: inserted.error?.message ?? "No se pudo crear el Kenshi." };
  }

  return { memberId: inserted.data.id, ikaNumber: inserted.data.ika_number };
}

async function ensureScopedAdminUser(
  admin: SupabaseAdminClient,
  email: string,
  password: string,
  displayName: string,
  roleKey: "country_admin" | "dojo_admin",
  createdBy: string,
  countryId: string | null,
  dojoId: string | null,
) {
  const authUserId = await ensureAuthUser(admin, email, password, displayName);
  const profileId = await upsertProfile(admin, email, displayName, authUserId);
  const roleId = await getRoleId(admin, roleKey);
  await admin.from("user_roles").upsert(
    {
      profile_id: profileId,
      role_id: roleId,
      country_id: roleKey === "country_admin" ? countryId : null,
      dojo_id: roleKey === "dojo_admin" ? dojoId : null,
      created_by: createdBy,
    },
    { onConflict: "profile_id,role_id,country_id,dojo_id", ignoreDuplicates: true },
  );
}

async function ensureAuthUser(
  admin: SupabaseAdminClient,
  email: string,
  password: string,
  displayName: string,
) {
  let foundId = "";
  for (let page = 1; page <= 10; page += 1) {
    const users = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (users.error) break;
    const user = users.data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) {
      foundId = user.id;
      break;
    }
    if (users.data.users.length < 100) {
      break;
    }
  }

  if (foundId) {
    await admin.auth.admin.updateUserById(foundId, {
      password,
      user_metadata: { display_name: displayName },
    });
    return foundId;
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "No se pudo crear el usuario de acceso.");
  }

  return created.data.user.id;
}

async function upsertProfile(
  admin: SupabaseAdminClient,
  email: string,
  displayName: string,
  authUserId: string,
) {
  const profile = await admin
    .from("users_profiles")
    .upsert(
      {
        email,
        display_name: displayName,
        auth_user_id: authUserId,
        status: "active",
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (profile.error || !profile.data) {
    throw new Error(profile.error?.message ?? "No se pudo actualizar el perfil.");
  }

  return profile.data.id;
}

async function getRoleId(admin: SupabaseAdminClient, roleKey: string) {
  const role = await admin.from("roles").select("id").eq("key", roleKey).single<{ id: string }>();
  if (role.error || !role.data) {
    throw new Error(role.error?.message ?? `No se encontro el rol ${roleKey}.`);
  }
  return role.data.id;
}

async function upsertAllCountryTranslations(
  admin: SupabaseAdminClient,
  countryId: string,
  locale: string,
  name: string,
  description: string,
) {
  const languageRows = await admin.from("languages").select("code").eq("is_active", true);
  const languages = (languageRows.data ?? []).map((row) => String(row.code));
  const baseSlug = slugify(name || "country");
  await Promise.all(
    languages.map((code) =>
      admin.from("country_translations").upsert(
        {
          country_id: countryId,
          language_code: code,
          name,
          slug: code === locale ? baseSlug : `${baseSlug}-${code}`,
          description: description || null,
        },
        { onConflict: "country_id,language_code" },
      ),
    ),
  );
}

async function upsertAllDojoTranslations(
  admin: SupabaseAdminClient,
  dojoId: string,
  locale: string,
  name: string,
  description: string,
) {
  const languageRows = await admin.from("languages").select("code").eq("is_active", true);
  const languages = (languageRows.data ?? []).map((row) => String(row.code));
  const baseSlug = slugify(name || "dojo");
  await Promise.all(
    languages.map((code) =>
      admin.from("dojo_translations").upsert(
        {
          dojo_id: dojoId,
          language_code: code,
          name,
          slug: code === locale ? baseSlug : `${baseSlug}-${code}`,
          description: description || null,
        },
        { onConflict: "dojo_id,language_code" },
      ),
    ),
  );
}

async function getManagedForm(admin: SupabaseAdminClient, scope: AdminScope, formId: string) {
  const form = await admin.from("request_forms").select("*").eq("id", formId).maybeSingle<Record<string, unknown>>();
  if (form.error || !form.data) {
    return { error: form.error?.message ?? "Formulario no encontrado.", status: 404 as const };
  }

  const dojoCountryId =
    form.data.dojo_id
      ? (
          await admin
            .from("dojos")
            .select("country_id")
            .eq("id", String(form.data.dojo_id))
            .maybeSingle<{ country_id: string }>()
        ).data?.country_id ?? null
      : null;
  if (!canSeeForm(scope, form.data, dojoCountryId ? [{ id: String(form.data.dojo_id), country_id: dojoCountryId }] : [])) {
    return { error: "No puedes gestionar este formulario.", status: 403 as const };
  }

  return { data: form.data };
}

async function getManagedSubmission(admin: SupabaseAdminClient, scope: AdminScope, submissionId: string) {
  const submission = await admin
    .from("request_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle<Record<string, unknown>>();

  if (submission.error || !submission.data) {
    return { error: submission.error?.message ?? "Solicitud no encontrada.", status: 404 as const };
  }

  const form = await getManagedForm(admin, scope, String(submission.data.form_id));
  if ("error" in form) {
    return form;
  }

  return { data: submission.data, form: form.data };
}

function canSeeForm(
  scope: AdminScope,
  form: Record<string, unknown>,
  dojos: Array<{ id: string; country_id: string }>,
) {
  if (scope.isSuperAdmin || scope.isGlobalAdmin) {
    return true;
  }

  const formCountryId = normalizeText(form.country_id);
  if (formCountryId && scope.countryIds.includes(formCountryId)) {
    return true;
  }

  const formDojoId = normalizeText(form.dojo_id);
  if (formDojoId && scope.dojoIds.includes(formDojoId)) {
    return true;
  }

  if (formDojoId) {
    const dojo = dojos.find((item) => item.id === formDojoId);
    if (dojo?.country_id && scope.countryIds.includes(dojo.country_id)) {
      return true;
    }
  }

  return false;
}

function defaultTitle(formType: FormType, locale: string) {
  const isEs = locale === "es";
  if (formType === "country") return isEs ? "Solicitud interna de pais IKA" : "IKA internal country request";
  if (formType === "dojo") return isEs ? "Solicitud interna de dojo IKA" : "IKA internal dojo request";
  return isEs ? "Solicitud interna de Kenshi IKA" : "IKA internal Kenshi request";
}

function defaultLegalText(locale: string) {
  if (locale === "es") {
    return "Acepto el tratamiento internacional de mis datos personales por parte de IKA exclusivamente para fines organizativos, de membresia y comunicacion interna.";
  }
  return "I accept the international processing of my personal data by IKA solely for organisational, membership, and internal communication purposes.";
}

function sanitizeSubmissionPayload(payload: Record<string, unknown>) {
  const next = { ...payload };
  delete next.password;
  return next;
}
