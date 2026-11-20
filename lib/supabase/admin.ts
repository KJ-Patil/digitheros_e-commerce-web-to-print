import { createClient } from "@supabase/supabase-js";

// Ensure this file is never executed on the client side
if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Admin Supabase client must never be bundled on the client side.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-service-role-key";

// Privileged server client bypassing RLS for background workers, file generators, and admin tasks
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
