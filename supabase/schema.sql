-- =====================================================================
--  MASTER PROFESSIONNEL — schéma Supabase (phase 1)
--  À coller intégralement dans : Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- 1. Profils ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nom text,
  telephone text,
  email text,
  role text not null default 'apprenant' check (role in ('apprenant', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------- 2. Catalogue des formations -------------------------------
create table if not exists public.formations (
  id serial primary key,
  slug text unique not null,
  nom text not null,
  duree text,
  prix text,
  actif boolean not null default true
);

-- ---------- 3. Inscriptions -------------------------------------------
create table if not exists public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_id int not null references public.formations,
  rythme text default 'Jour',
  message text,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'validee', 'refusee')),
  created_at timestamptz not null default now()
);

create index if not exists inscriptions_user_idx on public.inscriptions (user_id);
create index if not exists inscriptions_statut_idx on public.inscriptions (statut);

-- ---------- 4. Sécurité : RLS -----------------------------------------
alter table public.profiles enable row level security;
alter table public.formations enable row level security;
alter table public.inscriptions enable row level security;

-- L'utilisateur connecté est-il administrateur ?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profils
drop policy if exists "profil lecture" on public.profiles;
create policy "profil lecture" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profil creation" on public.profiles;
create policy "profil creation" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profil mise a jour" on public.profiles;
create policy "profil mise a jour" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Empêche un apprenant de se promouvoir administrateur.
-- La protection ne s'applique qu'aux requêtes venant du site (auth.uid() renseigné) :
-- dans le SQL Editor, auth.uid() est vide, ce qui permet la promotion manuelle.
create or replace function public.proteger_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_role_trigger on public.profiles;
create trigger proteger_role_trigger
  before update on public.profiles
  for each row execute function public.proteger_role();

-- Formations : lecture publique, écriture réservée à l'admin
drop policy if exists "formations lecture" on public.formations;
create policy "formations lecture" on public.formations
  for select using (true);

drop policy if exists "formations admin" on public.formations;
create policy "formations admin" on public.formations
  for all using (public.is_admin()) with check (public.is_admin());

-- Inscriptions
drop policy if exists "inscription creation" on public.inscriptions;
create policy "inscription creation" on public.inscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists "inscription lecture" on public.inscriptions;
create policy "inscription lecture" on public.inscriptions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "inscription admin maj" on public.inscriptions;
create policy "inscription admin maj" on public.inscriptions
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inscription admin suppression" on public.inscriptions;
create policy "inscription admin suppression" on public.inscriptions
  for delete using (public.is_admin());

-- ---------- 5. Création automatique du profil à l'inscription ---------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom, telephone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    coalesce(new.raw_user_meta_data ->> 'telephone', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 6. Catalogue des 13 filières ------------------------------
insert into public.formations (slug, nom, duree, prix) values
  ('initiation-informatique', 'Initiation à l''informatique', '1 mois', '5 000 FCFA'),
  ('secretariat-bureautique', 'Secrétariat bureautique', '3 mois', '30 000 FCFA'),
  ('graphisme-design', 'Graphisme & design', '6 mois', '120 000 FCFA'),
  ('maintenance-informatique-reseaux', 'Maintenance informatique & réseaux', '12 mois', '150 000 FCFA'),
  ('mecanographie-copieurs', 'Mécanographie & copieurs', '6 mois', '150 000 FCFA'),
  ('reseaux-administration', 'Réseaux & administration', '9 mois', '250 000 FCFA'),
  ('cybersecurite-robotique-electronique', 'Cybersécurité, robotique & électronique', '12 mois', '350 000 FCFA'),
  ('cameras-surveillance-gps', 'Caméras de surveillance & GPS', '2 mois', '70 000 FCFA'),
  ('developpement-web-applications', 'Développement web & applications', '3 à 9 mois', '250 000 à 350 000 FCFA'),
  ('graphisme-2d-3d', 'Graphisme 2D & 3D', '3 à 6 mois', '120 000 FCFA'),
  ('informatique-comptable', 'Informatique comptable', '5 jours à 3 mois', '25 000 à 50 000 FCFA'),
  ('graphisme-mobile-b-pro', 'Graphisme mobile B+Pro', '1 mois', '25 000 FCFA'),
  ('intelligence-artificielle', 'Intelligence artificielle', '2 semaines', '20 000 FCFA')
on conflict (slug) do nothing;

-- ---------- 7. Se nommer administrateur (à faire UNE fois) ------------
-- 1) crée ton compte via /espace/
-- 2) remplace l'e-mail ci-dessous, puis exécute :
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'rusricehero@gmail.com');
