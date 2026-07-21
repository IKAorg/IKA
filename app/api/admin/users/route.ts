import { NextResponse, type NextRequest } from "next/server";
import {
  normalizeEmail,
  normalizeText,
  requireScopedAdmin,
  type AdminScope as SharedAdminScope,
  type SupabaseAdminClient,
} from "@/lib/admin/request-forms";

type AssignableRoleKey = "global_admin" | "country_admin" | "dojo_admin";

type ScopeAssignment = {
  country_id: string | null;
  dojo_id: string | null;
  roles: { key: string } | Array<{ key: string }> | null;
};

type AdminAssignment = {
  id: string;
  profile_id: string;
  role_id: string;
  country_id: string | null;
  dojo_id: string | null;
  roles: unknown;
  countries: unknown;
  dojos: unknown;
};

type AdminScope = {
  profileId: string;
  roleProfileIds?: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

type GuardResult =
  | { ok: true; admin: SupabaseAdminClient; scope: AdminScope }
  | { ok: false; response: NextResponse };

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);

  if (!guard.ok) {
    return guard.response;
  }

  const assignableRoles = getAssignableRoles(guard.scope);
  const [roles, countries, dojos, profiles, assignments, members] = await Promise.all([
    guard.admin
      .from("roles")
      .select("id,key,name")
      .in("key", assignableRoles)
      .order("name", { ascending: true }),
    guard.admin
      .from("countries")
      .select("id,code,country_translations(language_code,name)")
      .order("code", { ascending: true }),
    guard.admin
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
    guard.admin
      .from("users_profiles")
      .select("id,email,display_name,status")
      .order("email", { ascending: true }),
    guard.admin
      .from("user_roles")
      .select(
        "id,profile_id,role_id,country_id,dojo_id,roles(key,name),countries(id,code,country_translations(language_code,name)),dojos(id,country_id,city,dojo_translations(language_code,name))",
      )
      .order("created_at", { ascending: false }),
    guard.admin
      .from("members")
      .select("profile_id,email,ika_number,first_name,last_name,country_id,dojo_id"),
  ]);

  const error =
    roles.error ??
    countries.error ??
    dojos.error ??
    profiles.error ??
    assignments.error ??
    members.error;

  if (error) {
    return jsonError(error.message, 500);
  }

  const scopedDojos = scopeDojos(dojos.data ?? [], guard.scope);
  const scopedCountries = scopeCountries(
    countries.data ?? [],
    guard.scope,
    scopedDojos,
  );
  const scopedAssignments = scopeAssignments(
    normalizeAssignments(assignments.data ?? []),
    guard.scope,
    dojos.data ?? [],
  );
  const visibleProfileIds = new Set(
    scopedAssignments.map((assignment) => assignment.profile_id),
  );
  const memberRows = (members.data ?? []) as Array<{
    profile_id: string | null;
    email: string | null;
    ika_number: string | null;
    first_name: string | null;
    last_name: string | null;
  }>;
  const visibleProfiles = (profiles.data ?? []).filter((profile) =>
    visibleProfileIds.has(profile.id as string),
  );

  return NextResponse.json({
    profiles: visibleProfiles.map((profile) => {
      const profileEmail = normalizeEmail(profile.email);
      const linkedMembers = memberRows.filter(
        (member) =>
          member.profile_id === profile.id ||
          (profileEmail && normalizeEmail(member.email) === profileEmail),
      );

      return {
        ...profile,
        kenshiIds: linkedMembers
          .map((member) => member.ika_number)
          .filter((value): value is string => Boolean(value)),
        kenshiNames: linkedMembers
          .map((member) =>
            [member.first_name, member.last_name].filter(Boolean).join(" ").trim(),
          )
          .filter(Boolean),
      };
    }),
    roles: roles.data ?? [],
    assignments: scopedAssignments,
    countries: scopedCountries,
    dojos: scopedDojos,
    assignableRoles,
    scope: guard.scope,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);

  if (!guard.ok) {
    return guard.response;
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const displayName = normalizeText(body?.displayName);
  const roleKey = normalizeText(body?.roleKey) as AssignableRoleKey;
  const countryId = normalizeOptionalId(body?.countryId);
  const dojoId = normalizeOptionalId(body?.dojoId);
  const locale = normalizeText(body?.locale) || "es";
  const sendInvite = body?.sendInvite !== false;
  const assignableRoles = getAssignableRoles(guard.scope);

  if (!email) {
    return jsonError("El email es obligatorio.", 400);
  }

  if (!assignableRoles.includes(roleKey)) {
    return jsonError("No puedes asignar ese rol con tu nivel de permisos.", 403);
  }

  const target = await validateTarget(
    guard.admin,
    guard.scope,
    roleKey,
    countryId,
    dojoId,
  );

  if (!target.ok) {
    return jsonError(target.error, 400);
  }

  let authUserId = await findAuthUserIdByEmail(guard.admin, email);
  let invited = false;

  if (!authUserId && sendInvite) {
    const invite = await guard.admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: buildPublicRedirectUrl(request, locale, "admin"),
    });

    if (invite.error) {
      return jsonError(invite.error.message, 400);
    }

    authUserId = invite.data.user?.id ?? null;
    invited = Boolean(authUserId);
  }

  const profilePayload: Record<string, string | null> = {
    email,
    display_name: displayName || email,
    status: invited ? "invited" : "active",
  };

  if (authUserId) {
    profilePayload.auth_user_id = authUserId;
  }

  const profile = await upsertProfileByEmail(guard.admin, profilePayload);

  if (!profile.ok) {
    return jsonError(profile.error, 500);
  }

  const role = await guard.admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .single<{ id: string }>();

  if (role.error || !role.data) {
    return jsonError(role.error?.message ?? "No se encontro el rol.", 500);
  }

  if (roleKey === "country_admin" && target.countryId) {
    const conflict = await findCountryAdminConflict(
      guard.admin,
      target.countryId,
      null,
    );

    if (conflict) {
      return jsonError(
        "Ese pais ya tiene un administrador de pais activo. Debes transferir el rol, no duplicarlo.",
        409,
      );
    }
  }

  const assignment = await guard.admin.from("user_roles").upsert(
    {
      profile_id: profile.id,
      role_id: role.data.id,
      country_id: roleKey === "country_admin" ? target.countryId : null,
      dojo_id: roleKey === "dojo_admin" ? target.dojoId : null,
      created_by: guard.scope.profileId,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  if (assignment.error) {
    return jsonError(assignment.error.message, 500);
  }

  return NextResponse.json({ ok: true, invited });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin(request);

  if (!guard.ok) {
    return guard.response;
  }

  const assignmentId = request.nextUrl.searchParams.get("id");

  if (!assignmentId) {
    return jsonError("Falta el rol asignado.", 400);
  }

  const assignment = await guard.admin
    .from("user_roles")
    .select("id,profile_id,country_id,dojo_id,roles(key)")
    .eq("id", assignmentId)
    .maybeSingle<ScopeAssignment & { id: string; profile_id: string }>();

  if (assignment.error || !assignment.data) {
    return jsonError(assignment.error?.message ?? "No se encontro el rol.", 404);
  }

  if (!canManageAssignment(guard.scope, assignment.data)) {
    return jsonError("No puedes quitar ese rol.", 403);
  }

  const deleted = await guard.admin
    .from("user_roles")
    .delete()
    .eq("id", assignmentId);

  if (deleted.error) {
    return jsonError(deleted.error.message, 500);
  }

  if (assignment.data.profile_id !== guard.scope.profileId) {
    await deleteEmptyUnlinkedProfile(guard.admin, assignment.data.profile_id);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(request);

  if (!guard.ok) {
    return guard.response;
  }

  const body = await request.json().catch(() => null);
  const assignmentId = normalizeOptionalId(body?.assignmentId);
  const roleKey = normalizeText(body?.roleKey) as AssignableRoleKey;
  const countryId = normalizeOptionalId(body?.countryId);
  const dojoId = normalizeOptionalId(body?.dojoId);
  const assignableRoles = getAssignableRoles(guard.scope);

  if (!assignmentId) {
    return jsonError("Falta la asignacion a editar.", 400);
  }

  if (!assignableRoles.includes(roleKey)) {
    return jsonError("No puedes asignar ese rol con tu nivel de permisos.", 403);
  }

  const currentAssignment = await guard.admin
    .from("user_roles")
    .select("id,profile_id,country_id,dojo_id,roles(key)")
    .eq("id", assignmentId)
    .maybeSingle<ScopeAssignment & { id: string; profile_id: string }>();

  if (currentAssignment.error || !currentAssignment.data) {
    return jsonError(
      currentAssignment.error?.message ?? "No se encontro el rol.",
      404,
    );
  }

  if (!canManageAssignment(guard.scope, currentAssignment.data)) {
    return jsonError("No puedes editar ese rol.", 403);
  }

  const target = await validateTarget(
    guard.admin,
    guard.scope,
    roleKey,
    countryId,
    dojoId,
  );

  if (!target.ok) {
    return jsonError(target.error, 400);
  }

  const role = await guard.admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .single<{ id: string }>();

  if (role.error || !role.data) {
    return jsonError(role.error?.message ?? "No se encontro el rol.", 500);
  }

  if (roleKey === "country_admin" && target.countryId) {
    const conflict = await findCountryAdminConflict(
      guard.admin,
      target.countryId,
      currentAssignment.data.profile_id,
    );

    if (conflict) {
      return jsonError(
        "Ese pais ya tiene un administrador de pais activo. Debes transferir el rol, no duplicarlo.",
        409,
      );
    }
  }

  const updated = await guard.admin
    .from("user_roles")
    .update({
      role_id: role.data.id,
      country_id: roleKey === "country_admin" ? target.countryId : null,
      dojo_id: roleKey === "dojo_admin" ? target.dojoId : null,
    })
    .eq("id", assignmentId);

  if (updated.error) {
    return jsonError(updated.error.message, 500);
  }

  return NextResponse.json({ ok: true });
}

async function requireAdmin(request: NextRequest): Promise<GuardResult> {
  const sharedGuard = await requireScopedAdmin(request);
  if ("error" in sharedGuard) {
    const failure = sharedGuard as { error: string; status: number };
    return {
      ok: false,
      response: jsonError(failure.error, failure.status),
    };
  }
  return {
    ok: true,
    admin: sharedGuard.admin,
    scope: mapSharedScope(sharedGuard.scope),
  };
}

function getAssignableRoles(scope: AdminScope): AssignableRoleKey[] {
  if (scope.isSuperAdmin) {
    return ["global_admin", "country_admin", "dojo_admin"];
  }

  if (scope.isGlobalAdmin) {
    return ["country_admin", "dojo_admin"];
  }

  if (scope.countryIds.length > 0) {
    return ["dojo_admin"];
  }

  return [];
}

async function validateTarget(
  admin: SupabaseAdminClient,
  scope: AdminScope,
  roleKey: AssignableRoleKey,
  countryId: string | null,
  dojoId: string | null,
): Promise<
  | { ok: true; countryId: string | null; dojoId: string | null }
  | { ok: false; error: string }
> {
  if (roleKey === "global_admin") {
    return scope.isSuperAdmin
      ? { ok: true, countryId: null, dojoId: null }
      : { ok: false, error: "Solo super admin puede crear admin global." };
  }

  if (roleKey === "country_admin") {
    if (!countryId) {
      return { ok: false, error: "Selecciona un pais." };
    }

    if (!scope.isSuperAdmin && !scope.isGlobalAdmin) {
      return { ok: false, error: "No puedes crear admins de pais." };
    }

    return { ok: true, countryId, dojoId: null };
  }

  if (!dojoId) {
    return { ok: false, error: "Selecciona un dojo." };
  }

  const dojo = await admin
    .from("dojos")
    .select("id,country_id")
    .eq("id", dojoId)
    .single<{ id: string; country_id: string }>();

  if (dojo.error || !dojo.data) {
    return { ok: false, error: dojo.error?.message ?? "No se encontro el dojo." };
  }

  if (
    !scope.isSuperAdmin &&
    !scope.isGlobalAdmin &&
    !scope.countryIds.includes(dojo.data.country_id)
  ) {
    return { ok: false, error: "No puedes crear admins en ese dojo." };
  }

  return { ok: true, countryId: dojo.data.country_id, dojoId };
}

function scopeCountries<T extends { id: string }, D extends { country_id: string }>(
  countries: T[],
  scope: AdminScope,
  dojos: D[],
) {
  if (scope.isSuperAdmin || scope.isGlobalAdmin) {
    return countries;
  }

  const countryIds = new Set([
    ...scope.countryIds,
    ...dojos.map((dojo) => dojo.country_id),
  ]);

  return countries.filter((country) => countryIds.has(country.id));
}

function scopeDojos<T extends { id: string; country_id: string }>(
  dojos: T[],
  scope: AdminScope,
) {
  if (scope.isSuperAdmin || scope.isGlobalAdmin) {
    return dojos;
  }

  return dojos.filter(
    (dojo) =>
      scope.countryIds.includes(dojo.country_id) ||
      scope.dojoIds.includes(dojo.id),
  );
}

function scopeAssignments<
  T extends { country_id: string | null; dojo_id: string | null },
  D extends { id: string; country_id: string },
>(assignments: T[], scope: AdminScope, dojos: D[]) {
  if (scope.isSuperAdmin || scope.isGlobalAdmin) {
    return assignments;
  }

  const countryByDojoId = new Map(dojos.map((dojo) => [dojo.id, dojo.country_id]));

  return assignments.filter((assignment) => {
    if (assignment.country_id && scope.countryIds.includes(assignment.country_id)) {
      return true;
    }

    if (assignment.dojo_id && scope.dojoIds.includes(assignment.dojo_id)) {
      return true;
    }

    const countryId = assignment.dojo_id
      ? countryByDojoId.get(assignment.dojo_id)
      : null;

    return countryId ? scope.countryIds.includes(countryId) : false;
  });
}

function canManageAssignment(scope: AdminScope, assignment: ScopeAssignment) {
  const roleKey = getRoleKey(assignment.roles);

  if (scope.isSuperAdmin) {
    return true;
  }

  if (roleKey === "global_admin" || roleKey === "country_admin") {
    return false;
  }

  if (scope.isGlobalAdmin) {
    return true;
  }

  return Boolean(
    (assignment.country_id && scope.countryIds.includes(assignment.country_id)) ||
      (assignment.dojo_id && scope.dojoIds.includes(assignment.dojo_id)),
  );
}

async function findAuthUserIdByEmail(
  admin: SupabaseAdminClient,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const users = await admin.auth.admin.listUsers({ page, perPage: 100 });

    if (users.error) {
      return null;
    }

    const user = users.data.users.find(
      (item) => item.email?.toLowerCase() === email,
    );

    if (user) {
      return user.id;
    }

    if (users.data.users.length < 100) {
      return null;
    }
  }

  return null;
}

async function upsertProfileByEmail(
  admin: SupabaseAdminClient,
  payload: Record<string, string | null>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const email = payload.email;

  if (!email) {
    return { ok: false, error: "El email es obligatorio." };
  }

  const upserted = await admin
    .from("users_profiles")
    .upsert(payload, { onConflict: "email" })
    .select("id")
    .limit(1);

  if (upserted.error) {
    return { ok: false, error: upserted.error.message };
  }

  const id = (upserted.data?.[0]?.id as string | undefined) ?? "";

  if (id) {
    return { ok: true, id };
  }

  const existing = await admin
    .from("users_profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (existing.error) {
    return { ok: false, error: existing.error.message };
  }

  const existingId = (existing.data?.[0]?.id as string | undefined) ?? "";

  return existingId
    ? { ok: true, id: existingId }
    : { ok: false, error: "No se pudo crear o recuperar el perfil." };
}

async function deleteEmptyUnlinkedProfile(
  admin: SupabaseAdminClient,
  profileId: string,
) {
  const remainingRoles = await admin
    .from("user_roles")
    .select("id")
    .eq("profile_id", profileId)
    .limit(1);

  if (remainingRoles.error || (remainingRoles.data?.length ?? 0) > 0) {
    return;
  }

  const linkedMember = await admin
    .from("members")
    .select("id")
    .eq("profile_id", profileId)
    .limit(1);

  if (linkedMember.error || (linkedMember.data?.length ?? 0) > 0) {
    return;
  }

  await admin.from("users_profiles").delete().eq("id", profileId);
}

function normalizeAssignments(rows: unknown[]) {
  return rows.map((row) => {
    const item = row as AdminAssignment;

    return {
      ...item,
      roles: firstRelation(item.roles),
      countries: firstRelation(item.countries),
      dojos: firstRelation(item.dojos),
    };
  });
}

function firstRelation(value: unknown) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getRoleKey(role: ScopeAssignment["roles"]) {
  return Array.isArray(role) ? role[0]?.key : role?.key;
}

function buildPublicRedirectUrl(
  request: NextRequest,
  locale: string,
  path: "admin" | "portal",
) {
  const explicitUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    "";
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "";
  const origin = request.nextUrl.origin;
  const baseUrl =
    explicitUrl ||
    vercelProductionUrl ||
    (isLocalOrigin(origin) ? "https://ika-po1s.vercel.app" : origin);

  return `${baseUrl.replace(/\/$/, "")}/${locale}/${path}`;
}

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function normalizeOptionalId(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function mapSharedScope(scope: SharedAdminScope): AdminScope {
  return {
    profileId: scope.profileId,
    roleProfileIds: scope.roleProfileIds,
    isSuperAdmin: scope.isSuperAdmin,
    isGlobalAdmin: scope.isGlobalAdmin,
    countryIds: scope.countryIds,
    dojoIds: scope.dojoIds,
    roleKeys: scope.roleKeys,
  };
}

async function findCountryAdminConflict(
  admin: SupabaseAdminClient,
  countryId: string,
  excludeProfileId: string | null,
) {
  const conflict = await admin
    .from("user_roles")
    .select("profile_id,roles(key)")
    .eq("country_id", countryId);

  if (conflict.error) {
    throw new Error(conflict.error.message);
  }

  return ((conflict.data ?? []) as Array<{
    profile_id: string;
    roles: { key: string } | Array<{ key: string }> | null;
  }>).find((assignment) => {
    const roleKey = Array.isArray(assignment.roles)
      ? assignment.roles[0]?.key
      : assignment.roles?.key;
    if (roleKey !== "country_admin") {
      return false;
    }
    if (!excludeProfileId) {
      return true;
    }
    return assignment.profile_id !== excludeProfileId;
  });
}
