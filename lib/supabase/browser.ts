import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseProjectUrl } from "./url";

export function createClient() {
  return createBrowserClient(
    getSupabaseProjectUrl()!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
