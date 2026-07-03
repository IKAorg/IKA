import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "@/lib/i18n/config";
import { getPublicPageContent } from "@/lib/i18n/public-pages";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

type RoleKey = "global_admin" | "country_admin" | "dojo_admin";
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

const assignableRoles: RoleKey[] = [
  "global_admin",
  "country_admin",
  "dojo_admin",
];

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
  const guard = await requireSuperAdmin();

  if (guard.error) {
    return guard.error;
  }

  const supabase = guard.admin;
  const [profiles, roles, assignments, countries, dojos] = await Promise.all([
    supabase
      .from("users_profiles")
      .select("id,email,display_name,status,created_at,updated_at")
      .order("email", { ascending: true }),
    supabase
      .from("roles")
      .select("id,key,name,description")
      .in("key", assignableRoles)
      .order("name", { ascending: true }),
    supabase
      .from("user_roles")
      .select(
        "id,profile_id,role_id,country_id,dojo_id,created_at,roles(key,name),countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("countries")
      .select("id,code,country_translations(language_code,name)")
      .order("code", { ascending: true }),
    supabase
      .from("dojos")
      .select("id,country_id,city,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
  ]);

  const firstError =
    profiles.error ??
    roles.error ??
    assignments.error ??
    countries.error ??
    dojos.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    profiles: profiles.data ?? [],
    roles: roles.data ?? [],
    assignments: assignments.data ?? [],
    countries: countries.data ?? [],
    dojos: dojos.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin();

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

  if (!email || !assignableRoles.includes(roleKey)) {
    return NextResponse.json(
      { error: "Email y rol son obligatorios." },
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

export async function DELETE(request: NextRequest) {
  const guard = await requireSuperAdmin();

  if (guard.error) {
    return guard.error;
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Falta el rol asignado." }, { status: 400 });
  }

  const { error } = await guard.admin.from("user_roles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function requireSuperAdmin() {
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

  const { data: profile, error } = await admin
    .from("users_profiles")
    .select("id,user_roles(roles(key))")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) {
    return {
      error: NextResponse.json(
        { error: "No se encontro el perfil del administrador." },
        { status: 403 },
      ),
    } as const;
  }

  const userRoles = profile.user_roles as
    | Array<{ roles: { key: string } | Array<{ key: string }> | null }>
    | null;
  const isSuperAdmin =
    userRoles?.some(
      (assignment) => getRoleKey(assignment.roles) === "super_admin",
    ) ??
    false;

  if (!isSuperAdmin) {
    return {
      error: NextResponse.json(
        { error: "Solo super_admin puede gestionar usuarios." },
        { status: 403 },
      ),
    } as const;
  }

  return { admin, profileId: profile.id as string } as const;
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
