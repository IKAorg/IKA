import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Falta configuracion Supabase." },
      { status: 500 },
    );
  }

  const result = await supabase.from("countries").select("id").limit(1);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: "No se pudo comprobar Supabase." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      service: "supabase",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!secret) {
    return request.headers.get("user-agent") === "vercel-cron/1.0";
  }

  if (!supplied) {
    return false;
  }

  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
