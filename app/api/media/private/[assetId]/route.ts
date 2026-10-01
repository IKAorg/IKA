import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";
import { fetchDriveAsset } from "@/lib/google-drive/media";

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) return new NextResponse(null, { status: guard.status });
  const { assetId } = await context.params;
  const result = await fetchDriveAsset(guard.admin, assetId);
  if (!result || result.asset.visibility !== "private") return new NextResponse(null, { status: 404 });
  return new NextResponse(result.buffer, {
    headers: { "content-type": result.asset.mime_type || "image/webp", "cache-control": "private, no-store" },
  });
}
