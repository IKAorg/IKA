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

const memberSelect =
  "id,ika_number,first_name,last_name,email,phone,status,current_grade,last_exam_date,birth_date,joined_date,member_group,profile_image_url,consent_accepted,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))";

export async function GET(request: NextRequest) {
  const ready = await getPortalRequestContext(request);

  if (ready.error) {
    return ready.error;
  }

  const { supabase, user } = ready;

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const profile = await getPortalProfile(supabase, user.id, getAuthUserEmail(user));

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
    getPortalMember(supabase, portalProfile.id, portalProfile.email),
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
    gradeHistory: [],
    dashboard,
  });
}

export async function PATCH(request: NextRequest) {
  const ready = await getPortalRequestContext(request);

  if (ready.error) {
    return ready.error;
  }

  const { supabase, user } = ready;

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const profile = await getPortalProfile(supabase, user.id, getAuthUserEmail(user));

  if (!profile) {
    return NextResponse.json({ error: "No se encontro la ficha IKA." }, { status: 404 });
  }

  const portalProfile = profile as {
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  };
  const member = await getPortalMember(supabase, portalProfile.id, portalProfile.email);

  if (member.error) {
    return NextResponse.json({ error: member.error.message }, { status: 500 });
  }

  if (!member.data) {
    return NextResponse.json({ error: "No se encontro la ficha del Kenshi." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    phone?: string;
    profileImageUrl?: string;
    profileImageUpload?: {
      name?: string;
      type?: string;
      dataUrl?: string;
    };
  };
  const email = normalizeEmail(body.email);
  const phone = normalizeOptionalText(body.phone);
  let profileImageUrl = normalizeOptionalText(body.profileImageUrl);
  const updates: Record<string, string | null> = {
    phone,
    profile_image_url: profileImageUrl,
  };

  if (body.profileImageUpload?.dataUrl) {
    const uploadedImage = await uploadMemberProfileImage(
      supabase,
      (member.data as { id: string }).id,
      body.profileImageUpload,
    );

    if (uploadedImage.error) {
      return NextResponse.json({ error: uploadedImage.error }, { status: 400 });
    }

    profileImageUrl = uploadedImage.url;
    updates.profile_image_url = profileImageUrl;
  }

  if (email) {
    updates.email = email;
  }

  const updated = await supabase
    .from("members")
    .update(updates)
    .eq("id", (member.data as { id: string }).id)
    .select(memberSelect)
    .maybeSingle();

  if (updated.error || !updated.data) {
    return NextResponse.json(
      { error: updated.error?.message ?? "No se pudo actualizar la ficha IKA." },
      { status: 500 },
    );
  }

  if (email) {
    await supabase
      .from("users_profiles")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", portalProfile.id);
  }

  return NextResponse.json({ ok: true, member: updated.data });
}

async function uploadMemberProfileImage(
  supabase: PortalSupabaseClient,
  memberId: string,
  upload: { name?: string; type?: string; dataUrl?: string },
) {
  const mimeType = normalizeOptionalText(upload.type) ?? "";
  const dataUrl = normalizeOptionalText(upload.dataUrl) ?? "";
  const allowedTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);
  const extension = allowedTypes.get(mimeType);

  if (!extension || !dataUrl.startsWith(`data:${mimeType};base64,`)) {
    return { error: "La foto debe ser JPG, PNG, WEBP o GIF.", url: "" };
  }

  const base64 = dataUrl.split(",")[1] ?? "";
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    return { error: "La imagen esta vacia.", url: "" };
  }

  if (buffer.length > 5 * 1024 * 1024) {
    return { error: "La foto no puede superar 5 MB.", url: "" };
  }

  const storagePath = `members/${memberId}/profile-${Date.now()}.${extension}`;
  const uploaded = await supabase.storage
    .from("public-media")
    .upload(storagePath, buffer, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: true,
    });

  if (uploaded.error) {
    return { error: uploaded.error.message, url: "" };
  }

  const { data } = supabase.storage.from("public-media").getPublicUrl(storagePath);

  return { error: "", url: data.publicUrl };
}

async function getPortalRequestContext(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        {
          error:
            "Falta configuracion de Vercel para cargar el portal privado.",
          detectedSupabaseVariables: getDetectedSupabaseEnvNames(),
        },
        { status: 500 },
      ),
    } as const;
  }

  const supabase = createServiceClient<UntypedDatabase, "public", "public">(
    url,
    serviceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const user = await getAuthenticatedUser(supabase, request);

  return { supabase, user, error: null } as const;
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
  const explicitCountryIds = roles
    .filter((role) => getRoleKey(role.roles) === "country_admin")
    .map((role) => role.country_id)
    .filter(Boolean) as string[];
  const countryIds = explicitCountryIds;

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

async function getPortalProfile(
  supabase: PortalSupabaseClient,
  authUserId: string,
  email: string,
) {
  const byAuth = await supabase
    .from("users_profiles")
    .select("id,email,display_name,status")
    .eq("auth_user_id", authUserId)
    .limit(1);
  const authProfile = ((byAuth.data ?? []) as Array<{
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  }>)[0];

  if (authProfile) {
    return authProfile;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const byEmail = await supabase
    .from("users_profiles")
    .select("id,email,display_name,status")
    .ilike("email", normalizedEmail)
    .order("auth_user_id", { ascending: false, nullsFirst: false })
    .limit(1);
  const emailProfile = ((byEmail.data ?? []) as Array<{
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  }>)[0];

  if (!emailProfile) {
    return null;
  }

  const linked = await supabase
    .from("users_profiles")
    .update({ auth_user_id: authUserId, status: "active" })
    .eq("id", emailProfile.id)
    .select("id,email,display_name,status")
    .maybeSingle<{
      id: string;
      email: string;
      display_name: string | null;
      status: string;
    }>();

  return linked.data ?? emailProfile;
}

async function getPortalMember(
  supabase: PortalSupabaseClient,
  profileId: string,
  email: string,
) {
  const byProfile = await supabase
    .from("members")
    .select(memberSelect)
    .eq("profile_id", profileId)
    .limit(1);

  if (byProfile.error) {
    return byProfile;
  }

  const profileMember = (byProfile.data ?? [])[0];

  if (profileMember) {
    return { data: profileMember, error: null } as const;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { data: null, error: null } as const;
  }

  const byEmail = await supabase
    .from("members")
    .select(memberSelect)
    .ilike("email", normalizedEmail)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (byEmail.error) {
    return byEmail;
  }

  const emailMember = (byEmail.data ?? [])[0] as { id?: string } | undefined;

  if (!emailMember?.id) {
    return { data: null, error: null } as const;
  }

  await supabase
    .from("members")
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .eq("id", emailMember.id);

  const linked = await supabase
    .from("members")
    .select(memberSelect)
    .eq("id", emailMember.id)
    .maybeSingle();

  return linked;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
