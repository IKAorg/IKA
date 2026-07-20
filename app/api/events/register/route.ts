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

export async function POST(request: NextRequest) {
  const ready = await getRequestContext(request);

  if (ready.error) {
    return ready.error;
  }

  const { supabase, user } = ready;

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    eventId?: string;
    action?: "register" | "cancel";
    wantsTshirt?: boolean;
    tshirtSize?: string;
  };

  const eventId = normalizeText(body.eventId);
  const action = body.action === "cancel" ? "cancel" : "register";
  const wantsTshirt = Boolean(body.wantsTshirt);
  const tshirtSize = normalizeText(body.tshirtSize).toUpperCase();

  if (!eventId) {
    return NextResponse.json({ error: "Falta el evento." }, { status: 400 });
  }

  const profile = await getPortalProfile(supabase, user.id, getAuthUserEmail(user));

  if (!profile) {
    return NextResponse.json(
      { error: "No se encontro el perfil del portal." },
      { status: 403 },
    );
  }

  const memberResult = await getPortalMember(
    supabase,
    profile.id as string,
    profile.email as string,
  );

  if (memberResult.error) {
    return NextResponse.json({ error: memberResult.error.message }, { status: 500 });
  }

  const member = memberResult.data as
    | { id: string; status?: string | null; first_name?: string; last_name?: string }
    | null;

  if (!member?.id || member.status !== "active") {
    return NextResponse.json(
      {
        error:
          "Tu ficha Kenshi no tiene acceso activo. Consulta con tu sensei o responsable de pais.",
      },
      { status: 403 },
    );
  }

  const eventResult = await supabase
    .from("events")
    .select("id,status,allow_member_registration,registration_open,tshirt_enabled")
    .eq("id", eventId)
    .maybeSingle<{
      id: string;
      status: string;
      allow_member_registration?: boolean | null;
      registration_open?: boolean | null;
      tshirt_enabled?: boolean | null;
    }>();

  if (eventResult.error || !eventResult.data) {
    return NextResponse.json({ error: "No se encontro el evento." }, { status: 404 });
  }

  if (eventResult.data.status !== "published") {
    return NextResponse.json(
      { error: "Este evento no esta disponible para inscripcion." },
      { status: 400 },
    );
  }

  if (
    action === "register" &&
    (!eventResult.data.allow_member_registration || !eventResult.data.registration_open)
  ) {
    return NextResponse.json(
      { error: "La inscripcion a este evento no esta abierta." },
      { status: 400 },
    );
  }

  if (
    action === "register" &&
    wantsTshirt &&
    eventResult.data.tshirt_enabled &&
    !TSHIRT_SIZE_SET.has(tshirtSize)
  ) {
    return NextResponse.json(
      { error: "Debes seleccionar una talla valida para la camiseta." },
      { status: 400 },
    );
  }

  if (action === "cancel") {
    const cancelled = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: eventId,
          member_id: member.id,
          registered_by_profile_id: profile.id,
          status: "cancelled",
          wants_tshirt: wantsTshirt && Boolean(eventResult.data.tshirt_enabled),
          tshirt_size:
            wantsTshirt && eventResult.data.tshirt_enabled ? tshirtSize || null : null,
        },
        { onConflict: "event_id,member_id" },
      );

    if (cancelled.error) {
      return NextResponse.json({ error: cancelled.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  const registered = await supabase
    .from("event_registrations")
    .upsert(
      {
        event_id: eventId,
        member_id: member.id,
        registered_by_profile_id: profile.id,
        status: "registered",
        wants_tshirt: wantsTshirt && Boolean(eventResult.data.tshirt_enabled),
        tshirt_size:
          wantsTshirt && eventResult.data.tshirt_enabled ? tshirtSize || null : null,
      },
      { onConflict: "event_id,member_id" },
    );

  if (registered.error) {
    return NextResponse.json({ error: registered.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "registered" });
}

export async function GET(request: NextRequest) {
  const ready = await getRequestContext(request);

  if (ready.error) {
    return ready.error;
  }

  const { supabase, user } = ready;
  const eventId = normalizeText(request.nextUrl.searchParams.get("eventId"));

  if (!eventId) {
    return NextResponse.json({ error: "Falta el evento." }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ authenticated: false, registered: false });
  }

  const profile = await getPortalProfile(supabase, user.id, getAuthUserEmail(user));

  if (!profile) {
    return NextResponse.json({ authenticated: true, registered: false });
  }

  const memberResult = await getPortalMember(
    supabase,
    profile.id as string,
    profile.email as string,
  );

  const member = memberResult.data as { id?: string; status?: string | null } | null;

  if (!member?.id || member.status !== "active") {
    return NextResponse.json({ authenticated: true, registered: false, active: false });
  }

  const registration = await supabase
    .from("event_registrations")
    .select("status,wants_tshirt,tshirt_size")
    .eq("event_id", eventId)
    .eq("member_id", member.id)
    .maybeSingle<{ status: string; wants_tshirt?: boolean | null; tshirt_size?: string | null }>();

  return NextResponse.json({
    authenticated: true,
    active: true,
    registered: registration.data?.status === "registered",
    status: registration.data?.status ?? null,
    wantsTshirt: Boolean(registration.data?.wants_tshirt),
    tshirtSize: registration.data?.tshirt_size ?? null,
  });
}

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "XS", "2XS", "3XS"] as const;
const TSHIRT_SIZE_SET = new Set<string>(TSHIRT_SIZES);

async function getRequestContext(request: NextRequest) {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: "Falta configuracion del portal." },
        { status: 500 },
      ),
    } as const;
  }

  const supabase = createServiceClient<UntypedDatabase, "public", "public">(
    url,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
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
    return authProfile;
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

  return linked.data ?? emailProfile;
}

async function getPortalMember(
  supabase: PortalSupabaseClient,
  profileId: string,
  email: string,
) {
  const byProfile = await supabase
    .from("members")
    .select("id,status,first_name,last_name,email")
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
    .select("id,status,first_name,last_name,email")
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

  return await supabase
    .from("members")
    .select("id,status,first_name,last_name,email")
    .eq("id", emailMember.id)
    .maybeSingle();
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
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

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
