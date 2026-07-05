import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

type ScopeRole = {
  country_id: string | null;
  dojo_id: string | null;
  roles: { key: string } | Array<{ key: string }> | null;
};
type UntypedTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};
type UntypedDatabase = {
  public: {
    Tables: Record<string, UntypedTable>;
    Views: Record<string, UntypedTable>;
    Functions: Record<string, never>;
  };
};
type SupabaseAdminClient = ReturnType<
  typeof createServiceClient<UntypedDatabase, "public", "public">
>;

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

type ImportRow = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryId?: string;
  countryCode?: string;
  countryName?: string;
  dojoId?: string;
  dojoName?: string;
  birthDate?: string;
  joinedDate?: string;
  currentGrade?: string;
  status?: string;
  mainInstructor?: string;
  guardianName?: string;
  guardianEmail?: string;
  isMinor?: boolean | string;
  notes?: string;
  memberGroup?: string;
};

type MemberPatchBody = {
  action?: string;
  memberId?: string;
  member?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    currentGrade?: string;
    joinedDate?: string;
    birthDate?: string;
    status?: string;
    memberGroup?: string;
    mainInstructor?: string;
    guardianName?: string;
    guardianEmail?: string;
    notes?: string;
  };
};

export async function GET(request: NextRequest) {
  const guard = await requireMembersAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const [countriesResult, dojosResult, membersResult] = await Promise.all([
    guard.admin
      .from("countries")
      .select("id,code,country_translations(language_code,name)")
      .order("code", { ascending: true }),
    guard.admin
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
    guard.admin
      .from("members")
      .select(
        "id,ika_number,first_name,last_name,email,phone,status,current_grade,birth_date,joined_date,main_instructor,guardian_name,guardian_email,internal_notes,member_group,country_id,dojo_id,portal_invite_sent_at,portal_invite_sent_to,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const firstError =
    countriesResult.error ?? dojosResult.error ?? membersResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const countries = filterCountriesByScope(
    countriesResult.data ?? [],
    guard.scope,
  );
  const readiness = await getAdminReadiness(guard.admin);
  let dojosData = dojosResult.data ?? [];

  if (guard.scope.isGlobal && dojosData.length === 0) {
    const fallbackDojos = await guard.admin
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)");

    if (!fallbackDojos.error) {
      dojosData = fallbackDojos.data ?? [];
    }
  }

  const dojos = filterDojosByScope(dojosData, guard.scope).map(
    (dojo) => ({
      ...dojo,
      has_country_admin: readiness.countryIdsWithAdmin.has(dojo.country_id),
      has_dojo_admin: readiness.dojoIdsWithAdmin.has(dojo.id),
    }),
  );
  const members = filterMembersByScope(membersResult.data ?? [], guard.scope);

  return NextResponse.json({
    countries,
    dojos,
    members,
    scope: guard.scope,
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireMembersAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const body = (await request.json().catch(() => null)) as MemberPatchBody | null;

  if (!body?.memberId) {
    return NextResponse.json(
      { error: "Kenshi no valido." },
      { status: 400 },
    );
  }

  const member = await guard.admin
    .from("members")
    .select("id,profile_id,first_name,last_name,email,country_id,dojo_id")
    .eq("id", body.memberId)
    .maybeSingle<{
      id: string;
      profile_id: string | null;
      first_name: string;
      last_name: string;
      email: string | null;
      country_id: string | null;
      dojo_id: string | null;
    }>();

  if (member.error) {
    return NextResponse.json({ error: member.error.message }, { status: 500 });
  }

  if (!member.data) {
    return NextResponse.json(
      { error: "No se encontro el Kenshi." },
      { status: 404 },
    );
  }

  if (
    !member.data.country_id ||
    !member.data.dojo_id ||
    !canManageTarget(guard.scope, member.data.country_id, member.data.dojo_id)
  ) {
    return NextResponse.json(
      { error: "No tienes permisos para modificar este Kenshi." },
      { status: 403 },
    );
  }

  if (body.action === "update_member") {
    const input = body.member ?? {};
    const firstName = normalizeText(input.firstName);
    const lastName = normalizeText(input.lastName);
    const status = normalizeMemberStatus(input.status);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Nombre y apellidos son obligatorios." },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Estado no valido." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(input.email) || null;
    const updated = await guard.admin
      .from("members")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: normalizeText(input.phone) || null,
        current_grade: normalizeText(input.currentGrade) || null,
        birth_date: normalizeDate(normalizeText(input.birthDate)),
        joined_date: normalizeDate(normalizeText(input.joinedDate)),
        status,
        member_group: normalizeMemberGroup(input.memberGroup),
        main_instructor: normalizeText(input.mainInstructor) || null,
        guardian_name: normalizeText(input.guardianName) || null,
        guardian_email: normalizeEmail(input.guardianEmail) || null,
        internal_notes: normalizeText(input.notes) || null,
        updated_by: guard.profileId,
      })
      .eq("id", member.data.id)
      .select(
        "id,ika_number,first_name,last_name,email,phone,status,current_grade,birth_date,joined_date,main_instructor,guardian_name,guardian_email,internal_notes,member_group,country_id,dojo_id,portal_invite_sent_at,portal_invite_sent_to,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json(
        { error: updated.error?.message ?? "No se pudo actualizar el Kenshi." },
        { status: 500 },
      );
    }

    if (member.data.profile_id && email) {
      await guard.admin
        .from("users_profiles")
        .update({
          email,
          display_name: `${firstName} ${lastName}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.data.profile_id);
    }

    return NextResponse.json({ ok: true, member: updated.data });
  }

  if (body.action !== "send_portal_invite") {
    return NextResponse.json(
      { error: "Accion no valida." },
      { status: 400 },
    );
  }

  if (!member.data.email) {
    return NextResponse.json(
      { error: "Este Kenshi no tiene email para enviar invitacion." },
      { status: 400 },
    );
  }

  let authUserId = await findAuthUserIdByEmail(guard.admin, member.data.email);

  if (!authUserId) {
    const invite = await guard.admin.auth.admin.inviteUserByEmail(member.data.email, {
      redirectTo: buildPublicRedirectUrl(request, "es", "portal"),
    });

    if (invite.error) {
      return NextResponse.json({ error: invite.error.message }, { status: 500 });
    }

    authUserId = invite.data.user?.id ?? null;
  }

  const profile = await guard.admin
    .from("users_profiles")
    .upsert(
      {
        email: member.data.email,
        display_name: `${member.data.first_name} ${member.data.last_name}`,
        auth_user_id: authUserId,
        status: authUserId ? "invited" : "active",
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (profile.error || !profile.data) {
    return NextResponse.json(
      { error: profile.error?.message ?? "No se pudo actualizar el perfil." },
      { status: 500 },
    );
  }

  const kenshiRole = await guard.admin
    .from("roles")
    .select("id")
    .eq("key", "kenshi")
    .single<{ id: string }>();

  if (kenshiRole.error || !kenshiRole.data) {
    return NextResponse.json(
      { error: kenshiRole.error?.message ?? "No se encontro el rol Kenshi." },
      { status: 500 },
    );
  }

  const role = await guard.admin.from("user_roles").upsert(
    {
      profile_id: profile.data.id,
      role_id: kenshiRole.data.id,
      country_id: member.data.country_id,
      dojo_id: member.data.dojo_id,
      created_by: guard.profileId,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  if (role.error) {
    return NextResponse.json({ error: role.error.message }, { status: 500 });
  }

  const updated = await guard.admin
    .from("members")
    .update({
      profile_id: profile.data.id,
      portal_invite_sent_at: new Date().toISOString(),
      portal_invite_sent_to: member.data.email,
      portal_invite_sent_by: guard.profileId,
      updated_by: guard.profileId,
    })
    .eq("id", member.data.id)
    .select("id,portal_invite_sent_at,portal_invite_sent_to")
    .single<{
      id: string;
      portal_invite_sent_at: string | null;
      portal_invite_sent_to: string | null;
    }>();

  if (updated.error || !updated.data) {
    return NextResponse.json(
      { error: updated.error?.message ?? "No se pudo registrar la invitacion." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    member: updated.data,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireMembersAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.rows) ? (body.rows as ImportRow[]) : [];

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No hay filas Kenshi para importar." },
      { status: 400 },
    );
  }

  if (rows.length > 500) {
    return NextResponse.json(
      { error: "Importa como maximo 500 Kenshi por lote." },
      { status: 400 },
    );
  }

  const [countriesResult, dojosResult] = await Promise.all([
    guard.admin
      .from("countries")
      .select("id,code,country_translations(language_code,name)"),
    guard.admin
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)"),
  ]);

  const firstError = countriesResult.error ?? dojosResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const countries = countriesResult.data ?? [];
  const dojos = dojosResult.data ?? [];
  const readiness = await getAdminReadiness(guard.admin);
  const result = {
    imported: 0,
    invited: 0,
    skipped: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber = index + 1;
    const row = normalizeImportRow(rawRow);

    if (!row.firstName || !row.lastName) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error: "Nombre y apellido son obligatorios.",
      });
      continue;
    }

    if (row.status && !isActiveImportStatus(row.status)) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error: `Kenshi omitido por estado: ${row.status}.`,
      });
      continue;
    }

    const country = resolveCountry(countries, row);
    const dojo = resolveDojo(dojos, row, country?.id ?? null);
    const countryId = country?.id ?? dojo?.country_id ?? null;
    const dojoId = dojo?.id ?? null;

    if (!dojoId) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error:
          "El volcado masivo debe estar asignado a un dojo existente.",
      });
      continue;
    }

    if (!countryId) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error: "El dojo debe pertenecer a un pais existente.",
      });
      continue;
    }

    if (!canManageTarget(guard.scope, countryId, dojoId)) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error: "No tienes permisos para ese pais o dojo.",
      });
      continue;
    }

    if (!readiness.countryIdsWithAdmin.has(countryId)) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error:
          "Antes de importar Kenshi debe existir un administrador de pais.",
      });
      continue;
    }

    if (!readiness.dojoIdsWithAdmin.has(dojoId)) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error:
          "Antes de importar Kenshi debe existir un administrador de dojo.",
      });
      continue;
    }

    const existingByEmail = row.email
      ? await guard.admin
          .from("members")
          .select("id")
          .ilike("email", row.email)
          .maybeSingle<{ id: string }>()
      : { data: null, error: null };
    const existingByName = existingByEmail.data
      ? { data: null, error: null }
      : await guard.admin
          .from("members")
          .select("id")
          .eq("dojo_id", dojoId)
          .ilike("first_name", row.firstName)
          .ilike("last_name", row.lastName)
          .maybeSingle<{ id: string }>();
    const existingMember = existingByEmail.data ?? existingByName.data;

    if (existingByEmail.error || existingByName.error) {
      result.skipped += 1;
      result.errors.push({
        row: rowNumber,
        error: existingByEmail.error?.message ?? existingByName.error?.message ?? "",
      });
      continue;
    }

    if (existingMember) {
      const updated = await guard.admin
        .from("members")
        .update({
          first_name: row.firstName,
          last_name: row.lastName,
          birth_date: normalizeDate(row.birthDate),
          country_id: countryId,
          dojo_id: dojoId,
          main_instructor: row.mainInstructor || null,
          email: row.email || null,
          phone: row.phone || null,
          is_minor: normalizeBoolean(row.isMinor) || row.memberGroup === "child",
          guardian_name: row.guardianName || null,
          guardian_email: row.guardianEmail || null,
          joined_date: normalizeDate(row.joinedDate),
          status: "active",
          current_grade: row.currentGrade || null,
          internal_notes: row.notes || null,
          member_group: normalizeMemberGroup(row.memberGroup),
          updated_by: guard.profileId,
        })
        .eq("id", existingMember.id);

      if (updated.error) {
        result.skipped += 1;
        result.errors.push({ row: rowNumber, error: updated.error.message });
        continue;
      }

      result.imported += 1;
      continue;
    }

    const member = await guard.admin.from("members").insert({
      profile_id: null,
      first_name: row.firstName,
      last_name: row.lastName,
      birth_date: normalizeDate(row.birthDate),
      country_id: countryId,
      dojo_id: dojoId,
      main_instructor: row.mainInstructor || null,
      email: row.email || null,
      phone: row.phone || null,
      is_minor: normalizeBoolean(row.isMinor) || row.memberGroup === "child",
      guardian_name: row.guardianName || null,
      guardian_email: row.guardianEmail || null,
      joined_date: normalizeDate(row.joinedDate),
      status: "active",
      current_grade: row.currentGrade || null,
      internal_notes: row.notes || null,
      member_group: normalizeMemberGroup(row.memberGroup),
      created_by: guard.profileId,
      updated_by: guard.profileId,
    });

    if (member.error) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, error: member.error.message });
      continue;
    }

    result.imported += 1;
  }

  return NextResponse.json(result);
}

async function requireMembersAdmin(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        {
          error:
            "Falta configuracion de Vercel para gestionar Kenshi.",
          detectedSupabaseVariables: getDetectedSupabaseEnvNames(),
        },
        { status: 500 },
      ),
    } as const;
  }

  const admin = createServiceClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authenticatedUser = await getAuthenticatedMemberAdminUser(admin, request);

  if (!authenticatedUser) {
    return {
      error: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    } as const;
  }

  const profile = await getMembersAdminProfile(
    admin,
    authenticatedUser.id,
    authenticatedUser.email ?? "",
  );

  if (!profile) {
    const diagnostics = await getMissingProfileDiagnostics(
      admin,
      authenticatedUser.id,
      authenticatedUser.email ?? "",
    );

    return {
      error: NextResponse.json(
        {
          error: "No se encontro el perfil del administrador.",
          diagnostics,
        },
        { status: 403 },
      ),
    } as const;
  }

  const roles = profile.user_roles ?? [];
  const roleKeys = roles.map((role) => getRoleKey(role.roles)).filter(Boolean);
  const isAllowed = roleKeys.some((role) =>
    ["super_admin", "global_admin", "country_admin", "dojo_admin"].includes(
      role ?? "",
    ),
  );

  if (!isAllowed) {
    return {
      error: NextResponse.json(
        { error: "No tienes permisos para gestionar Kenshi." },
        { status: 403 },
      ),
    } as const;
  }

  const explicitCountryIds = roles
    .filter((role) => getRoleKey(role.roles) === "country_admin")
    .map((role) => role.country_id)
    .filter(Boolean) as string[];
  const dojoIds = roles
    .filter((role) => getRoleKey(role.roles) === "dojo_admin")
    .map((role) => role.dojo_id)
    .filter(Boolean) as string[];
  const dojoCountryIds = await getCountryIdsForDojos(admin, dojoIds);
  const scope = {
    isGlobal: roleKeys.includes("super_admin") || roleKeys.includes("global_admin"),
    countryIds: Array.from(new Set([...explicitCountryIds, ...dojoCountryIds])),
    dojoIds,
  };

  return { admin, profileId: profile.id, scope } as const;
}

async function getAuthenticatedMemberAdminUser(
  admin: SupabaseAdminClient,
  request: NextRequest,
) {
  const token = getBearerToken(request);

  if (token) {
    const tokenUser = await admin.auth.getUser(token);

    if (tokenUser.data.user) {
      return tokenUser.data.user;
    }
  }

  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  return user;
}

async function getMembersAdminProfile(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
) {
  const byAuth = await admin
    .from("users_profiles")
    .select("id,user_roles(country_id,dojo_id,roles(key))")
    .eq("auth_user_id", authUserId)
    .maybeSingle<{ id: string; user_roles: ScopeRole[] | null }>();

  if (byAuth.data) {
    return byAuth.data;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const byEmail = await admin
    .from("users_profiles")
    .select("id,user_roles(country_id,dojo_id,roles(key))")
    .eq("email", normalizedEmail)
    .maybeSingle<{ id: string; user_roles: ScopeRole[] | null }>();

  if (!byEmail.data) {
    return normalizedEmail === officialSuperAdminEmail
      ? ensureOfficialSuperAdmin(admin, authUserId, normalizedEmail)
      : null;
  }

  const linked = await admin
    .from("users_profiles")
    .update({ auth_user_id: authUserId, status: "active" })
    .eq("id", byEmail.data.id)
    .select("id,user_roles(country_id,dojo_id,roles(key))")
    .maybeSingle<{ id: string; user_roles: ScopeRole[] | null }>();

  return linked.data ?? byEmail.data;
}

async function ensureOfficialSuperAdmin(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
) {
  const role = await admin
    .from("roles")
    .select("id")
    .eq("key", "super_admin")
    .maybeSingle<{ id: string }>();

  if (role.error || !role.data) {
    return null;
  }

  const profile = await admin
    .from("users_profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        email,
        display_name: "IKA org",
        status: "active",
      },
      { onConflict: "email" },
    )
    .select("id")
    .limit(1);

  const profileId = (profile.data?.[0]?.id as string | undefined) ?? "";

  if (profile.error || !profileId) {
    return null;
  }

  await admin.from("user_roles").upsert(
    {
      profile_id: profileId,
      role_id: role.data.id,
      country_id: null,
      dojo_id: null,
      created_by: profileId,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  return {
    id: profileId,
    user_roles: [{ country_id: null, dojo_id: null, roles: { key: "super_admin" } }],
  };
}

async function getMissingProfileDiagnostics(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const [byAuth, byEmail] = await Promise.all([
    admin
      .from("users_profiles")
      .select("id,email,status")
      .eq("auth_user_id", authUserId)
      .limit(3),
    normalizedEmail
      ? admin
          .from("users_profiles")
          .select("id,email,status,auth_user_id")
          .eq("email", normalizedEmail)
          .limit(3)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    authUserId,
    authEmail: normalizedEmail || null,
    profilesByAuth: byAuth.data ?? [],
    profilesByEmail: byEmail.data ?? [],
    byAuthError: byAuth.error?.message ?? null,
    byEmailError: byEmail.error?.message ?? null,
  };
}

async function getCountryIdsForDojos(
  admin: SupabaseAdminClient,
  dojoIds: string[],
) {
  if (dojoIds.length === 0) {
    return [];
  }

  const dojos = await admin
    .from("dojos")
    .select("country_id")
    .in("id", dojoIds);

  if (dojos.error) {
    return [];
  }

  return (dojos.data ?? [])
    .map((dojo) => dojo.country_id as string | null)
    .filter(Boolean) as string[];
}

async function findAuthUserIdByEmail(
  supabase: SupabaseAdminClient,
  email: string,
) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      return null;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === email,
    );

    if (user) {
      return user.id;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

function normalizeImportRow(row: ImportRow) {
  return {
    firstName: normalizeText(row.firstName),
    lastName: normalizeText(row.lastName),
    email: normalizeEmail(row.email),
    phone: normalizeText(row.phone),
    countryId: normalizeText(row.countryId),
    countryCode: normalizeText(row.countryCode).toUpperCase(),
    countryName: normalizeText(row.countryName),
    dojoId: normalizeText(row.dojoId),
    dojoName: normalizeText(row.dojoName),
    birthDate: normalizeText(row.birthDate),
    joinedDate: normalizeText(row.joinedDate),
    currentGrade: normalizeText(row.currentGrade),
    status: normalizeText(row.status),
    mainInstructor: normalizeText(row.mainInstructor),
    guardianName: normalizeText(row.guardianName),
    guardianEmail: normalizeEmail(row.guardianEmail),
    isMinor: row.isMinor,
    notes: normalizeText(row.notes),
    memberGroup: normalizeText(row.memberGroup),
  };
}

function isActiveImportStatus(value: string) {
  return ["active", "activo", "activa"].includes(
    normalizeComparable(value),
  );
}

function resolveCountry(
  countries: Array<{
    id: string;
    code: string;
    country_translations?: Array<{ name: string }>;
  }>,
  row: ReturnType<typeof normalizeImportRow>,
) {
  if (row.countryId) {
    return countries.find((country) => country.id === row.countryId) ?? null;
  }

  if (row.countryCode) {
    return (
      countries.find(
        (country) => country.code.toUpperCase() === row.countryCode,
      ) ?? null
    );
  }

  const wanted = normalizeComparable(row.countryName);

  if (!wanted) {
    return null;
  }

  return (
    countries.find((country) =>
      country.country_translations?.some(
        (translation) => normalizeComparable(translation.name) === wanted,
      ),
    ) ?? null
  );
}

function resolveDojo(
  dojos: Array<{
    id: string;
    country_id: string;
    city: string;
    dojo_translations?: Array<{ name: string }>;
  }>,
  row: ReturnType<typeof normalizeImportRow>,
  countryId: string | null,
) {
  if (row.dojoId) {
    return dojos.find((dojo) => dojo.id === row.dojoId) ?? null;
  }

  const wanted = normalizeComparable(row.dojoName);

  if (!wanted) {
    return null;
  }

  return (
    dojos.find((dojo) => {
      const matchesName =
        normalizeComparable(dojo.city) === wanted ||
        dojo.dojo_translations?.some(
          (translation) => normalizeComparable(translation.name) === wanted,
        );

      return matchesName && (!countryId || dojo.country_id === countryId);
    }) ?? null
  );
}

function canManageTarget(
  scope: { isGlobal: boolean; countryIds: string[]; dojoIds: string[] },
  countryId: string | null,
  dojoId: string | null,
) {
  return (
    scope.isGlobal ||
    (countryId ? scope.countryIds.includes(countryId) : false) ||
    (dojoId ? scope.dojoIds.includes(dojoId) : false)
  );
}

async function getAdminReadiness(supabase: SupabaseAdminClient) {
  const assignments = await supabase
    .from("user_roles")
    .select("country_id,dojo_id,roles(key)");

  const countryIdsWithAdmin = new Set<string>();
  const dojoIdsWithAdmin = new Set<string>();

  if (assignments.error) {
    return { countryIdsWithAdmin, dojoIdsWithAdmin };
  }

  for (const assignment of (assignments.data ?? []) as ScopeRole[]) {
    const roleKey = getRoleKey(assignment.roles);

    if (roleKey === "country_admin" && assignment.country_id) {
      countryIdsWithAdmin.add(assignment.country_id);
    }

    if (roleKey === "dojo_admin" && assignment.dojo_id) {
      dojoIdsWithAdmin.add(assignment.dojo_id);
    }
  }

  return { countryIdsWithAdmin, dojoIdsWithAdmin };
}

function filterCountriesByScope<T extends { id: string }>(
  countries: T[],
  scope: { isGlobal: boolean; countryIds: string[]; dojoIds: string[] },
) {
  if (scope.isGlobal) {
    return countries;
  }

  return countries.filter((country) => scope.countryIds.includes(country.id));
}

function filterDojosByScope<T extends { id: string; country_id: string }>(
  dojos: T[],
  scope: { isGlobal: boolean; countryIds: string[]; dojoIds: string[] },
) {
  if (scope.isGlobal) {
    return dojos;
  }

  return dojos.filter(
    (dojo) =>
      scope.dojoIds.includes(dojo.id) || scope.countryIds.includes(dojo.country_id),
  );
}

function filterMembersByScope<
  T extends { country_id: string | null; dojo_id: string | null },
>(
  members: T[],
  scope: { isGlobal: boolean; countryIds: string[]; dojoIds: string[] },
) {
  if (scope.isGlobal) {
    return members;
  }

  return members.filter(
    (member) =>
      (member.country_id ? scope.countryIds.includes(member.country_id) : false) ||
      (member.dojo_id ? scope.dojoIds.includes(member.dojo_id) : false),
  );
}

function getRoleKey(role: { key: string } | Array<{ key: string }> | null) {
  return Array.isArray(role) ? role[0]?.key : role?.key;
}

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    ""
  ).trim();
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme.toLowerCase() === "bearer" && token ? token.trim() : "";
}

function getDetectedSupabaseEnvNames() {
  return Object.keys(process.env)
    .filter(
      (key) =>
        key.startsWith("SUPABASE_") || key.startsWith("NEXT_PUBLIC_SUPABASE_"),
    )
    .sort();
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const dayFirst = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "yes", "si", "sí"].includes(
    value.trim().toLowerCase(),
  );
}

function normalizeMemberGroup(value: unknown) {
  const comparable = normalizeComparable(normalizeText(value));

  if (["adult", "adulto", "adultos", "senior"].includes(comparable)) {
    return "adult";
  }

  if (["child", "children", "nino", "ninos", "infantil"].includes(comparable)) {
    return "child";
  }

  return null;
}

function normalizeMemberStatus(value: unknown) {
  const comparable = normalizeComparable(normalizeText(value));

  if (["active", "activo", "activa"].includes(comparable)) {
    return "active";
  }

  if (["inactive", "inactivo", "inactiva", "baja"].includes(comparable)) {
    return "inactive";
  }

  if (
    ["temporary_leave", "baja_temporal", "temporal", "pausa"].includes(
      comparable,
    )
  ) {
    return "temporary_leave";
  }

  return "";
}
