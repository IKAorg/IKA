import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";
import { uploadDriveImage } from "@/lib/google-drive/media";
import { discoverRemoteLogos, downloadRemoteImage } from "@/lib/media/remote-logo-discovery";

export const runtime = "nodejs";

type RequestBody =
  | { action: "discover"; countryId: string; website: string }
  | { action: "import"; countryId: string; imageUrl: string };

type ExistingAsset = {
  id: string;
  file_name: string;
  mime_type: string;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  migration_status: string;
};

export async function POST(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) {
    const status = guard.status === 401 ? 403 : (guard.status ?? 500);
    return jsonError(status, status === 403 ? "FORBIDDEN" : "ADMIN_UNAVAILABLE", status === 403
      ? "No tienes permisos para realizar esta accion."
      : "No se pudo validar la sesion administrativa.");
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonError(400, "INVALID_INPUT", "La solicitud no contiene JSON valido.");
  }

  if (!isValidBody(body)) {
    return jsonError(400, "INVALID_INPUT", "Los datos de la solicitud no son validos.");
  }
  body.countryId = body.countryId.trim();
  if (body.action === "discover") body.website = body.website.trim();
  if (body.action === "import") body.imageUrl = body.imageUrl.trim();

  const country = await guard.admin
    .from("countries")
    .select("id")
    .eq("id", body.countryId)
    .maybeSingle<{ id: string }>();
  if (country.error) {
    return jsonError(502, "COUNTRY_LOOKUP_FAILED", "No se pudo consultar el pais.");
  }
  if (!country.data) {
    return jsonError(404, "COUNTRY_NOT_FOUND", "No se encontro el pais solicitado.");
  }

  const isGlobal = guard.scope.isSuperAdmin || guard.scope.isGlobalAdmin;
  if (!isGlobal && !guard.scope.countryIds.includes(body.countryId)) {
    return jsonError(403, "COUNTRY_FORBIDDEN", "No tienes permisos para gestionar este pais.");
  }

  if (body.action === "discover") {
    try {
      const candidates = await discoverRemoteLogos(body.website);
      if (candidates.length === 0) {
        return jsonError(422, "NO_LOGO_CANDIDATES", "No se encontraron logotipos en el sitio web.");
      }
      return NextResponse.json({ candidates });
    } catch (error) {
      if (isRemoteUrlValidationError(error)) {
        return jsonError(400, "INVALID_URL", "La URL del sitio web no es valida o segura.");
      }
      return jsonError(502, "REMOTE_DISCOVERY_FAILED", "No se pudo consultar el sitio web remoto.");
    }
  }

  const sourceKey = `country-representative:${body.countryId}:${createHash("sha256").update(body.imageUrl).digest("hex")}`;
  const existing = await guard.admin
    .from("drive_media_assets")
    .select("id,file_name,mime_type,byte_size,width,height,migration_status")
    .eq("source_key", sourceKey)
    .maybeSingle<ExistingAsset>();
  if (existing.error) {
    return jsonError(502, "DRIVE_LOOKUP_FAILED", "No se pudo consultar el archivo importado.");
  }
  if (existing.data?.migration_status === "verified") {
    return NextResponse.json({ asset: toAssetResponse(existing.data), reused: true });
  }
  if (existing.data) {
    return jsonError(502, "IMPORT_SOURCE_CONFLICT", "Ya existe una importacion incompleta para esta imagen.");
  }

  try {
    const image = await downloadRemoteImage(body.imageUrl);
    const uploaded = await uploadDriveImage({
      admin: guard.admin,
      input: image.buffer,
      originalName: image.fileName,
      category: "locations",
      visibility: "public",
      profileId: guard.scope.profileId,
      sourceUrl: body.imageUrl,
      sourceKey,
    });
    const stored = await guard.admin
      .from("drive_media_assets")
      .select("id,file_name,mime_type,byte_size,width,height,migration_status")
      .eq("id", uploaded.assetId)
      .maybeSingle<ExistingAsset>();
    return NextResponse.json({
      asset: stored.data ? toAssetResponse(stored.data) : uploaded,
      reused: false,
    });
  } catch (error) {
    if (isRemoteUrlValidationError(error)) {
      return jsonError(400, "INVALID_URL", "La URL de la imagen no es valida o segura.");
    }
    return jsonError(502, "IMPORT_FAILED", "No se pudo descargar o guardar la imagen.");
  }
}

function isValidBody(value: unknown): value is RequestBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  if (typeof body.countryId !== "string" || !body.countryId.trim()) return false;
  if (body.action === "discover") return typeof body.website === "string" && Boolean(body.website.trim());
  if (body.action === "import") return typeof body.imageUrl === "string" && Boolean(body.imageUrl.trim());
  return false;
}

function isRemoteUrlValidationError(error: unknown) {
  return error instanceof Error && /malformed|must use|credentials|public host|public addresses/i.test(error.message);
}

function toAssetResponse(asset: ExistingAsset) {
  return {
    id: asset.id,
    url: `/api/media/public/${asset.id}`,
    fileName: asset.file_name,
    mimeType: asset.mime_type,
    byteSize: asset.byte_size,
    width: asset.width,
    height: asset.height,
  };
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ code, error: message, message }, { status });
}
