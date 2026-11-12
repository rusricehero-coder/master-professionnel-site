-- =====================================================================
--  MASTER PROFESSIONNEL — phase 2 : cours en direct (sessions + invitations)
--  À coller dans Supabase → SQL Editor → Run
--  Prérequis : supabase/schema.sql déjà exécuté.
-- =====================================================================

-- ---------- 1. Sessions de cours en direct ----------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  formation_id int references public.formations,
  debut timestamptz not null,
  duree_min int not null default 60 check (duree_min between 15 and 240),
  places int not null default 10 check (places between 1 and 10),
  statut text not null default 'planifiee'
    check (statut in ('planifiee', 'ouverte', 'terminee', 'annulee')),
  salle text not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_debut_idx on public.sessions (debut);

-- ---------- 2. Invitations nominatives --------------------------------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  jeton uuid not null default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  utilise_le timestamptz,
  unique (session_id, user_id)
);

create index if not exists invitations_session_idx on public.invitations (session_id);
create index if not exists invitations_user_idx on public.invitations (user_id);

-- ---------- 3. Sécurité ----------------------------------------------
alter table public.sessions enable row level security;
alter table public.invitations enable row level security;

-- Sessions : l'admin gère tout ; un apprenant ne voit que les sessions
-- auxquelles il est invité.
drop policy if exists "sessions admin" on public.sessions;
create policy "sessions admin" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sessions invite" on public.sessions;
create policy "sessions invite" on public.sessions
  for select using (
    exists (
      select 1 from public.invitations i
      where i.session_id = sessions.id and i.user_id = auth.uid()
    )
  );

-- Invitations : l'admin crée et voit tout ; l'apprenant voit les siennes.
drop policy if exists "invitations admin" on public.invitations;
create policy "invitations admin" on public.invitations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invitations apprenant" on public.invitations;
create policy "invitations apprenant" on public.invitations
  for select using (user_id = auth.uid());

-- ---------- 4. Fonction : inviter les apprenants d'une filière --------
-- Crée une invitation pour chaque apprenant dont une inscription a été
-- validée pour la filière de la session. Renvoie le nombre d'invités.
create or replace function public.inviter_apprenants(p_session uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_formation int;
  v_nb integer;
begin
  if not public.is_admin() then
    raise exception 'Reserve aux administrateurs';
  end if;

  select formation_id into v_formation from public.sessions where id = p_session;
  if v_formation is null then
    raise exception 'Session introuvable ou sans filiere';
  end if;

  insert into public.invitations (session_id, user_id)
  select p_session, i.user_id
  from public.inscriptions i
  where i.formation_id = v_formation
    and i.statut = 'validee'
  on conflict (session_id, user_id) do nothing;

  get diagnostics v_nb = row_count;
  return v_nb;
end;
$$;

-- ---------- 5. Contrôle ----------------------------------------------
-- select * from public.sessions order by debut desc;
-- select * from public.invitations;
