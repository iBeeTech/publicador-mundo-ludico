-- =====================================================================
--  Publicador de Jogos — Escola Mundo Lúdico
--  Rode este arquivo inteiro no SQL Editor do Supabase (uma vez só).
-- =====================================================================

-- ---------- 1. Tabelas ----------

create table if not exists public.alunos (
  id                        uuid primary key default gen_random_uuid(),
  nome_completo             text not null,          -- privado: só o admin vê
  nome_exibicao             text not null,          -- público: "Gabriel S."
  turma                     text,
  autorizacao_responsavel   boolean not null default false,
  observacoes               text,
  criado_em                 timestamptz not null default now()
);

comment on column public.alunos.nome_completo is
  'Nunca exposto publicamente. A galeria usa apenas nome_exibicao.';
comment on column public.alunos.autorizacao_responsavel is
  'Sem autorização do responsável, os jogos do aluno não aparecem na galeria pública.';

create table if not exists public.jogos (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  titulo        text not null,
  descricao     text,
  pasta         text not null,            -- prefixo no Storage, ex: "a1b2c3/"
  capa_path     text,                     -- ex: "a1b2c3/icons/icon-256.png"
  largura       int  not null default 800,
  altura        int  not null default 600,
  publicado     boolean not null default false,
  bytes         bigint not null default 0,
  criado_em     timestamptz not null default now()
);

create index if not exists jogos_aluno_idx on public.jogos (aluno_id);
create index if not exists jogos_publicado_idx on public.jogos (publicado);

-- ---------- 2. Row Level Security ----------
-- Regra geral: leitura e escrita das tabelas só para quem está logado.
-- O público NÃO lê estas tabelas direto; lê a view do item 3.

alter table public.alunos enable row level security;
alter table public.jogos  enable row level security;

drop policy if exists "admin le alunos"      on public.alunos;
drop policy if exists "admin escreve alunos" on public.alunos;
create policy "admin le alunos"      on public.alunos for select to authenticated using (true);
create policy "admin escreve alunos" on public.alunos for all    to authenticated using (true) with check (true);

drop policy if exists "admin le jogos"       on public.jogos;
drop policy if exists "admin escreve jogos"  on public.jogos;
create policy "admin le jogos"       on public.jogos for select to authenticated using (true);
create policy "admin escreve jogos"  on public.jogos for all    to authenticated using (true) with check (true);

-- ---------- 3. A vitrine pública ----------
-- Uma view que expõe SÓ o necessário, e só quando as duas travas estão abertas:
-- o jogo publicado E a autorização do responsável assinada.
-- Como a view roda com os direitos do dono (security definer, padrão),
-- ela atravessa o RLS acima sem expor nome completo nem turma.

create or replace view public.vw_jogos_publicos as
select
  j.id,
  j.titulo,
  j.descricao,
  j.pasta,
  j.capa_path,
  j.largura,
  j.altura,
  j.criado_em,
  a.nome_exibicao as autor
from public.jogos j
join public.alunos a on a.id = j.aluno_id
where j.publicado = true
  and a.autorizacao_responsavel = true;

grant select on public.vw_jogos_publicos to anon, authenticated;

-- ---------- 4. Storage ----------
-- Crie o bucket pelo painel (Storage > New bucket) com nome "jogos" e
-- marque "Public bucket". Depois rode as políticas abaixo.

insert into storage.buckets (id, name, public)
values ('jogos', 'jogos', true)
on conflict (id) do update set public = true;

drop policy if exists "jogos leitura publica" on storage.objects;
create policy "jogos leitura publica"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'jogos');

drop policy if exists "jogos escrita admin" on storage.objects;
create policy "jogos escrita admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'jogos');

drop policy if exists "jogos update admin" on storage.objects;
create policy "jogos update admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'jogos');

drop policy if exists "jogos delete admin" on storage.objects;
create policy "jogos delete admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'jogos');

-- ---------- 5. Limpeza ao despublicar ----------
-- Apagar o registro do jogo não apaga os arquivos do Storage.
-- Esta função devolve a lista de caminhos para o app apagar.

create or replace function public.arquivos_do_jogo(jogo uuid)
returns table (path text)
language sql
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  join public.jogos j on j.id = jogo
  where o.bucket_id = 'jogos'
    and o.name like j.pasta || '%';
$$;

revoke all on function public.arquivos_do_jogo(uuid) from anon;
grant execute on function public.arquivos_do_jogo(uuid) to authenticated;
