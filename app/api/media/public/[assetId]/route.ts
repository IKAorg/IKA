import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin/request-forms";
import { fetchDriveAsset } from "@/lib/google-drive/media";

export async function GET(_request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 503 });
  const { assetId } = await context.params;
  const result = await fetchDriveAsset(admin, assetId);
  if (!result || result.asset.visibility !== "public") return new NextResponse(null, { status: 404 });
  return new NextResponse(result.buffer, {
    headers: {
      "content-type": result.asset.mime_type || "image/webp",
      "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
      ...(result.asset.etag ? { etag: `\"${result.asset.etag}\"` } : {}),
    },
  });
}

