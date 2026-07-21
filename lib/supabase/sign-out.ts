import type { SupabaseClient } from "@supabase/supabase-js";

const portalStorageKeys = ["ika-portal-cache", "ika-admin-session-bridge"];

export async function signOutAndRedirect(
  supabase: SupabaseClient,
  locale: string,
) {
  // Clearing the local session must not depend on a slow network request.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

  if (typeof window === "undefined") {
    return;
  }

  for (const key of portalStorageKeys) {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  }

  window.location.replace(`/${locale}/portal?logged_out=1`);
}
