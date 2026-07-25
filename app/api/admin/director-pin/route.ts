import { NextResponse, type NextRequest } from "next/server";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import {
  createAdminClient,
  hashDirectorSessionToken,
  normalizeText,
  requireScopedAdmin,
} from "@/lib/admin/request-forms";

const pinIterations = 120000;
const pinKeyLength = 32;
const sessionDurationMs = 12 * 60 * 60 * 1000;

type DirectorRow = {
  id: string;
  display_name: string;
  pin_hash: string | null;
  is_active: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  const guard = await requireScopedAdmin(request);

  if (isGuardError(guard)) {
    return jsonError(guard.error, guard.status);
  }

  if (!guard.scope.isSuperAdmin) {
    return jsonError("Solo super admin puede gestionar PIN de directores.", 403);
  }

  const directors = await guard.admin
    .from("super_admin_directors")
    .select("id,display_name,pin_hash,is_active,last_verified_at,created_at,updated_at")
    .order("display_name", { ascending: true });

  if (directors.error) {
    return jsonError(directors.error.message, 500);
  }

  return NextResponse.json({
    directors: ((directors.data ?? []) as DirectorRow[]).map(publicDirector),
    directorSession: guard.scope.director ?? null,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    directorId?: string;
    displayName?: string;
    pin?: string;
  };
  const action = normalizeText(body.action);

  if (action === "verify") {
    return verifyDirectorPin(request, body);
  }

  const guard = await requireScopedAdmin(request);

  if (isGuardError(guard)) {
    return jsonError(guard.error, guard.status);
  }

  if (!guard.scope.isSuperAdmin) {
    return jsonError("Solo super admin puede gestionar PIN de directores.", 403);
  }

  if (action !== "create") {
    return jsonError("Accion no valida.", 400);
  }

  if (!guard.scope.director) {
    const existing = await guard.admin
      .from("super_admin_directors")
      .select("id")
      .limit(1);

    if (existing.error) {
      return jsonError(existing.error.message, 500);
    }

    if ((existing.data?.length ?? 0) > 0) {
      return jsonError("Valida tu PIN antes de gestionar directores.", 403);
    }
  }

  const displayName = normalizeText(body.displayName);
  const pin = normalizePin(body.pin);

  if (!displayName) {
    return jsonError("Introduce el nombre del director.", 400);
  }

  if (!pin) {
    return jsonError("El PIN debe tener entre 4 y 12 digitos.", 400);
  }

  const created = await guard.admin
    .from("super_admin_directors")
    .insert({
      display_name: displayName,
      pin_hash: hashPin(pin),
      is_active: true,
      created_by: guard.scope.profileId,
      updated_by: guard.scope.profileId,
    })
    .select("id,display_name,pin_hash,is_active,last_verified_at,created_at,updated_at")
    .single<DirectorRow>();

  if (created.error || !created.data) {
    return jsonError(created.error?.message ?? "No se pudo crear el director.", 500);
  }

  await writeDirectorAudit(guard.admin, {
    actorProfileId: guard.scope.profileId,
    directorId: guard.scope.director?.id ?? created.data.id,
    action: "director_pin.create",
    targetDirectorId: created.data.id,
    request,
  });

  return NextResponse.json({ ok: true, director: publicDirector(created.data) });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireScopedAdmin(request);

  if (isGuardError(guard)) {
    return jsonError(guard.error, guard.status);
  }

  if (!guard.scope.isSuperAdmin) {
    return jsonError("Solo super admin puede gestionar PIN de directores.", 403);
  }

  if (!guard.scope.director) {
    return jsonError("Valida tu PIN antes de gestionar directores.", 403);
  }

  const body = (await request.json().catch(() => ({}))) as {
    directorId?: string;
    displayName?: string;
    pin?: string;
    isActive?: boolean;
  };
  const directorId = normalizeText(body.directorId);
  const displayName = normalizeText(body.displayName);
  const pin = normalizePin(body.pin);
  const patch: Record<string, unknown> = {
    updated_by: guard.scope.profileId,
  };

  if (!directorId) {
    return jsonError("Falta el director.", 400);
  }

  if (displayName) {
    patch.display_name = displayName;
  }

  if (typeof body.isActive === "boolean") {
    patch.is_active = body.isActive;
  }

  if (body.pin !== undefined) {
    if (!pin) {
      return jsonError("El PIN debe tener entre 4 y 12 digitos.", 400);
    }
    patch.pin_hash = hashPin(pin);
  }

  const updated = await guard.admin
    .from("super_admin_directors")
    .update(patch)
    .eq("id", directorId)
    .select("id,display_name,pin_hash,is_active,last_verified_at,created_at,updated_at")
    .single<DirectorRow>();

  if (updated.error || !updated.data) {
    return jsonError(updated.error?.message ?? "No se pudo actualizar el director.", 500);
  }

  await writeDirectorAudit(guard.admin, {
    actorProfileId: guard.scope.profileId,
    directorId: guard.scope.director.id,
    action: "director_pin.update",
    targetDirectorId: directorId,
    request,
  });

  return NextResponse.json({ ok: true, director: publicDirector(updated.data) });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireScopedAdmin(request);

  if (isGuardError(guard)) {
    return jsonError(guard.error, guard.status);
  }

  const token = normalizeText(request.headers.get("x-ika-director-session"));
  if (token) {
    await guard.admin
      .from("super_admin_director_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashDirectorSessionToken(token));
  }

  return NextResponse.json({ ok: true });
}

async function verifyDirectorPin(
  request: NextRequest,
  body: { directorId?: string; pin?: string },
) {
  const guard = await requireScopedAdmin(request);

  if (isGuardError(guard)) {
    return jsonError(guard.error, guard.status);
  }

  if (!guard.scope.isSuperAdmin) {
    return jsonError("Solo super admin requiere PIN de director.", 403);
  }

  const directorId = normalizeText(body.directorId);
  const pin = normalizePin(body.pin);

  if (!directorId || !pin) {
    return jsonError("Selecciona director e introduce PIN.", 400);
  }

  const director = await guard.admin
    .from("super_admin_directors")
    .select("id,display_name,pin_hash,is_active,last_verified_at,created_at,updated_at")
    .eq("id", directorId)
    .maybeSingle<DirectorRow>();

  if (director.error || !director.data?.pin_hash || !director.data.is_active) {
    return jsonError("Director no autorizado o sin PIN configurado.", 403);
  }

  if (!verifyPin(pin, director.data.pin_hash)) {
    await writeDirectorAudit(guard.admin, {
      actorProfileId: guard.scope.profileId,
      directorId,
      action: "director_pin.failed",
      targetDirectorId: directorId,
      request,
    });
    return jsonError("PIN incorrecto.", 403);
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();
  const session = await guard.admin.from("super_admin_director_sessions").insert({
    director_id: director.data.id,
    super_admin_profile_id: guard.scope.profileId,
    token_hash: hashDirectorSessionToken(token),
    user_agent: request.headers.get("user-agent") ?? null,
    ip_address: getClientIp(request),
    expires_at: expiresAt,
  });

  if (session.error) {
    return jsonError(session.error.message, 500);
  }

  await guard.admin
    .from("super_admin_directors")
    .update({ last_verified_at: new Date().toISOString() })
    .eq("id", director.data.id);

  await writeDirectorAudit(guard.admin, {
    actorProfileId: guard.scope.profileId,
    directorId: director.data.id,
    action: "director_pin.verified",
    targetDirectorId: director.data.id,
    request,
  });

  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    director: publicDirector(director.data),
  });
}

function publicDirector(director: DirectorRow) {
  return {
    id: director.id,
    displayName: director.display_name,
    isActive: director.is_active,
    hasPin: Boolean(director.pin_hash),
    lastVerifiedAt: director.last_verified_at,
    createdAt: director.created_at,
    updatedAt: director.updated_at,
  };
}

function normalizePin(value: unknown) {
  const pin = normalizeText(value);
  return /^\d{4,12}$/.test(pin) ? pin : "";
}

function hashPin(pin: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(pin, salt, pinIterations, pinKeyLength, "sha256").toString("base64url");
  return `pbkdf2_sha256$${pinIterations}$${salt}$${hash}`;
}

function verifyPin(pin: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split("$");

  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 10000) {
    return false;
  }

  const actual = Buffer.from(
    pbkdf2Sync(pin, salt, iterations, pinKeyLength, "sha256").toString("base64url"),
  );
  const expected = Buffer.from(expectedHash);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function writeDirectorAudit(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  input: {
    actorProfileId: string;
    directorId: string;
    action: string;
    targetDirectorId: string;
    request: NextRequest;
  },
) {
  await admin.from("audit_logs").insert({
    actor_profile_id: input.actorProfileId,
    director_profile_id: input.directorId,
    action: input.action,
    table_name: "super_admin_directors",
    record_id: input.targetDirectorId,
    metadata: {
      ip: getClientIp(input.request),
      userAgent: input.request.headers.get("user-agent") ?? null,
    },
  });
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isGuardError(
  guard: Awaited<ReturnType<typeof requireScopedAdmin>>,
): guard is { error: string; status: 401 | 403 | 500 } {
  return "error" in guard;
}
