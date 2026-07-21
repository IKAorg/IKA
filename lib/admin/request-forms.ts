import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";
import type { NextRequest } from "next/server";

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

export type SupabaseAdminClient = ReturnType<
  typeof createServiceClient<UntypedDatabase, "public", "public">
>;

type ScopeAssignment = {
  profile_id?: string | null;
  country_id: string | null;
  dojo_id: string | null;
  roles: { key: string } | Array<{ key: string }> | null;
};

export type AdminScope = {
  profileId: string;
  roleProfileIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  countryIds: string[];
  dojoIds: string[];
  roleKeys: string[];
};

type AdminProfileRecord = {
  id: string;
  email?: string | null;
  role_profile_ids?: string[];
};

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";
const adminRoleKeys = [
  "super_admin",
  "global_admin",
  "country_admin",
  "dojo_admin",
] as const;

export function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    ""
  ).trim();
}

export function createAdminClient() {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createServiceClient<UntypedDatabase, "public", "public">(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireScopedAdmin(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Falta configuracion Supabase.", status: 500 as const };
  }

  const user = await getAuthenticatedUser(admin, request);
  if (!user) {
    return { error: "No autenticado.", status: 401 as const };
  }

  const profile = await getOrRepairAdminProfile(
    admin,
    user.id,
    getAuthUserEmail(user) || getClientAuthEmail(request),
  );
  if (!profile) {
    return {
      error: "No se encontro un perfil administrador para esta sesion.",
      status: 403 as const,
    };
  }

  const roleProfileIds = profile.role_profile_ids?.length
    ? profile.role_profile_ids
    : [profile.id];
  const assignmentsResult = await admin
    .from("user_roles")
    .select("profile_id,country_id,dojo_id,roles(key)")
    .in("profile_id", roleProfileIds);

  if (assignmentsResult.error) {
    return {
      error: assignmentsResult.error.message,
      status: 500 as const,
    };
  }

  const assignments = (assignmentsResult.data ?? []) as ScopeAssignment[];
  const roleKeys = assignments
    .map((assignment) => getRoleKey(assignment.roles))
    .filter(Boolean) as string[];
  const hasAdminRole = roleKeys.some((roleKey) =>
    adminRoleKeys.includes(roleKey as (typeof adminRoleKeys)[number]),
  );

  if (!hasAdminRole) {
    return {
      error: "Tu usuario no tiene permisos de administracion.",
      status: 403 as const,
    };
  }

  const directCountryIds = assignments
    .filter((assignment) => getRoleKey(assignment.roles) === "country_admin")
    .map((assignment) => assignment.country_id)
    .filter(Boolean) as string[];
  const directDojoIds = assignments
    .filter((assignment) => getRoleKey(assignment.roles) === "dojo_admin")
    .map((assignment) => assignment.dojo_id)
    .filter(Boolean) as string[];
  const inferredCountryIds =
    directDojoIds.length > 0
      ? await getCountryIdsForDojos(admin, directDojoIds)
      : [];

  return {
    admin,
    scope: {
      profileId: profile.id,
      roleProfileIds,
      isSuperAdmin: roleKeys.includes("super_admin"),
      isGlobalAdmin: roleKeys.includes("global_admin"),
      roleKeys,
      countryIds: Array.from(new Set([...directCountryIds, ...inferredCountryIds])),
      dojoIds: directDojoIds,
    } satisfies AdminScope,
  };
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

async function getOrRepairAdminProfile(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
): Promise<AdminProfileRecord | null> {
  const byAuth = await admin
    .from("users_profiles")
    .select("id,email")
    .eq("auth_user_id", authUserId)
    .limit(10);

  const authProfiles = ((byAuth.data ?? []) as Array<{
    id: string;
    email?: string | null;
  }>);

  const normalizedEmail = normalizeEmail(email);
  const preferredAuthProfile =
    authProfiles.find((profile) => normalizeEmail(profile.email) === normalizedEmail) ??
    authProfiles[0];

  if (normalizedEmail) {
    const byEmail = await admin
      .from("users_profiles")
      .select("id,email")
      .ilike("email", normalizedEmail)
      .order("auth_user_id", { ascending: false, nullsFirst: false })
      .limit(10);

    const emailProfiles = (byEmail.data ?? []) as Array<{
      id: string;
      email?: string | null;
    }>;
    const roleProfileIds = Array.from(
      new Set(
        [
          ...(preferredAuthProfile ? [preferredAuthProfile.id] : []),
          ...emailProfiles.map((profile) => profile.id),
        ].filter(Boolean),
      ),
    );
    const rolesResult =
      roleProfileIds.length > 0
        ? await admin
            .from("user_roles")
            .select("profile_id,country_id,dojo_id,roles(key)")
            .in("profile_id", roleProfileIds)
        : { data: [], error: null };

    if (rolesResult.error) {
      return null;
    }

    const adminRoleProfileIds = new Set(
      ((rolesResult.data ?? []) as ScopeAssignment[])
        .filter((assignment) =>
          adminRoleKeys.includes(
            getRoleKey(assignment.roles) as (typeof adminRoleKeys)[number],
          ),
        )
        .map((assignment) => assignment.profile_id)
        .filter(Boolean) as string[],
    );

    const candidateProfiles = emailProfiles.filter((profile) =>
      adminRoleProfileIds.has(profile.id),
    );

    if (candidateProfiles.length > 0) {
      const primaryProfile =
        preferredAuthProfile && adminRoleProfileIds.has(preferredAuthProfile.id)
          ? preferredAuthProfile
          : candidateProfiles.find(
              (profile) => normalizeEmail(profile.email) === normalizedEmail,
            ) ?? candidateProfiles[0];
      const linked = await admin
        .from("users_profiles")
        .update({ auth_user_id: authUserId, status: "active" })
        .eq("id", primaryProfile.id)
        .select("id,email")
        .single<{ id: string; email?: string | null }>();

      return {
        ...(linked.data ?? primaryProfile),
        role_profile_ids: roleProfileIds,
      };
    }
  }

  if (normalizedEmail === officialSuperAdminEmail) {
    return ensureOfficialSuperAdmin(admin, authUserId, normalizedEmail);
  }

  return null;
}

async function ensureOfficialSuperAdmin(
  admin: SupabaseAdminClient,
  authUserId: string,
  email: string,
): Promise<AdminProfileRecord | null> {
  const role = await admin
    .from("roles")
    .select("id")
    .eq("key", "super_admin")
    .single<{ id: string }>();

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
    .single<{ id: string }>();

  if (profile.error || !profile.data) {
    return null;
  }

  await admin.from("user_roles").upsert(
    {
      profile_id: profile.data.id,
      role_id: role.data.id,
      country_id: null,
      dojo_id: null,
      created_by: profile.data.id,
    },
    {
      onConflict: "profile_id,role_id,country_id,dojo_id",
      ignoreDuplicates: true,
    },
  );

  return {
    id: profile.data.id,
    email,
    role_profile_ids: [profile.data.id],
  };
}

async function getCountryIdsForDojos(
  admin: SupabaseAdminClient,
  dojoIds: string[],
) {
  if (dojoIds.length === 0) {
    return [];
  }

  const result = await admin
    .from("dojos")
    .select("id,country_id")
    .in("id", dojoIds);

  if (result.error) {
    return [];
  }

  return Array.from(
    new Set(
      ((result.data ?? []) as Array<{ country_id?: string | null }>)
        .map((dojo) => dojo.country_id)
        .filter(Boolean) as string[],
    ),
  );
}

function getRoleKey(role: ScopeAssignment["roles"]) {
  return Array.isArray(role) ? role[0]?.key : role?.key;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  return scheme.toLowerCase() === "bearer" && token ? token.trim() : "";
}

function getClientAuthEmail(request: NextRequest) {
  return normalizeEmail(request.headers.get("x-client-auth-email"));
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function canManageCountry(scope: AdminScope, countryId: string | null) {
  if (!countryId) return scope.isSuperAdmin || scope.isGlobalAdmin;
  return scope.isSuperAdmin || scope.isGlobalAdmin || scope.countryIds.includes(countryId);
}

export function canManageDojo(scope: AdminScope, dojoId: string | null, dojoCountryId?: string | null) {
  if (scope.isSuperAdmin || scope.isGlobalAdmin) return true;
  if (dojoId && scope.dojoIds.includes(dojoId)) return true;
  return Boolean(dojoCountryId && scope.countryIds.includes(dojoCountryId));
}
