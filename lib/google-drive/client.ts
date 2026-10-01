import type { SupabaseAdminClient } from "@/lib/admin/request-forms";
import { decryptSecret } from "./crypto";
import { refreshAccessToken } from "./oauth";

type DriveConnection = {
  encrypted_refresh_token: string;
  token_iv: string;
  token_auth_tag: string;
};

export async function getDriveAccessToken(admin: SupabaseAdminClient) {
  const result = await admin
    .from("google_drive_connections")
    .select("encrypted_refresh_token,token_iv,token_auth_tag")
    .eq("provider", "google_drive")
    .maybeSingle();
  if (result.error || !result.data) throw new Error("Google Drive no esta conectado.");
  const connection = result.data as DriveConnection;
  const refreshToken = decryptSecret({
    encrypted: connection.encrypted_refresh_token,
    iv: connection.token_iv,
    authTag: connection.token_auth_tag,
  });
  return refreshAccessToken(refreshToken);
}

export async function driveFetch(admin: SupabaseAdminClient, url: string, init: RequestInit = {}) {
  const accessToken = await getDriveAccessToken(admin);
  return fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${accessToken}` },
  });
}

