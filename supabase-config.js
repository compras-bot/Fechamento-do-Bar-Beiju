// ============================================================
// Configuração do Supabase
// ============================================================
// Onde encontrar esses valores:
// Painel do Supabase > seu projeto > Project Settings > API
//
//   SUPABASE_URL      -> "Project URL"
//   SUPABASE_ANON_KEY -> "anon public" (em "Project API keys")
//
// A anon key é PÚBLICA por design (ela vai junto no código do site),
// a segurança fica por conta das políticas de RLS criadas no schema.sql.
// ============================================================

const SUPABASE_URL = "https://hywgsscgeognazgrjmyy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oHWE8Qr_lqkQaZ5tfiAVzw_7vmho1U0";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET_FOTOS = "fotos-fechamento";
