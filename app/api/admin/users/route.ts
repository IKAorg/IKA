import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

type RoleKey = "global_admin" | "country_admin" | "dojo_admin";
type CountryWithTranslations = {
  id: string;
  code: string;
  country_translations?: Array<{ language_code: string; name: string }>;
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
type ScopeRole = {
  country_id: string | null;
  dojo_id: string | null;
  roles: { key: string } | Array<{ key: string }> | null;
};
type UserAdminScope = {
  isSuperAdmin: boolean;
  isGlobal: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

const bootstrapSuperAdminEmail = "internationalkempoassociation@gmail.com";

const legacyCountrySeeds = [
  { code: "CR", index: 0 },
  { code: "CZ", index: 1 },
  { code: "ID-MY", index: 2 },
  { code: "IE", index: 3 },
  { code: "IT", index: 4 },
  { code: "HK", index: 5 },
  { code: "JP", index: 6 },
  { code: "ES", index: 7 },
  { code: "CH", index: 8 },
  { code: "GB", index: 9 },
];

export async function GET() {
  const guard = await requireUserAdmin();

  if (guard.error) {
    return guard.error;
  }

  const supabase = guard.admin;
  const assignableRoleKeys = getAssignableRoles(guard.scope);
  let countriesResult = await supabase
    .from("countries")
    .select("id,code,country_translations(language_code,name)")
    .order("code", { ascending: true });

  if (
    !countriesResult.error &&
    shouldSeedBaseCountries((countriesResult.data ?? []) as CountryWithTranslations[]) &&
    guard.scope.isSuperAdmin
  ) {
    await seedBaseCountries(supabase);
    countriesResult = await supabase
      .from("countries")
      .select("id,code,country_translations(language_code,name)")
      .order("code", { ascending: true });
  }

  const [profiles, roles, assignments, dojos] = await Promise.all([
    supabase
      .from("users_profiles")
      .select("id,email,display_name,status,created_at,updated_at")
      .order("email", { ascending: true }),
    supabase
      .from("roles")
      .select("id,key,name,description")
      .in("key", assignableRoleKeys)
      .order("name", { ascending: true }),
    supabase
      .from("user_roles")
      .select(
        "id,profile_id,role_id,country_id,dojo_id,created_at,roles(key,name),countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
  ]);

  const firstError =
    profiles.error ??
    roles.error ??
    assignments.error ??
    countriesResult.error ??
    dojos.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const scopedDojos = filterDojosByScope(dojos.data ?? [], guard.scope);
  const scopedCountries = filterCountriesByScope(
    countriesResult.data ?? [],
    guard.scope,
    scopedDojos,
  );
  const scopedAssignments = filterAssignmentsByScope(
    assignments.data ?? [],
    guard.scope,
    dojos.data ?? [],
  );
  const visibleProfileIds = new Set(
    scopedAssignments.map((assignment) => assignment.profile_id as string),
  );

  return NextResponse.json({
    profiles: guard.scope.isGlobal
      ? profiles.data ?? []
      : (profiles.data ?? []).filter((profile) =>
          visibleProfileIds.has(profile.id as string),
        ),
    roles: roles.data ?? [],
    assignments: scopedAssignments,
    countries: scopedCountries,
    dojos: scopedDojos,
    assignableRoles: assignableRoleKeys,
    scope: guard.scope,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireUserAdmin();

  if (guard.error) {
    return guard.error;
  }

  const body = await request.json().catch(() => null);

  if (body?.action === "seed_countries") {
    const result = await seedBaseCountries(guard.admin);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
    });
  }

  const email = normalizeEmail(body?.email);
  const displayName = normalizeText(body?.displayName);
  const roleKey = body?.roleKey as RoleKey;
  const countryId = normalizeOptionalId(body?.countryId);
  const dojoId = normalizeOptionalId(body?.dojoId);
  const locale = normalizeText(body?.locale) || "es";
  const sendInvite = body?.sendInvite !== false;
  const assignableRoleKeys = getAssignableRoles(guard.scope);

  if (!email || !assignableRoleKeys.includes(roleKey)) {
    return NextResponse.json(
      { error: "Email y rol valido son obligatorios para tu nivel." },
      { status: 400 },
    );
  }

  if (roleKey === "country_admin" && !countryId) {
    return NextResponse.json(
      { error: "El administrador de pais necesita un pais asignado." },
      { status: 400 },
    );
  }

  if (roleKey === "dojo_admin" && !dojoId) {
    return NextResponse.json(
      { error: "El administrador de dojo necesita un dojo asignado." },
      { status: 400 },
    );
  }

  const supabase = guard.admin;
  const targetCheck = await validateRoleTarget(
    supabase,
    guard.scope,
    roleKey,
    countryId,
    dojoId,
  );

  if (targetCheck.error) {
    return NextResponse.json({ error: targetCheck.error }, { status: 403 });
  }

  let authUserId = await findAuthUserIdByEmail(supabase, email);

  if (!authUserId && sendInvite) {
    const invite = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${request.nextUrl.origin}/${locale}/admin`,
    });

    if (invite.error) {
      return NextResponse.json({ error: invite.error.message }, { status: 400 });
    }

    authUserId = invite.data.user?.id ?? null;
  }

  if (!authUserId) {
    return NextResponse.json(
      {
        error:
          "No existe usuario Auth para ese email. Activa la invitacion o crea primero el usuario en Supabase Auth.",
      },
      { status: 400 },
    );
  }

  const profileResult = await supabase
    .from("users_profiles")
    .upsert(
      {
        email,
        display_name: displayName || email,
        auth_user_id: authUserId,
        status: "invited",
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json(
      { error: profileResult.error?.message ?? "No se pudo crear el perfil." },
      { status: 500 },
    );
  }

  const roleResult = await supabase
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .single();

  if (roleResult.error || !roleResult.data) {
    return NextResponse.json(
      { error: roleResult.error?.message ?? "No se encontro el rol." },
      { status: 500 },
    );
  }

  const assignment = await supabase.from("user_roles").upsert(
    {
      profile_id: profileResult.data.id,
      role_id: roleResult.data.id,
      country_id: roleKey === "country_admin" ? countryId : null,
      dojo_id: roleKey === "dojo_admin" ? dojoId : null,
      created_by: guard.profileId,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  if (assignment.error) {
    return NextResponse.json({ error: assignment.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function seedBaseCountries(supabase: SupabaseAdminClient) {
  let importedCount = 0;
  let updatedCount = 0;

  for (const seed of legacyCountrySeeds) {
    const countryResult = await supabase
      .from("countries")
      .upsert(
        {
          code: seed.code,
          status: "published",
          is_public: true,
        },
        { onConflict: "code" },
      )
      .select("id")
      .single<{ id: string }>();

    if (countryResult.error || !countryResult.data) {
      return {
        error:
          countryResult.error?.message ??
          `No se pudo cargar el pais ${seed.code}.`,
      };
    }

    const countryId = countryResult.data.id;
    updatedCount += 1;

    for (const locale of locales) {
      const name = getSeedCountryName(locale, seed.index, seed.code);
      const slug = await getUniqueCountrySlug(
        supabase,
        locale,
        countryId,
        name,
        seed.code,
      );

      const translationResult = await supabase
        .from("country_translations")
        .upsert(
          {
            country_id: countryId,
            language_code: locale,
            name,
            slug,
            description: null,
          },
          { onConflict: "country_id,language_code" },
        );

      if (translationResult.error) {
        return { error: translationResult.error.message };
      }
    }

    importedCount += 1;
  }

  return { importedCount, updatedCount };
}

async function getUniqueCountrySlug(
  supabase: SupabaseAdminClient,
  locale: Locale,
  countryId: string,
  name: string,
  code: string,
) {
  const baseSlug = slugify(name) || slugify(code) || "country";
  const candidates = [baseSlug, `${baseSlug}-${slugify(code)}`];

  for (const candidate of candidates) {
    const { data } = await supabase
      .from("country_translations")
      .select("country_id")
      .eq("language_code", locale)
      .eq("slug", candidate)
      .maybeSingle<{ country_id: string }>();

    if (!data || data.country_id === countryId) {
      return candidate;
    }
  }

  return `${baseSlug}-${slugify(code)}-${countryId.slice(0, 8)}`;
}

function getSeedCountryName(locale: Locale, index: number, fallback: string) {
  return getPublicPageContent(locale, "countries").countries?.[index] ?? fallback;
}

function shouldSeedBaseCountries(countries: CountryWithTranslations[]) {
  if (countries.length === 0) {
    return true;
  }

  const existingCodes = new Set(countries.map((country) => country.code));
  const missingSeedCountry = legacyCountrySeeds.some(
    (seed) => !existingCodes.has(seed.code),
  );

  if (missingSeedCountry) {
    return true;
  }

  return countries.some((country) =>
    locales.some(
      (locale) =>
        !country.country_translations?.some(
          (translation) =>
            translation.language_code === locale && translation.name.trim(),
        ),
    ),
  );
}

export async function DELETE(request: NextRequest) {
  const guard = await requireUserAdmin();

  if (guard.error) {
    return guard.error;
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Falta el rol asignado." }, { status: 400 });
  }

  const assignment = await guard.admin
    .from("user_roles")
    .select("id,country_id,dojo_id,roles(key)")
    .eq("id", id)
    .single<ScopeRole & { id: string }>();

  if (assignment.error || !assignment.data) {
    return NextResponse.json(
      { error: assignment.error?.message ?? "No se encontro el rol." },
      { status: 404 },
    );
  }

  if (!(await canManageAssignment(guard.admin, guard.scope, assignment.data))) {
    return NextResponse.json(
      { error: "No tienes permisos para quitar ese rol." },
      { status: 403 },
    );
  }

  const { error } = await guard.admin.from("user_roles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function requireUserAdmin() {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    } as const;
  }

  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);

    return {
      error: NextResponse.json(
        {
          error: `Falta configuracion de Vercel para gestionar usuarios: ${missing.join(
            ", ",
          )}.`,
          detectedSupabaseVariables: getDetectedSupabaseEnvNames(),
        },
        { status: 500 },
      ),
    } as const;
  }

  const admin = createServiceClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profileByAuthUser, error } = await admin
    .from("users_profiles")
    .select("id,user_roles(country_id,dojo_id,roles(key))")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string; user_roles: ScopeRole[] | null }>();

  if (error) {
    return {
      error: NextResponse.json(
        { error: "No se encontro el perfil del administrador." },
        { status: 403 },
      ),
    } as const;
  }

  const profile =
    profileByAuthUser ??
    (await ensureBootstrapSuperAdminProfile(
      admin,
      user.id,
      user.email ?? "",
    ));

  if (!profile) {
    return {
      error: NextResponse.json(
        { error: "No se encontro el perfil del administrador." },
        { status: 403 },
      ),
    } as const;
  }

  const userRoles = profile.user_roles ?? [];
  const roleKeys = userRoles.map((assignment) => getRoleKey(assignment.roles));
  const isSuperAdmin = roleKeys.includes("super_admin");
  const isGlobal = isSuperAdmin || roleKeys.includes("global_admin");
  const scope: UserAdminScope = {
    isSuperAdmin,
    isGlobal,
    roleKeys: roleKeys.filter(Boolean) as string[],
    countryIds: userRoles
      .filter((assignment) => getRoleKey(assignment.roles) === "country_admin")
      .map((assignment) => assignment.country_id)
      .filter(Boolean) as string[],
    dojoIds: userRoles
      .filter((assignment) => getRoleKey(assignment.roles) === "dojo_admin")
      .map((assignment) => assignment.dojo_id)
      .filter(Boolean) as string[],
  };

  if (!isGlobal && scope.countryIds.length === 0) {
    return {
      error: NextResponse.json(
        { error: "No tienes permisos para gestionar administradores." },
        { status: 403 },
      ),
    } as const;
  }

  return { admin, profileId: profile.id, scope } as const;
}

async function ensureBootstrapSuperAdminProfile(
  supabase: SupabaseAdminClient,
  authUserId: string,
  email: string,
) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail !== bootstrapSuperAdminEmail) {
    return null;
  }

  const roleResult = await supabase
    .from("roles")
    .select("id")
    .eq("key", "super_admin")
    .maybeSingle<{ id: string }>();

  if (roleResult.error || !roleResult.data) {
    return null;
  }

  const profileResult = await supabase
    .from("users_profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        email: normalizedEmail,
        display_name: "IKA org",
        status: "active",
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (profileResult.error || !profileResult.data) {
    return null;
  }

  const assignment = await supabase.from("user_roles").upsert(
    {
      profile_id: profileResult.data.id,
      role_id: roleResult.data.id,
      country_id: null,
      dojo_id: null,
      created_by: profileResult.data.id,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  if (assignment.error) {
    return null;
  }

  return {
    id: profileResult.data.id,
    user_roles: [
      {
        country_id: null,
        dojo_id: null,
        roles: { key: "super_admin" },
      },
    ],
  };
}

function getAssignableRoles(scope: UserAdminScope): RoleKey[] {
  if (scope.isSuperAdmin) {
    return ["global_admin", "country_admin", "dojo_admin"];
  }

  if (scope.isGlobal) {
    return ["country_admin", "dojo_admin"];
  }

  return ["dojo_admin"];
}

async function validateRoleTarget(
  supabase: SupabaseAdminClient,
  scope: UserAdminScope,
  roleKey: RoleKey,
  countryId: string | null,
  dojoId: string | null,
) {
  if (roleKey === "global_admin" && !scope.isSuperAdmin) {
    return { error: "Solo super_admin puede crear administradores globales." };
  }

  if (roleKey === "country_admin") {
    if (!countryId) {
      return { error: "El administrador de pais necesita un pais." };
    }

    if (!scope.isGlobal && !scope.countryIds.includes(countryId)) {
      return { error: "No puedes asignar administradores a ese pais." };
    }
  }

  if (roleKey === "dojo_admin") {
    if (!dojoId) {
      return { error: "El administrador de dojo necesita un dojo." };
    }

    const dojo = await supabase
      .from("dojos")
      .select("id,country_id")
      .eq("id", dojoId)
      .single<{ id: string; country_id: string }>();

    if (dojo.error || !dojo.data) {
      return { error: dojo.error?.message ?? "No se encontro el dojo." };
    }

    if (!scope.isGlobal && !scope.countryIds.includes(dojo.data.country_id)) {
      return { error: "No puedes asignar administradores a ese dojo." };
    }
  }

  return {};
}

function filterCountriesByScope<
  T extends { id: string },
  D extends { country_id: string },
>(countries: T[], scope: UserAdminScope, dojos: D[]) {
  if (scope.isGlobal) {
    return countries;
  }

  const countryIds = new Set([
    ...scope.countryIds,
    ...dojos.map((dojo) => dojo.country_id),
  ]);
  return countries.filter((country) => countryIds.has(country.id));
}

function filterDojosByScope<T extends { id: string; country_id: string }>(
  dojos: T[],
  scope: UserAdminScope,
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

function filterAssignmentsByScope<
  T extends { country_id: string | null; dojo_id: string | null },
  D extends { id: string; country_id: string },
>(assignments: T[], scope: UserAdminScope, dojos: D[]) {
  if (scope.isGlobal) {
    return assignments;
  }

  const dojoCountryById = new Map(dojos.map((dojo) => [dojo.id, dojo.country_id]));
  return assignments.filter((assignment) => {
    if (assignment.country_id && scope.countryIds.includes(assignment.country_id)) {
      return true;
    }

    if (assignment.dojo_id && scope.dojoIds.includes(assignment.dojo_id)) {
      return true;
    }

    const dojoCountryId = assignment.dojo_id
      ? dojoCountryById.get(assignment.dojo_id)
      : null;

    return dojoCountryId ? scope.countryIds.includes(dojoCountryId) : false;
  });
}

async function canManageAssignment(
  supabase: SupabaseAdminClient,
  scope: UserAdminScope,
  assignment: ScopeRole,
) {
  const roleKey = getRoleKey(assignment.roles);

  if (scope.isSuperAdmin) {
    return true;
  }

  if (roleKey === "global_admin") {
    return false;
  }

  if (scope.isGlobal) {
    return true;
  }

  if (roleKey === "country_admin") {
    return false;
  }

  if (assignment.country_id && scope.countryIds.includes(assignment.country_id)) {
    return true;
  }

  if (!assignment.dojo_id) {
    return false;
  }

  if (scope.dojoIds.includes(assignment.dojo_id)) {
    return true;
  }

  const dojo = await supabase
    .from("dojos")
    .select("country_id")
    .eq("id", assignment.dojo_id)
    .maybeSingle<{ country_id: string }>();

  return dojo.data?.country_id
    ? scope.countryIds.includes(dojo.data.country_id)
    : false;
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

function getDetectedSupabaseEnvNames() {
  return Object.keys(process.env)
    .filter(
      (key) =>
        key.startsWith("SUPABASE_") || key.startsWith("NEXT_PUBLIC_SUPABASE_"),
    )
    .sort();
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalId(value: unknown) {
  const text = normalizeText(value);
  return text || null;
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
