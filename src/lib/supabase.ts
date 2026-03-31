import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://isfwhwtmbuhpnvpghcpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZndod3RtYnVocG52cGdoY3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODcyNjMsImV4cCI6MjA5MDM2MzI2M30.TqCk67XZNg971t8XcUnQV89HyqdALnrRn9xRZXlF418';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
