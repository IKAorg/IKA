import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireScopedAdmin } from "@/lib/admin/request-forms";
import { fetchDriveAsset } from "@/lib/google-drive/media";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params;
  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 503 });
  const assetResult = await admin.from("drive_media_assets")
    .select("member_id,visibility").eq("id", assetId).maybeSingle();
  const asset = assetResult.data as { member_id: string | null; visibility: string } | null;
  if (!asset?.member_id || asset.visibility !== "private") return new NextResponse(null, { status: 404 });

  let allowed = false;
  const guard = await requireScopedAdmin(request);
  if (!("error" in guard)) {
    if (guard.scope.isSuperAdmin || guard.scope.isGlobalAdmin) {
      allowed = true;
    } else {
      const member = await admin.from("members").select("country_id,dojo_id").eq("id", asset.member_id).maybeSingle();
      const scoped = member.data as { country_id: string | null; dojo_id: string | null } | null;
      allowed = Boolean(
        scoped &&
        ((scoped.country_id && guard.scope.countryIds.includes(scoped.country_id)) ||
          (scoped.dojo_id && guard.scope.dojoIds.includes(scoped.dojo_id))),
      );
    }
  } else {
    const session = await createSessionClient();
    const { data: { user } } = await session.auth.getUser();
    if (user) {
      const profiles = await admin.from("users_profiles").select("id,email").eq("auth_user_id", user.id);
      const ids = ((profiles.data || []) as Array<{ id: string }>).map((profile) => profile.id);
      if (ids.length) {
        const ownMember = await admin.from("members").select("id").eq("id", asset.member_id).in("profile_id", ids).maybeSingle();
        allowed = Boolean(ownMember.data);
      }
    }
  }
  if (!allowed) return new NextResponse(null, { status: 403 });
  const result = await fetchDriveAsset(admin, assetId);
  if (!result || result.asset.visibility !== "private") return new NextResponse(null, { status: 404 });
  return new NextResponse(result.buffer, {
    headers: { "content-type": result.asset.mime_type || "image/webp", "cache-control": "private, no-store" },
  });
}
