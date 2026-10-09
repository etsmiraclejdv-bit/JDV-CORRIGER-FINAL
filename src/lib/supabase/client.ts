import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Do not use ReturnType<typeof createClient> here: extracting the return type
// of this generic factory loses its schema generics and can make table/RPC
// operations resolve to never/undefined throughout the application.
let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

export const supabase = getSupabaseClient();
export { createClient };
