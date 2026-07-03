import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { getSupabaseProjectUrl } from "@/lib/supabase/url";

export async function GET() {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

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

  const supabase = createServiceClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
    });
  }

  const [rolesResult, memberResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select(
        "id,country_id,dojo_id,roles(key,name),countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .eq("profile_id", profile.id),
    supabase
      .from("members")
      .select(
        "id,ika_number,first_name,last_name,email,phone,status,current_grade,last_exam_date,joined_date,consent_accepted,countries(code,country_translations(language_code,name)),dojos(city,dojo_translations(language_code,name))",
      )
      .eq("profile_id", profile.id)
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

  const gradeHistory = memberResult.data
    ? await supabase
        .from("grade_history")
        .select("id,grade,exam_date,exam_place,examiner")
        .eq("member_id", memberResult.data.id)
        .order("exam_date", { ascending: false })
    : { data: [], error: null };

  if (gradeHistory.error) {
    return NextResponse.json(
      { error: gradeHistory.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile,
    roles: rolesResult.data ?? [],
    member: memberResult.data ?? null,
    gradeHistory: gradeHistory.data ?? [],
  });
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
