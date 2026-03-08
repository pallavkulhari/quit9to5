import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — blog features will not work");
}

// Server-side client uses the service role key for full access
export const supabase = createClient(
    supabaseUrl || "",
    supabaseServiceKey || "",
    { auth: { persistSession: false } }
);
