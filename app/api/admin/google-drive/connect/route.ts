import { NextRequest, NextResponse } from "next/server";
import { requireScopedAdmin } from "@/lib/admin/request-forms";
import { createOauthState, getGoogleAuthorizationUrl } from "@/lib/google-drive/oauth";

export async function GET(request: NextRequest) {
  const guard = await requireScopedAdmin(request);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!guard.scope.isSuperAdmin || !guard.scope.director) {
    return NextResponse.json({ error: "Solo un super admin con PIN validado puede conectar Drive." }, { status: 403 });
  }
  const state = createOauthState();
  const redirectUri = new URL("/api/admin/google-drive/callback", request.nextUrl.origin).toString();
  const response = NextResponse.redirect(getGoogleAuthorizationUrl(redirectUri, state));
  response.cookies.set("ika-drive-oauth-state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/google-drive",
    maxAge: 600,
  });
  return response;
}

