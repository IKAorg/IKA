import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";

export async function GET(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!guard.scope.isSuperAdmin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const [connection, assets] = await Promise.all([
    guard.admin.from("google_drive_connections").select("account_email,root_folder_id,updated_at").eq("provider", "google_drive").maybeSingle(),
    guard.admin.from("drive_media_assets").select("migration_status"),
  ]);
  const counts: Record<string, number> = {};
  for (const row of (assets.data || []) as Array<{ migration_status: string }>) {
    counts[row.migration_status] = (counts[row.migration_status] || 0) + 1;
  }
  return NextResponse.json({
    connected: Boolean(connection.data),
    accountEmail: connection.data?.account_email || null,
    rootFolderId: connection.data?.root_folder_id || null,
    updatedAt: connection.data?.updated_at || null,
    counts,
  });
}
