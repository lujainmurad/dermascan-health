import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ckjfaljgbadewolmgwch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNramZhbGpnYmFkZXdvbG1nd2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQ4NzUsImV4cCI6MjA5MzIwMDg3NX0.tTuPp2V45CpMIfMwvjBkvzsQrcScc6jARyFNK6mYgJg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
