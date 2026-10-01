import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";
import { driveFolderIds } from "@/lib/google-drive/config";
import { encryptSecret } from "@/lib/google-drive/crypto";
import { exchangeAuthorizationCode, verifyOauthState } from "@/lib/google-drive/oauth";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const savedState = request.cookies.get("ika-drive-oauth-state")?.value || "";
  const target = new URL("/es/admin?drive=connected", request.nextUrl.origin);
  if (!state || state !== savedState || !verifyOauthState(state)) {
    target.searchParams.set("drive", "invalid-state");
    return NextResponse.redirect(target);
  }
  const guard = await requireScopedAdmin(request);
  if ("error" in guard || !guard.scope.isSuperAdmin) {
    target.searchParams.set("drive", "forbidden");
    return NextResponse.redirect(target);
  }
  try {
    const redirectUri = new URL("/api/admin/google-drive/callback", request.nextUrl.origin).toString();
    const tokens = await exchangeAuthorizationCode(request.nextUrl.searchParams.get("code") || "", redirectUri);
    const encrypted = encryptSecret(tokens.refresh_token!);
    const userInfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    const user = (await userInfo.json()) as { email?: string };
    const saved = await guard.admin.from("google_drive_connections").upsert({
      provider: "google_drive",
      account_email: user.email || null,
      encrypted_refresh_token: encrypted.encrypted,
      token_iv: encrypted.iv,
      token_auth_tag: encrypted.authTag,
      root_folder_id: driveFolderIds.root,
      folder_map: driveFolderIds,
      connected_by: guard.scope.profileId,
    }, { onConflict: "provider" });
    if (saved.error) throw saved.error;
  } catch (error) {
    target.searchParams.set("drive", "error");
    target.searchParams.set("message", error instanceof Error ? error.message : "Error desconocido");
  }
  const response = NextResponse.redirect(target);
  response.cookies.delete("ika-drive-oauth-state");
  return response;
}

