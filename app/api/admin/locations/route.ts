import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

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

type LocationScope = {
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

type LocationBody = {
  action?: "save_country" | "save_dojo" | "delete_country" | "delete_dojo";
  countryId?: string;
  dojoId?: string;
  country?: {
    id?: string;
    locale?: string;
    code?: string;
    status?: string;
    isPublic?: boolean;
    name?: string;
    slug?: string;
    description?: string;
    responsiblePerson?: string;
    responsibleEmail?: string;
    flagMediaId?: string | null;
  };
  dojo?: {
    id?: string;
    locale?: string;
    countryId?: string;
    status?: string;
    isPublic?: boolean;
    name?: string;
    slug?: string;
    description?: string;
    city?: string;
    address?: string;
    responsibleInstructor?: string;
    email?: string;
    phone?: string;
    website?: string;
    mainImageMediaId?: string | null;
  };
};

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

export async function GET(request: NextRequest) {
  const guard = await requireLocationsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const [countriesResult, dojosResult] = await Promise.all([
    guard.admin
      .from("countries")
      .select(
        "id,code,ika_country_id,status,is_public,responsible_person,responsible_email,flag_media_id,main_image_media_id,country_translations(language_code,name,slug,description)",
      )
      .order("code", { ascending: true }),
    guard.admin
      .from("dojos")
      .select(
        "id,country_id,ika_dojo_id,city,address,responsible_instructor,email,phone,website,status,is_public,main_image_media_id,dojo_translations(language_code,name,slug,description)",
      )
      .order("city", { ascending: true }),
  ]);

  const firstError = countriesResult.error ?? dojosResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const allDojos = (dojosResult.data ?? []) as Array<{
    id: string;
    country_id: string;
    main_image_media_id: string | null;
  }>;
  const dojos = scopeDojos(allDojos, guard.scope);
  const countries = scopeCountries(
    (countriesResult.data ?? []) as Array<{
      id: string;
      flag_media_id: string | null;
      main_image_media_id: string | null;
    }>,
    guard.scope,
    dojos,
  );
  const mediaIds = Array.from(
    new Set(
      [
        ...countries.flatMap((country) => [
          country.flag_media_id,
          country.main_image_media_id,
        ]),
        ...dojos.map((dojo) => dojo.main_image_media_id),
      ].filter(Boolean) as string[],
    ),
  );
  const media = mediaIds.length
    ? await guard.admin
        .from("media_library")
        .select("id,storage_path,alt_text")
        .in("id", mediaIds)
    : { data: [], error: null };

  if (media.error) {
    return NextResponse.json({ error: media.error.message }, { status: 500 });
  }

  return NextResponse.json({
    countries,
    dojos,
    media: media.data ?? [],
    scope: guard.scope,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireLocationsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const body = (await request.json().catch(() => null)) as LocationBody | null;

  if (body?.action === "save_country") {
    return saveCountry(guard.admin, guard.scope, body.country ?? {});
  }

  if (body?.action === "save_dojo") {
    return saveDojo(guard.admin, guard.scope, body.dojo ?? {});
  }

  if (body?.action === "delete_country") {
    return deleteCountry(guard.admin, guard.scope, body.countryId ?? "");
  }

  if (body?.action === "delete_dojo") {
    return deleteDojo(guard.admin, guard.scope, body.dojoId ?? "");
  }

  return NextResponse.json({ error: "Accion no valida." }, { status: 400 });
}

async function saveCountry(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  input: NonNullable<LocationBody["country"]>,
) {
  const countryId = normalizeText(input.id);

  if (!scope.isGlobal && (!countryId || !canManageCountry(scope, countryId))) {
    return NextResponse.json(
      { error: "Solo puedes modificar tu propio pais." },
      { status: 403 },
    );
  }

  const code = normalizeText(input.code).toUpperCase();
  const name = normalizeText(input.name);
  const locale = normalizeText(input.locale) || "es";

  if (!code || !name) {
    return NextResponse.json(
      { error: "Codigo y nombre de pais son obligatorios." },
      { status: 400 },
    );
  }

  const payload = {
    code,
    status: normalizeStatus(input.status),
    is_public: input.isPublic !== false,
    responsible_person: normalizeText(input.responsiblePerson) || null,
    responsible_email: normalizeText(input.responsibleEmail) || null,
    flag_media_id: input.flagMediaId ?? null,
    main_image_media_id: null,
  };
  const country = countryId
    ? await admin
        .from("countries")
        .update(payload)
        .eq("id", countryId)
        .select("id")
        .single<{ id: string }>()
    : await admin
        .from("countries")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

  if (country.error || !country.data) {
    return NextResponse.json(
      { error: country.error?.message ?? "No se pudo guardar el pais." },
      { status: 500 },
    );
  }

  const translation = await admin.from("country_translations").upsert(
    {
      country_id: country.data.id,
      language_code: locale,
      name,
      slug: normalizeText(input.slug) || slugify(name),
      description: normalizeText(input.description) || null,
    },
    { onConflict: "country_id,language_code" },
  );

  if (translation.error) {
    return NextResponse.json({ error: translation.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function saveDojo(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  input: NonNullable<LocationBody["dojo"]>,
) {
  const countryId = normalizeText(input.countryId);
  const city = normalizeText(input.city);
  const name = normalizeText(input.name);
  const locale = normalizeText(input.locale) || "es";

  if (!countryId || !city || !name) {
    return NextResponse.json(
      { error: "Pais, ciudad y nombre de dojo son obligatorios." },
      { status: 400 },
    );
  }

  if (!canManageCountry(scope, countryId)) {
    return NextResponse.json(
      { error: "No puedes modificar dojos de ese pais." },
      { status: 403 },
    );
  }

  if (input.id && !scope.isGlobal && scope.dojoIds.length > 0 && !scope.dojoIds.includes(input.id)) {
    return NextResponse.json(
      { error: "No puedes modificar ese dojo." },
      { status: 403 },
    );
  }

  const payload = {
    country_id: countryId,
    city,
    address: normalizeText(input.address) || null,
    responsible_instructor: normalizeText(input.responsibleInstructor) || null,
    email: normalizeText(input.email) || null,
    phone: normalizeText(input.phone) || null,
    website: normalizeText(input.website) || null,
    status: normalizeStatus(input.status),
    is_public: input.isPublic !== false,
    main_image_media_id: input.mainImageMediaId ?? null,
  };
  const dojo = input.id
    ? await admin
        .from("dojos")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single<{ id: string }>()
    : await admin
        .from("dojos")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

  if (dojo.error || !dojo.data) {
    return NextResponse.json(
      { error: dojo.error?.message ?? "No se pudo guardar el dojo." },
      { status: 500 },
    );
  }

  const translation = await admin.from("dojo_translations").upsert(
    {
      dojo_id: dojo.data.id,
      language_code: locale,
      name,
      slug: normalizeText(input.slug) || slugify(name),
      description: normalizeText(input.description) || null,
    },
    { onConflict: "dojo_id,language_code" },
  );

  if (translation.error) {
    return NextResponse.json({ error: translation.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function deleteCountry(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  countryId: string,
) {
  if (!scope.isGlobal) {
    return NextResponse.json(
      { error: "Solo super admin puede borrar paises." },
      { status: 403 },
    );
  }

  const deleted = await admin.from("countries").delete().eq("id", countryId);

  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function deleteDojo(
  admin: SupabaseAdminClient,
  scope: LocationScope,
  dojoId: string,
) {
  const dojo = await admin
    .from("dojos")
    .select("id,country_id")
    .eq("id", dojoId)
    .single<{ id: string; country_id: string }>();

  if (dojo.error || !dojo.data) {
    return NextResponse.json(
      { error: dojo.error?.message ?? "No se encontro el dojo." },
      { status: 404 },
    );
  }

  if (
    !scope.isGlobal &&
    !scope.countryIds.includes(dojo.data.country_id) &&
    !scope.dojoIds.includes(dojo.data.id)
  ) {
    return NextResponse.json(
      { error: "No puedes borrar ese dojo." },
      { status: 403 },
    );
  }

  const deleted = await admin.from("dojos").delete().eq("id", dojoId);

  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function requireLocationsAdmin(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: "Falta configuracion de Supabase para ubicaciones." },
        { status: 500 },
      ),
    } as const;
  }

  const admin = createServiceClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = await getAuthenticatedUser(admin, request);

  if (!user) {
    return {
      error: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    } as const;
  }

  const profile = await getAdminProfile(admin, user.id, getAuthUserEmail(user));

  if (!profile) {
    return {
      error: NextResponse.json(
        { error: "No se encontro el perfil del administrador." },
        { status: 403 },
      ),
    } as const;
  }

  const roles = profile.user_roles ?? [];
  const roleKeys = roles.map((role) => getRoleKey(role.roles)).filter(Boolean) as string[];
  const isAllowed = roleKeys.some((role) =>
    ["super_admin", "global_admin", "country_admin", "dojo_admin"].includes(role),
  );

  if (!isAllowed) {
    return {
      error: NextResponse.json(
        { error: "No tienes permisos para gestionar ubicaciones." },
        { status: 403 },
      ),
    } as const;
  }

  const scope = {
    roleKeys,
    isGlobal: roleKeys.includes("super_admin") || roleKeys.includes("global_admin"),
    countryIds: Array.from(
      new Set(
        roles
          .filter((role) => getRoleKey(role.roles) === "country_admin")
          .map((role) => role.country_id)
          .filter(Boolean) as string[],
      ),
    ),
    dojoIds: Array.from(
      new Set(
        roles
          .filter((role) => getRoleKey(role.roles) === "dojo_admin")
          .map((role) => role.dojo_id)
          .filter(Boolean) as string[],
      ),
    ),
  };

  return { admin, profileId: profile.id, scope } as const;
}

async function getAuthenticatedUser(
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

async function getAdminProfile(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
) {
  const byAuth = await admin
    .from("users_profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1);
  const authProfile = ((byAuth.data ?? []) as Array<{
    id: string;
  }>)[0];

  if (authProfile) {
    return withProfileRoles(admin, authProfile.id);
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const byEmail = await admin
    .from("users_profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .order("auth_user_id", { ascending: false, nullsFirst: false })
    .limit(1);
  const emailProfile = ((byEmail.data ?? []) as Array<{
    id: string;
  }>)[0];

  if (!emailProfile) {
    return normalizedEmail === officialSuperAdminEmail
      ? ensureOfficialSuperAdmin(admin, authUserId, normalizedEmail)
      : null;
  }

  const linked = await admin
    .from("users_profiles")
    .update({ auth_user_id: authUserId, status: "active" })
    .eq("id", emailProfile.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  return withProfileRoles(admin, linked.data?.id ?? emailProfile.id);
}

async function withProfileRoles(admin: SupabaseAdminClient, profileId: string) {
  const assignments = await admin
    .from("user_roles")
    .select("country_id,dojo_id,role_id")
    .eq("profile_id", profileId);

  if (assignments.error) {
    return null;
  }

  const rows = (assignments.data ?? []) as Array<{
    country_id: string | null;
    dojo_id: string | null;
    role_id: string | null;
  }>;
  const roleIds = rows
    .map((assignment) => assignment.role_id)
    .filter(Boolean) as string[];
  const roles =
    roleIds.length > 0
      ? await admin.from("roles").select("id,key").in("id", roleIds)
      : { data: [], error: null };

  if (roles.error) {
    return null;
  }

  const roleKeyById = new Map(
    ((roles.data ?? []) as Array<{ id: string; key: string }>).map((role) => [
      role.id,
      role.key,
    ]),
  );

  return {
    id: profileId,
    user_roles: rows.map((assignment) => ({
      country_id: assignment.country_id,
      dojo_id: assignment.dojo_id,
      roles: assignment.role_id
        ? { key: roleKeyById.get(assignment.role_id) ?? "" }
        : null,
    })),
  };
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

function scopeCountries<T extends { id: string }, D extends { country_id: string }>(
  countries: T[],
  scope: LocationScope,
  dojos: D[],
) {
  if (scope.isGlobal) {
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
  scope: LocationScope,
) {
  if (scope.isGlobal) {
    return dojos;
  }

  return dojos.filter(
    (dojo) =>
      scope.countryIds.includes(dojo.country_id) ||
      scope.dojoIds.includes(dojo.id),
  );
}

function canManageCountry(scope: LocationScope, countryId: string) {
  return scope.isGlobal || scope.countryIds.includes(countryId);
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAuthUserEmail(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
}) {
  return (
    normalizeEmail(user.email) ||
    normalizeEmail(user.user_metadata?.email) ||
    normalizeEmail(user.user_metadata?.email_address) ||
    normalizeEmail(
      user.identities?.find((identity) =>
        normalizeEmail(identity.identity_data?.email),
      )?.identity_data?.email,
    )
  );
}

function normalizeStatus(value: unknown) {
  const status = normalizeText(value);
  return ["draft", "published", "archived"].includes(status)
    ? status
    : "published";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
