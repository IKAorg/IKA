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

const officialSuperAdminEmail = "internationalkempoassociation@gmail.com";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const guard = await requireEventsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const { eventId } = await context.params;
  const event = await loadScopedEvent(guard.admin, guard.scope, eventId);

  if ("error" in event) {
    return event.error;
  }

  return NextResponse.json(event.payload);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const guard = await requireEventsAdmin(request);

  if (guard.error) {
    return guard.error;
  }

  const { eventId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        action?: "upsert_achievement" | "delete_achievement";
        achievementId?: string;
        memberId?: string;
        title?: string;
        modality?: string;
        category?: string;
        result?: string;
        award?: string;
        medalType?: string;
        podiumPosition?: string | number;
        notes?: string;
      }
    | null;

  const event = await loadScopedEvent(guard.admin, guard.scope, eventId);

  if ("error" in event) {
    return event.error;
  }

  if (body?.action === "delete_achievement") {
    const achievementId = normalizeText(body.achievementId);

    if (!achievementId) {
      return NextResponse.json({ error: "Logro no valido." }, { status: 400 });
    }

    const deleted = await guard.admin
      .from("member_achievements")
      .delete()
      .eq("id", achievementId);

    if (deleted.error) {
      return NextResponse.json({ error: deleted.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, achievementId });
  }

  if (body?.action === "upsert_achievement") {
    const memberId = normalizeText(body.memberId);

    if (!memberId) {
      return NextResponse.json({ error: "Kenshi no valido." }, { status: 400 });
    }

    const eventPayload = event.payload as {
      event: {
        id: string;
        starts_at: string | null;
        event_type: string | null;
        event_translations?: Array<{ language_code: string; title: string; location_label?: string | null }>;
        event_registrations: Array<{ members: { id: string } | null }>;
      };
    };
    const eventRow = eventPayload.event;
    const memberRow = eventPayload.event.event_registrations.find(
      (registration: { members: { id: string } | null }) => registration.members?.id === memberId,
    );

    if (!memberRow?.members) {
      return NextResponse.json({ error: "Kenshi no inscrito en este evento." }, { status: 400 });
    }

    const course = await ensureEventCourseForMember(guard.admin, {
      memberId,
      eventId: eventRow.id,
      title:
        eventRow.event_translations?.find((translation: { language_code: string }) => translation.language_code === "es")
          ?.title ??
        eventRow.event_translations?.[0]?.title ??
        "IKA Event",
      date: eventRow.starts_at,
      place:
        eventRow.event_translations?.find((translation: { language_code: string }) => translation.language_code === "es")
          ?.location_label ??
        eventRow.event_translations?.[0]?.location_label ??
        null,
      courseType: eventRow.event_type ?? "taikai",
      profileId: guard.profileId,
    });

    if ("error" in course) {
      return course.error;
    }

    const title = normalizeText(body.title) || course.title;
    const payload = {
      member_id: memberId,
      course_id: course.courseId,
      title,
      modality: normalizeText(body.modality) || null,
      category: normalizeText(body.category) || null,
      result: normalizeText(body.result) || null,
      award: normalizeText(body.award) || null,
      medal_type: normalizeMedalType(body.medalType),
      podium_position: normalizePodiumPosition(body.podiumPosition),
      achieved_on: course.date,
      achieved_place: course.place,
      notes: normalizeText(body.notes) || null,
      updated_by: guard.profileId,
    };

    const achievementId = normalizeText(body.achievementId);
    const saved = achievementId
      ? await guard.admin
          .from("member_achievements")
          .update(payload)
          .eq("id", achievementId)
          .select("id,member_id,course_id,title,modality,category,result,award,medal_type,podium_position,achieved_on,achieved_place,notes")
          .single()
      : await guard.admin
          .from("member_achievements")
          .insert({ ...payload, created_by: guard.profileId })
          .select("id,member_id,course_id,title,modality,category,result,award,medal_type,podium_position,achieved_on,achieved_place,notes")
          .single();

    if (saved.error || !saved.data) {
      return NextResponse.json(
        { error: saved.error?.message ?? "No se pudo guardar el logro." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, achievement: saved.data });
  }

  return NextResponse.json({ error: "Accion no valida." }, { status: 400 });
}

async function loadScopedEvent(
  admin: SupabaseAdminClient,
  scope: { isGlobal: boolean; countryIds: readonly string[]; dojoIds: readonly string[] },
  eventId: string,
) {
  const eventResult = await admin
    .from("events")
    .select(
      "id,status,event_type,tshirt_enabled,duration_days,starts_at,ends_at,country_id,dojo_id,cover_image_url,cover_image_alt,taikai_config,dojos(country_id),event_translations(language_code,title,location_label),event_registrations(id,status,payment_status,checked_in_at,admin_notes,wants_tshirt,tshirt_size,created_at,members(id,ika_number,first_name,last_name,email,current_grade,country_id,dojo_id,countries(code,country_translations(language_code,name)),dojos(id,city,dojo_translations(language_code,name))),event_registration_checkins(day_number,checked_in_at))",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (eventResult.error || !eventResult.data) {
    return {
      error: NextResponse.json(
        { error: eventResult.error?.message ?? "Evento no encontrado." },
        { status: 404 },
      ),
    } as const;
  }

  const event = eventResult.data as {
    id: string;
    country_id: string | null;
    dojo_id: string | null;
    dojos?: { country_id: string | null } | Array<{ country_id: string | null }> | null;
    starts_at: string | null;
    event_type: string | null;
    event_translations?: Array<{ language_code: string; title: string; location_label?: string | null }>;
    event_registrations?: Array<{ members: { id: string } | null }>;
  };

  const dojoCountryId = Array.isArray(event.dojos)
    ? event.dojos[0]?.country_id ?? null
    : event.dojos?.country_id ?? null;
  const effectiveCountryId = event.country_id ?? dojoCountryId;

  if (!canManageEvent(scope, effectiveCountryId, event.dojo_id)) {
    return {
      error: NextResponse.json(
        { error: "No tienes permisos para gestionar este evento." },
        { status: 403 },
      ),
    } as const;
  }

  const courseRows = await admin
    .from("grade_history")
    .select("id,member_id,source_event_id")
    .eq("source_event_id", eventId);

  if (courseRows.error) {
    return {
      error: NextResponse.json({ error: courseRows.error.message }, { status: 500 }),
    } as const;
  }

  const courseIds = ((courseRows.data ?? []) as Array<{ id: string }>).map((row) => row.id);
  const achievements =
    courseIds.length > 0
      ? await admin
          .from("member_achievements")
          .select("id,member_id,course_id,title,modality,category,result,award,medal_type,podium_position,achieved_on,achieved_place,notes")
          .in("course_id", courseIds)
          .order("achieved_on", { ascending: false })
      : { data: [], error: null };

  if (achievements.error) {
    return {
      error: NextResponse.json({ error: achievements.error.message }, { status: 500 }),
    } as const;
  }

  return {
    payload: {
      event: eventResult.data,
      achievements: achievements.data ?? [],
    },
  } as const;
}

async function ensureEventCourseForMember(
  admin: SupabaseAdminClient,
  input: {
    memberId: string;
    eventId: string;
    title: string;
    date: string | null;
    place: string | null;
    courseType: string;
    profileId: string;
  },
) {
  const normalizedDate = input.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const existing = await admin
    .from("grade_history")
    .select("id,grade,exam_date,exam_place")
    .eq("member_id", input.memberId)
    .eq("source_event_id", input.eventId)
    .maybeSingle<{ id: string; grade: string; exam_date: string; exam_place: string | null }>();

  if (existing.error) {
    return { error: NextResponse.json({ error: existing.error.message }, { status: 500 }) } as const;
  }

  if (existing.data) {
    return {
      courseId: existing.data.id,
      title: existing.data.grade,
      date: existing.data.exam_date,
      place: existing.data.exam_place,
    } as const;
  }

  const created = await admin
    .from("grade_history")
    .insert({
      member_id: input.memberId,
      grade: input.title,
      exam_date: normalizedDate,
      exam_place: input.place,
      examiner: null,
      notes: "Generated automatically from taikai result assignment.",
      course_type: normalizeCourseType(input.courseType),
      source_event_id: input.eventId,
      created_by: input.profileId,
      updated_by: input.profileId,
    })
    .select("id,grade,exam_date,exam_place")
    .single<{ id: string; grade: string; exam_date: string; exam_place: string | null }>();

  if (created.error || !created.data) {
    return {
      error: NextResponse.json(
        { error: created.error?.message ?? "No se pudo preparar el curso del evento." },
        { status: 500 },
      ),
    } as const;
  }

  return {
    courseId: created.data.id,
    title: created.data.grade,
    date: created.data.exam_date,
    place: created.data.exam_place,
  } as const;
}

async function requireEventsAdmin(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json({ error: "Falta configuracion de Supabase para eventos." }, { status: 500 }),
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
      error: NextResponse.json({ error: "No se encontro el perfil del administrador." }, { status: 403 }),
    } as const;
  }

  const roles = profile.user_roles ?? [];
  const roleKeys = roles.map((role) => getRoleKey(role.roles)).filter(Boolean) as string[];
  const isAllowed = roleKeys.some((role) => ["super_admin", "global_admin", "country_admin"].includes(role));

  if (!isAllowed) {
    return {
      error: NextResponse.json({ error: "No tienes permisos para gestionar resultados de eventos." }, { status: 403 }),
    } as const;
  }

  return {
    admin,
    profileId: profile.id,
    scope: {
      isGlobal: roleKeys.includes("super_admin") || roleKeys.includes("global_admin"),
      countryIds: Array.from(
        new Set(
          roles
            .filter((role) => getRoleKey(role.roles) === "country_admin")
            .map((role) => role.country_id)
            .filter(Boolean) as string[],
        ),
      ),
      dojoIds: [],
    },
  } as const;
}

async function getAuthenticatedUser(admin: SupabaseAdminClient, request: NextRequest) {
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

async function getAdminProfile(admin: SupabaseAdminClient, authUserId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const byAuth = await admin.from("users_profiles").select("id").eq("auth_user_id", authUserId).limit(1);
  const authProfile = ((byAuth.data ?? []) as Array<{ id: string }>)[0];

  if (authProfile) {
    return withProfileRoles(admin, authProfile.id);
  }

  if (!normalizedEmail) {
    return null;
  }

  const byEmail = await admin
    .from("users_profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .order("auth_user_id", { ascending: false, nullsFirst: false })
    .limit(1);
  const emailProfile = ((byEmail.data ?? []) as Array<{ id: string }>)[0];

  if (!emailProfile) {
    return normalizedEmail === officialSuperAdminEmail
      ? ensureOfficialSuperAdmin(admin, authUserId, normalizedEmail)
      : null;
  }

  await admin.from("users_profiles").update({ auth_user_id: authUserId, status: "active" }).eq("id", emailProfile.id);
  return withProfileRoles(admin, emailProfile.id);
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
  const roleIds = rows.map((assignment) => assignment.role_id).filter(Boolean) as string[];
  const roles = roleIds.length > 0 ? await admin.from("roles").select("id,key").in("id", roleIds) : { data: [], error: null };

  if (roles.error) {
    return null;
  }

  const roleKeyById = new Map(((roles.data ?? []) as Array<{ id: string; key: string }>).map((role) => [role.id, role.key]));

  return {
    id: profileId,
    user_roles: rows.map((assignment) => ({
      country_id: assignment.country_id,
      dojo_id: assignment.dojo_id,
      roles: assignment.role_id ? { key: roleKeyById.get(assignment.role_id) ?? "" } : null,
    })),
  };
}

async function ensureOfficialSuperAdmin(admin: SupabaseAdminClient, authUserId: string, email: string) {
  const role = await admin.from("roles").select("id").eq("key", "super_admin").maybeSingle<{ id: string }>();
  if (role.error || !role.data) return null;
  const profile = await admin
    .from("users_profiles")
    .upsert({ auth_user_id: authUserId, email, display_name: "IKA org", status: "active" }, { onConflict: "email" })
    .select("id")
    .limit(1);
  const profileId = (profile.data?.[0]?.id as string | undefined) ?? "";
  if (profile.error || !profileId) return null;
  await admin.from("user_roles").upsert(
    { profile_id: profileId, role_id: role.data.id, country_id: null, dojo_id: null, created_by: profileId },
    { onConflict: "profile_id,role_id,country_id,dojo_id", ignoreDuplicates: true },
  );
  return { id: profileId, user_roles: [{ country_id: null, dojo_id: null, roles: { key: "super_admin" } }] };
}

function canManageEvent(
  scope: { isGlobal: boolean; countryIds: readonly string[]; dojoIds: readonly string[] },
  countryId: string | null,
  dojoId: string | null,
) {
  return scope.isGlobal || (countryId ? scope.countryIds.includes(countryId) : false) || (dojoId ? scope.dojoIds.includes(dojoId) : false);
}

function getRoleKey(role: { key: string } | Array<{ key: string }> | null) {
  return Array.isArray(role) ? role[0]?.key : role?.key;
}

function getServiceRoleKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || "").trim();
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  return scheme.toLowerCase() === "bearer" && token ? token.trim() : "";
}

function getAuthUserEmail(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  return normalizeEmail(user.email) || normalizeEmail(user.user_metadata?.email);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComparable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function normalizeCourseType(value: unknown) {
  const comparable = normalizeComparable(normalizeText(value));
  if (["seminar", "seminario"].includes(comparable)) return "seminar";
  if (["taikai", "competition", "competicion"].includes(comparable)) return "taikai";
  if (["encounter", "encuentro", "meeting", "reunion"].includes(comparable)) return "encounter";
  if (["busen"].includes(comparable)) return "busen";
  return "course";
}

function normalizeMedalType(value: unknown) {
  const comparable = normalizeComparable(normalizeText(value));
  if (["gold", "oro"].includes(comparable)) return "gold";
  if (["silver", "plata"].includes(comparable)) return "silver";
  if (["bronze", "bronce"].includes(comparable)) return "bronze";
  if (["finalist", "finalista"].includes(comparable)) return "finalist";
  if (["participant", "participante"].includes(comparable)) return "participant";
  return null;
}

function normalizePodiumPosition(value: unknown) {
  const raw = typeof value === "number" ? String(value) : normalizeText(value);
  const numeric = Number.parseInt(raw, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}
