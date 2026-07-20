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

type EventRegistrationRow = {
  id: string;
  status: string;
  payment_status?: string | null;
  wants_tshirt?: boolean | null;
  tshirt_size?: string | null;
  created_at: string;
  events: {
    id: string;
    event_type?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    registration_open?: boolean | null;
    tshirt_enabled?: boolean | null;
    event_translations?: Array<{
      language_code: string;
      title: string;
      slug: string | null;
      location_label?: string | null;
    }>;
  } | null;
};

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

const memberSelect =
  "id,ika_number,first_name,last_name,email,phone,status,current_grade,last_exam_date,birth_date,joined_date,member_group,profile_image_url,consent_accepted,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))";

export async function GET(request: NextRequest) {
  const includeDashboard = request.nextUrl.searchParams.get("view") !== "portal";
  const ready = await getPortalRequestContext(request);

  if (ready.error) {
    return ready.error;
  }

  const { supabase, user } = ready;

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const normalizedUserEmail = normalizeEmail(getAuthUserEmail(user));

  if (!includeDashboard && normalizedUserEmail === officialSuperAdminEmail) {
    return NextResponse.json({
      profile: {
        id: user.id,
        email: normalizedUserEmail,
        display_name: "IKA org",
        status: "active",
      },
      roles: [
        {
          id: "official-super-admin",
          country_id: null,
          dojo_id: null,
          roles: { key: "super_admin", name: "Super admin" },
          countries: null,
          dojos: null,
        },
      ],
      member: null,
      gradeHistory: [],
      achievements: [],
      eventRegistrations: [],
      dashboard: null,
    });
  }

  const profile = await getPortalProfile(supabase, user.id, getAuthUserEmail(user));

  if (!profile) {
    return NextResponse.json({
      profile: null,
      roles: [],
      member: null,
      gradeHistory: [],
      achievements: [],
      dashboard: null,
    });
  }
  const portalProfile = profile as {
    id: string;
    email: string;
    display_name: string | null;
    status: string;
    role_profile_ids?: string[];
  };
  const roleProfileIds =
    portalProfile.role_profile_ids && portalProfile.role_profile_ids.length > 0
      ? portalProfile.role_profile_ids
      : [portalProfile.id];

  const [rolesResult, memberResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select(
        "id,country_id,dojo_id,roles(key,name),countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .in("profile_id", roleProfileIds),
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
  const dashboard = includeDashboard
    ? await getPortalDashboard(supabase, scope)
    : null;
  const portalMemberId =
    ((memberResult.data as { id?: string } | null)?.id ?? "").trim();
  const gradeHistory =
    portalMemberId
      ? await supabase
          .from("grade_history")
          .select("id,grade,exam_date,exam_place,examiner,course_type,course_reference_id")
          .eq("member_id", portalMemberId)
          .order("exam_date", { ascending: false })
      : { data: [], error: null };
  const achievements =
    portalMemberId
      ? await supabase
          .from("member_achievements")
          .select("id,course_id,title,modality,category,result,award,medal_type,podium_position,achieved_on,achieved_place,notes")
          .eq("member_id", portalMemberId)
          .order("achieved_on", { ascending: false })
      : { data: [], error: null };
  const eventRegistrations =
    portalMemberId
      ? await supabase
          .from("event_registrations")
          .select(
            "id,status,payment_status,wants_tshirt,tshirt_size,created_at,events(id,event_type,starts_at,ends_at,registration_open,tshirt_enabled,event_translations(language_code,title,slug,location_label))",
          )
          .eq("member_id", portalMemberId)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (gradeHistory.error || achievements.error || eventRegistrations.error) {
    return NextResponse.json(
      {
        error:
          gradeHistory.error?.message ??
          achievements.error?.message ??
          eventRegistrations.error?.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile: portalProfile,
    roles,
    member: memberResult.data ?? null,
    gradeHistory: gradeHistory.data ?? [],
    achievements: achievements.data ?? [],
    eventRegistrations: (eventRegistrations.data ?? []) as EventRegistrationRow[],
    dashboard,
  });
}

export async function POST(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !serviceRoleKey || !anonKey) {
    return NextResponse.json(
      { error: "Falta configuracion de acceso al portal." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    email?: string;
    locale?: string;
  };
  const locale = normalizePortalLocale(body.locale);

  if (body.action !== "request_recovery") {
    return NextResponse.json({ error: getPortalCopy(locale).invalidAction }, { status: 400 });
  }

  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json(
      { error: getPortalCopy(locale).emailRequired },
      { status: 400 },
    );
  }

  const supabase = createServiceClient<UntypedDatabase, "public", "public">(
    url,
    serviceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const memberLookup = await supabase
    .from("members")
    .select("id,status,email")
    .ilike("email", email)
    .eq("status", "active")
    .limit(1);

  if (memberLookup.error) {
    return NextResponse.json(
      { error: memberLookup.error.message },
      { status: 500 },
    );
  }

  const activeMember = (memberLookup.data ?? [])[0] as
    | { id: string; status: string; email: string | null }
    | undefined;

  if (!activeMember?.id) {
    return NextResponse.json(
      { error: getPortalCopy(locale).invalidEmail },
      { status: 400 },
    );
  }

  const publicAuthClient = createServiceClient<UntypedDatabase, "public", "public">(
    url,
    anonKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const redirectBase =
    request.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || url;
  const resetResult = await publicAuthClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectBase}/${locale}/portal?type=recovery`,
  });

  if (resetResult.error) {
    return NextResponse.json(
      { error: resetResult.error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
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
  const visibleMemberIds = visibleMembers.map((member) => member.id).filter(Boolean);
  const coursesResult =
    visibleMemberIds.length > 0
      ? await supabase
          .from("grade_history")
          .select("grade,exam_date,course_type,exam_place,examiner")
          .in("member_id", visibleMemberIds)
      : { data: [], error: null };
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

  if (coursesResult.error) {
    return {
      error: coursesResult.error.message,
    };
  }

  const uniqueCourses = new Set(
    ((coursesResult.data ?? []) as Array<{
      grade: string | null;
      exam_date: string | null;
      course_type?: string | null;
      exam_place?: string | null;
      examiner?: string | null;
    }>).map((course) =>
      [
        course.grade ?? "",
        course.exam_date ?? "",
        course.course_type ?? "course",
        course.exam_place ?? "",
        course.examiner ?? "",
      ].join("||"),
    ),
  );
  const createdCoursesMap = new Map<
    string,
    {
      courseKey: string;
      title: string;
      type: string;
      date: string | null;
      place: string | null;
      instructor: string | null;
      memberCount: number;
    }
  >();

  for (const course of (coursesResult.data ?? []) as Array<{
    grade: string | null;
    exam_date: string | null;
    course_type?: string | null;
    exam_place?: string | null;
    examiner?: string | null;
  }>) {
    const courseKey = [
      course.grade ?? "",
      course.exam_date ?? "",
      course.course_type ?? "course",
      course.exam_place ?? "",
      course.examiner ?? "",
    ].join("||");
    const existing = createdCoursesMap.get(courseKey);

    if (existing) {
      existing.memberCount += 1;
      continue;
    }

    createdCoursesMap.set(courseKey, {
      courseKey,
      title: course.grade ?? "IKA course",
      type: course.course_type ?? "course",
      date: course.exam_date ?? null,
      place: course.exam_place ?? null,
      instructor: course.examiner ?? null,
      memberCount: 1,
    });
  }

  const createdCourses = Array.from(createdCoursesMap.values()).sort((a, b) => {
    const timeA = a.date ? Date.parse(a.date) : 0;
    const timeB = b.date ? Date.parse(b.date) : 0;
    return timeB - timeA;
  });

  return {
    scope,
  totals: {
    countries: visibleCountries.length,
    dojos: visibleDojos.length,
    activeDojos: membersByDojo.filter((dojo) => dojo.activeMembers > 0).length,
      members: visibleMembers.length,
      activeMembers: activeMembers.length,
      activeAdults: activeAdults.length,
      activeChildren: activeChildren.length,
      coursesRegistered: uniqueCourses.size,
    },
    countries: visibleCountries.slice(0, 50),
    dojos: visibleDojos.slice(0, 80),
    members: visibleMembers.slice(0, 100),
    createdCourses: createdCourses.slice(0, 200),
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
  const normalizedEmail = normalizeEmail(email);
  const byAuth = await supabase
    .from("users_profiles")
    .select("id,email,display_name,status")
    .eq("auth_user_id", authUserId)
    .limit(10);
  const authProfiles = ((byAuth.data ?? []) as Array<{
    id: string;
    email: string;
    display_name: string | null;
    status: string;
  }>);
  const authProfile =
    authProfiles.find(
      (profile) => normalizeEmail(profile.email) === normalizedEmail,
    ) ?? authProfiles[0];

  if (authProfile) {
    const emailProfiles = normalizedEmail
      ? await supabase
          .from("users_profiles")
          .select("id")
          .ilike("email", normalizedEmail)
          .limit(5)
      : { data: [], error: null };
    const roleProfileIds = Array.from(
      new Set([
        authProfile.id,
        ...(((emailProfiles.data ?? []) as Array<{ id: string }>).map(
          (profile) => profile.id,
        )),
      ]),
    );

    return { ...authProfile, role_profile_ids: roleProfileIds };
  }

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

  const linkedProfile = linked.data ?? emailProfile;

  return { ...linkedProfile, role_profile_ids: [linkedProfile.id] };
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

function normalizePortalLocale(value: unknown) {
  if (typeof value !== "string") {
    return "en";
  }

  const normalized = value.trim().toLowerCase();
  return ["es", "en", "it", "fr", "ja", "zh", "cs"].includes(normalized)
    ? normalized
    : "en";
}

function getPortalCopy(locale: string) {
  const copies: Record<
    string,
    { emailRequired: string; invalidEmail: string; invalidAction: string }
  > = {
    es: {
      emailRequired: "Introduce tu email para recuperar la contrasena.",
      invalidEmail:
        "El email introducido no es correcto o no tiene acceso activo. Consulta con tu sensei.",
      invalidAction: "Accion no valida.",
    },
    en: {
      emailRequired: "Enter your email to recover your password.",
      invalidEmail:
        "The email entered is not valid or does not have active access. Please contact your sensei.",
      invalidAction: "Invalid action.",
    },
    it: {
      emailRequired: "Inserisci la tua email per recuperare la password.",
      invalidEmail:
        "L'email inserita non e valida o non ha un accesso attivo. Contatta il tuo sensei.",
      invalidAction: "Azione non valida.",
    },
    fr: {
      emailRequired: "Saisissez votre email pour recuperer votre mot de passe.",
      invalidEmail:
        "L'email saisi n'est pas valide ou n'a pas d'acces actif. Contactez votre sensei.",
      invalidAction: "Action non valide.",
    },
    ja: {
      emailRequired:
        "パスワードを回復するメールアドレスを入力してください。",
      invalidEmail:
        "入力したメールアドレスは無効か、有効なアクセスがありません。指導者に相談してください。",
      invalidAction: "無効な操作です。",
    },
    zh: {
      emailRequired: "请输入邮箱以恢复密码。",
      invalidEmail:
        "输入的邮箱无效或没有有效访问权限。请联系你的 sensei。",
      invalidAction: "无效操作。",
    },
    cs: {
      emailRequired: "Zadejte email pro obnovu hesla.",
      invalidEmail:
        "Zadany email neni platny nebo nema aktivni pristup. Kontaktujte sveho senseie.",
      invalidAction: "Neplatna akce.",
    },
  };

  return copies[locale] ?? copies.en;
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
