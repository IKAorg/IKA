import { NextRequest, NextResponse } from "next/server";
import staticMedia from "@/lib/google-drive/static-media-map.json";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const sourcePath = `/images/${path.join("/")}`;
  const assetId = (staticMedia as Record<string, string>)[sourcePath];
  if (!assetId) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(new URL(`/api/media/public/${assetId}`, request.url), 307);
}
