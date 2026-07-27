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

const SUPABASE_URL = "https://aeyafjsmtupfrawanscg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleWFmanNtdHVwZnJhd2Fuc2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjUxMTcsImV4cCI6MjEwMDQwMTExN30.iaW0VAmLC2vuuc9GVef0EmyPv-yZuYRfczIWAAt-a8o";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET_FOTOS = "fotos-fechamento";
