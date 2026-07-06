import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl } from "./url";

export function createPortalClient() {
  const url = getSupabaseProjectUrl() ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  return createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}
