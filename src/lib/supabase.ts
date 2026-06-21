import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrqciegewjemksdabwsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fvZ5_r2zomWBELF3zzSeEA_MLEvOdxg';

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Use proxy URL in dev to bypass browser blocking/CORS
// The Supabase SDK requires an absolute URL with protocol
const supabaseUrl = isDev
  ? `${window.location.protocol}//${window.location.host}/supabase-proxy`
  : import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing with proxy:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
