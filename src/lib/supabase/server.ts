import { createServerClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Session-aware client — respects RLS as the signed-in user. Use for anything
// scoped to "what can this user see".
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render (no response to attach
            // Set-Cookie to) — session refresh will retry from a Server
            // Function or Route Handler instead.
          }
        },
      },
    },
  );
}

// Service-role client — bypasses RLS. Only for server-only operations that
// must run regardless of the caller's own row visibility, e.g. writing an
// audit_log row for a clinical-record open. Never expose to the client.
export function createAdminClient() {
  return createRawClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
