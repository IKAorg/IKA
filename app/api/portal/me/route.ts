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

type PortalSupabaseClient = ReturnType<
  typeof createServiceClient<UntypedDatabase, "public", "public">
>;

export async function GET(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Falta configuracion de Vercel para cargar el portal privado.",
        detectedSupabaseVariables: getDetectedSupabaseEnvNames(),
      },
      { status: 500 },
    );
  }

  const supabase = createServiceClient<UntypedDatabase, "public", "public">(
    url,
    serviceRoleKey,
    {
    auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const user = await getAuthenticatedUser(supabase, request);

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users_profiles")
    .select("id,email,display_name,status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({
      profile: null,
      roles: [],
      member: null,
      gradeHistory: [],
      dashboard: null,
    });
  }
  const portalProfile = profile as {
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  };

  const [rolesResult, memberResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select(
        "id,country_id,dojo_id,roles(key,name),countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .eq("profile_id", portalProfile.id),
    supabase
      .from("members")
      .select(
        "id,ika_number,first_name,last_name,email,phone,status,current_grade,last_exam_date,joined_date,consent_accepted,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .eq("profile_id", portalProfile.id)
      .maybeSingle(),
  ]);

  if (rolesResult.error) {
    return NextResponse.json(
      { error: rolesResult.error.message },
      { status: 500 },
    );
  }

  if (memberResult.error) {
    return NextResponse.json(
      { error: memberResult.error.message },
      { status: 500 },
    );
  }

  const member = memberResult.data as { id: string } | null;
  const gradeHistory = member
    ? await supabase
        .from("grade_history")
        .select("id,grade,exam_date,exam_place,examiner")
        .eq("member_id", member.id)
        .order("exam_date", { ascending: false })
    : { data: [], error: null };

  if (gradeHistory.error) {
    return NextResponse.json(
      { error: gradeHistory.error.message },
      { status: 500 },
    );
  }
  const roles = (rolesResult.data ?? []) as Array<{
    country_id: string | null;
    dojo_id: string | null;
    roles: { key: string; name?: string } | Array<{ key: string; name?: string }> | null;
  }>;
  const scope = await getPortalScope(supabase, roles);
  const dashboard = await getPortalDashboard(supabase, scope);

  return NextResponse.json({
    profile: portalProfile,
    roles,
    member: memberResult.data ?? null,
    gradeHistory: gradeHistory.data ?? [],
    dashboard,
  });
}

async function getAuthenticatedUser(
  supabase: PortalSupabaseClient,
  request: NextRequest,
) {
  const token = getBearerToken(request);

  if (token) {
    const tokenUser = await supabase.auth.getUser(token);

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

async function getPortalScope(
  _supabase: PortalSupabaseClient,
  roles: Array<{
    country_id: string | null;
    dojo_id: string | null;
    roles: { key: string } | Array<{ key: string }> | null;
  }>,
) {
  const roleKeys = roles
    .map((role) => getRoleKey(role.roles))
    .filter((roleKey): roleKey is string => Boolean(roleKey));
  const dojoIds = roles
    .filter((role) => getRoleKey(role.roles) === "dojo_admin")
    .map((role) => role.dojo_id)
    .filter(Boolean) as string[];
  const countryIds = roles
    .filter((role) => getRoleKey(role.roles) === "country_admin")
    .map((role) => role.country_id)
    .filter(Boolean) as string[];

  return {
    roleKeys,
    isGlobal: roleKeys.includes("super_admin") || roleKeys.includes("global_admin"),
    countryIds: Array.from(new Set(countryIds)),
    dojoIds,
  };
}

async function getPortalDashboard(
  supabase: PortalSupabaseClient,
  scope: {
    roleKeys: string[];
    isGlobal: boolean;
    countryIds: string[];
    dojoIds: string[];
  },
) {
  const isAdmin =
    scope.isGlobal || scope.countryIds.length > 0 || scope.dojoIds.length > 0;

  if (!isAdmin) {
    return null;
  }

  const [countriesResult, dojosResult, membersResult] = await Promise.all([
    supabase
      .from("countries")
      .select("id,code,flag_media_id,main_image_media_id,country_translations(language_code,name)")
      .order("code", { ascending: true }),
    supabase
      .from("dojos")
      .select("id,country_id,city,main_image_media_id,dojo_translations(language_code,name)")
      .order("city", { ascending: true }),
    supabase
      .from("members")
      .select(
        "id,ika_number,first_name,last_name,email,phone,status,current_grade,joined_date,country_id,dojo_id,member_group",
      )
      .order("last_name", { ascending: true }),
  ]);

  if (countriesResult.error || dojosResult.error || membersResult.error) {
    return {
      error:
        countriesResult.error?.message ??
        dojosResult.error?.message ??
        membersResult.error?.message,
    };
  }

  const allCountries = (countriesResult.data ?? []) as Array<{
    id: string;
    code: string;
    flag_media_id: string | null;
    main_image_media_id: string | null;
    country_translations?: unknown;
  }>;
  const allDojos = (dojosResult.data ?? []) as Array<{
    id: string;
    country_id: string;
    city: string;
    main_image_media_id: string | null;
    dojo_translations?: unknown;
  }>;
  const allMembers = (membersResult.data ?? []) as Array<{
    id: string;
    ika_number: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    current_grade: string | null;
    joined_date: string | null;
    country_id: string | null;
    dojo_id: string | null;
    member_group: string | null;
  }>;
  const visibleDojos = scope.isGlobal
    ? allDojos
    : allDojos.filter(
        (dojo) =>
          scope.dojoIds.includes(dojo.id as string) ||
          scope.countryIds.includes(dojo.country_id as string),
      );
  const visibleDojoIds = new Set(visibleDojos.map((dojo) => dojo.id as string));
  const visibleCountryIds = new Set([
    ...scope.countryIds,
    ...visibleDojos.map((dojo) => dojo.country_id as string),
  ]);
  const visibleCountries = scope.isGlobal
    ? allCountries
    : allCountries.filter((country) =>
        visibleCountryIds.has(country.id as string),
      );
  const visibleMembers = scope.isGlobal
    ? allMembers
    : allMembers.filter((member) => {
        const dojoId = member.dojo_id as string | null;
        const countryId = member.country_id as string | null;

        return Boolean(
          (dojoId && visibleDojoIds.has(dojoId)) ||
            (countryId && scope.countryIds.includes(countryId)),
        );
      });
  const activeMembers = visibleMembers.filter(
    (member) => member.status === "active",
  );
  const activeAdults = activeMembers.filter(
    (member) => member.member_group === "adult",
  );
  const activeChildren = activeMembers.filter(
    (member) => member.member_group === "child",
  );
  const mediaById = await getMediaById(
    supabase,
    Array.from(
      new Set(
        [
          ...visibleCountries.flatMap((country) => [
            country.flag_media_id,
            country.main_image_media_id,
          ]),
          ...visibleDojos.map((dojo) => dojo.main_image_media_id),
        ].filter(Boolean) as string[],
      ),
    ),
  );
  const membersByDojo = visibleDojos.map((dojo) => ({
    dojoId: dojo.id,
    dojoName: firstTranslationName(dojo.dojo_translations) || dojo.city,
    countryId: dojo.country_id,
    logoUrl: getMediaUrl(dojo.main_image_media_id, mediaById),
    totalMembers: visibleMembers.filter((member) => member.dojo_id === dojo.id)
      .length,
    activeMembers: activeMembers.filter((member) => member.dojo_id === dojo.id)
      .length,
    activeAdults: activeAdults.filter((member) => member.dojo_id === dojo.id)
      .length,
    activeChildren: activeChildren.filter((member) => member.dojo_id === dojo.id)
      .length,
  }));
  const membersByCountry = visibleCountries.map((country) => ({
    countryId: country.id,
    countryName: firstTranslationName(country.country_translations) || country.code,
    logoUrl:
      getMediaUrl(country.flag_media_id, mediaById) ||
      getMediaUrl(country.main_image_media_id, mediaById),
    dojoCount: visibleDojos.filter((dojo) => dojo.country_id === country.id).length,
    totalMembers: visibleMembers.filter(
      (member) => member.country_id === country.id,
    ).length,
    activeMembers: activeMembers.filter(
      (member) => member.country_id === country.id,
    ).length,
    activeAdults: activeAdults.filter((member) => member.country_id === country.id)
      .length,
    activeChildren: activeChildren.filter(
      (member) => member.country_id === country.id,
    ).length,
  }));

  return {
    scope,
    totals: {
      countries: visibleCountries.length,
      dojos: visibleDojos.length,
      members: visibleMembers.length,
      activeMembers: activeMembers.length,
      activeAdults: activeAdults.length,
      activeChildren: activeChildren.length,
    },
    countries: visibleCountries.slice(0, 50),
    dojos: visibleDojos.slice(0, 80),
    members: visibleMembers.slice(0, 100),
    membersByDojo,
    membersByCountry,
  };
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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme.toLowerCase() === "bearer" && token ? token.trim() : "";
}

function getRoleKey(role: { key: string } | Array<{ key: string }> | null) {
  return Array.isArray(role) ? role[0]?.key : role?.key;
}

function firstTranslationName(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return (value[0]?.name as string | undefined) ?? "";
}

async function getMediaById(supabase: PortalSupabaseClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const media = await supabase
    .from("media_library")
    .select("id,storage_path")
    .in("id", ids);

  if (media.error) {
    return new Map<string, string>();
  }

  return new Map(
    ((media.data ?? []) as Array<{ id: string; storage_path: string }>).map(
      (item) => [item.id, item.storage_path],
    ),
  );
}

function getMediaUrl(id: string | null, mediaById: Map<string, string>) {
  return id ? mediaById.get(id) ?? "" : "";
}
