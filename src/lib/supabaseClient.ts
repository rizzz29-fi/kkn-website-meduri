import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Guard: jika env belum diisi, jangan crash — buat client dummy yang tidak aktif
const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,   // Menginstruksikan Supabase untuk menyimpan token login di browser
      autoRefreshToken: true, // Otomatis memperbarui token token jika kedaluwarsa
      detectSessionInUrl: true
    }
  })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = isConfigured;