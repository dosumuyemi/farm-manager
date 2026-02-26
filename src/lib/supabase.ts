// Supabase client - Optional, app works without it
// Uses dynamic import to avoid build errors

let supabaseInstance: any = null;

function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Dynamic require - only runs when actually needed
      const createClient = require('@supabase/supabase-js').createClient;
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      // Supabase package not available
    }
  }
  
  return supabaseInstance;
}

export const isSupabaseConfigured = !!(getEnvVar('NEXT_PUBLIC_SUPABASE_URL') && getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
