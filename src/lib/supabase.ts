import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Environment configuration resolution:
 * Resolves the Supabase URL and public client key.
 * Prefers VITE_SUPABASE_ANON_KEY, with fallback support for
 * VITE_SUPABASE_PUBLISHABLE_KEY.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ""
).trim();

/**
 * Checks whether valid Supabase connection details are available.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseKey.includes("placeholder")
);

/**
 * Clean Supabase client instance.
 * Initialized only when proper configuration is present.
 * If unconfigured, client is null and will not throw errors at module import time.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Safe accessor helper to retrieve client or null without throwing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}
