import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseProjectUrl } from "./url";

function buildBrowserClient() {
  const url =
    getSupabaseProjectUrl() ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  return createBrowserClient(
    url,
    key,
  );
}

type BrowserClient = ReturnType<typeof buildBrowserClient>;

let sharedBrowserClient: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (!sharedBrowserClient) {
    sharedBrowserClient = buildBrowserClient();
  }

  return sharedBrowserClient;
}
