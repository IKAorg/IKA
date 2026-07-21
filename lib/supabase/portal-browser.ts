import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl } from "./url";

let sharedPortalClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createPortalClient() {
  if (sharedPortalClient) {
    return sharedPortalClient;
  }

  const url = getSupabaseProjectUrl() ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  sharedPortalClient = createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });

  return sharedPortalClient;
}
