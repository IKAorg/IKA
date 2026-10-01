import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";
import { driveFolderIds, type DriveMediaCategory } from "@/lib/google-drive/config";
import { uploadDriveImage } from "@/lib/google-drive/media";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const form = await request.formData();
  const file = form.get("file");
  const category = String(form.get("category") || "") as DriveMediaCategory;
  const visibility = form.get("visibility") === "private" ? "private" : "public";
  if (!(file instanceof File) || !(category in driveFolderIds) || ["root", "public", "private"].includes(category)) {
    return NextResponse.json({ error: "Imagen o categoria no valida." }, { status: 400 });
  }
  if (visibility === "private" && category !== "profiles") {
    return NextResponse.json({ error: "La categoria privada no es valida." }, { status: 400 });
  }
  try {
    const result = await uploadDriveImage({
      admin: guard.admin,
      input: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
      category,
      visibility,
      memberId: String(form.get("memberId") || "") || null,
      profileId: guard.scope.profileId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo subir la imagen." }, { status: 502 });
  }
}

