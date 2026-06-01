import { createClient } from '@supabase/supabase-js';
// Client read-only utk server component (generateMetadata). Pakai anon key (publik, aman).
export function createServerReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}
