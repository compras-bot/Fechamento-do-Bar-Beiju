-- ============================================================
-- Beijupirá — Fechamento do bar
-- Rode isso no Supabase: painel do projeto > SQL Editor > New query
-- Cole tudo e clique em RUN
-- (versão corrigida — não dá mais erro se rodar mais de uma vez)
-- ============================================================

-- 1) Tabela principal
create table if not exists fechamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  responsavel text,
  fluxo text,
  sem_quebras boolean default false,
  quebras text,
  desp_produtos text,
  desp_insumos text,
  prod_ok text,
  prod_iniciada text,
  prod_baixa text,
  estoque_critico text,
  limpeza_fora_padrao boolean,
  limpeza_obs text,
  atencao text,
  problema text,
  sugestao text,
  hora_fechamento text,
  foto_quebras_url text,
  foto_desp_produtos_url text,
  foto_desp_insumos_url text,
  foto_limpeza_url text,
  foto_fechamento_url text,
  criado_em timestamptz default now()
);

-- índice pra filtrar por data mais rápido no relatório
create index if not exists idx_fechamentos_data on fechamentos (data);

-- 2) Habilita RLS (Row Level Security) — obrigatório no Supabase
alter table fechamentos enable row level security;

-- 3) Políticas: como este app não tem login de usuário,
-- liberamos leitura e escrita pra quem tem a "anon key" (a chave pública do seu app).
-- Isso é seguro pro seu caso de uso (ferramenta interna do bar), mas lembre:
-- qualquer pessoa com a URL do app consegue ler/escrever nessa tabela.
drop policy if exists "permitir leitura anon" on fechamentos;
create policy "permitir leitura anon" on fechamentos
  for select using (true);

drop policy if exists "permitir insercao anon" on fechamentos;
create policy "permitir insercao anon" on fechamentos
  for insert with check (true);

-- ============================================================
-- 4) Storage — bucket para as fotos
-- Isso aqui é mais fácil de fazer pela interface:
-- Painel do Supabase > Storage > New bucket
--   nome: fotos-fechamento
--   marque "Public bucket" (assim as fotos abrem direto pela URL, igual no Firebase Storage)
--
-- Depois de criar o bucket, rode isto para liberar upload público:
-- (troque 'fotos-fechamento' se você usar outro nome de bucket)
-- ============================================================

drop policy if exists "permitir upload anon fotos" on storage.objects;
create policy "permitir upload anon fotos"
on storage.objects for insert
with check (bucket_id = 'fotos-fechamento');

drop policy if exists "permitir leitura publica fotos" on storage.objects;
create policy "permitir leitura publica fotos"
on storage.objects for select
using (bucket_id = 'fotos-fechamento');

-- ============================================================
-- 5) Múltiplas fotos por seção
-- Antes cada seção guardava só 1 URL (foto_quebras_url etc).
-- Agora guardamos uma LISTA de URLs por seção (o app já manda várias fotos).
-- As colunas antigas (*_url) continuam existindo por compatibilidade com
-- registros antigos, só não são mais usadas em registros novos.
-- Rode este bloco mesmo se a tabela já existir — é seguro rodar de novo.
-- ============================================================
alter table fechamentos add column if not exists foto_quebras_urls text[] default '{}';
alter table fechamentos add column if not exists foto_desp_produtos_urls text[] default '{}';
alter table fechamentos add column if not exists foto_desp_insumos_urls text[] default '{}';
alter table fechamentos add column if not exists foto_limpeza_urls text[] default '{}';
alter table fechamentos add column if not exists foto_fechamento_urls text[] default '{}';
