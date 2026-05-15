import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the **service role** key.
 * NEVER import this from a client component. Used to generate magic links
 * for inviting clients to the portal.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY env var. Add it from Supabase → Project Settings → API.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
