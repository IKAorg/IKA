import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseProjectUrl } from "./url";

export function createClient() {
  const url =
    getSupabaseProjectUrl() ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  return createBrowserClient(
    url,
    key,
  );
}
