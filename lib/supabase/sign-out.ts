import type { SupabaseClient } from "@supabase/supabase-js";
import { clearAdminSessionBridge } from "@/lib/supabase/admin-session-bridge";

const portalStorageKeys = ["ika-portal-cache"];

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

  clearAdminSessionBridge();

  window.location.replace(`/${locale}/portal?logged_out=1`);
}
