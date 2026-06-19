-- ============================================================
-- 0001 — Fondation : extensions, helpers, identité & rôles
-- ------------------------------------------------------------
-- Sources : legacy/src/integrations/supabase/types.ts (profiles, user_roles)
--           + conventions Supabase RBAC.
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - profiles.role / role_function SUPPRIMÉS  -> rôles via user_roles
--   - colonnes profiles.partner_* SUPPRIMÉES   -> module pro_partners
--   - PII sensibles (santé, tuteur, naissance…) isolées dans profiles_private
-- ============================================================

-- === Extensions ===
create extension if not exists pgcrypto; -- gen_random_uuid()
-- postgis est activé dans la migration communauté (radar géolocalisé).

-- === Helper : updated_at automatique ===
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- === Enums ===
create type public.app_role as enum (
  'admin', 'moderator', 'member', 'premium', 'volunteer', 'partner'
);
create type public.membership_tier as enum ('bronze', 'silver', 'gold');

-- ============================================================
-- profiles — profil public/communautaire (1:1 avec auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Identité
  username text unique,
  display_name text,
  first_name text,
  last_name text,
  avatar_url text,
  cover_image_url text,
  bio text,
  gender text,
  city text,
  pinned_city text,
  occupation_status text,

  -- Gamification & monnaie OTK
  level int not null default 1,
  xp int not null default 0,
  monthly_xp int not null default 0,
  otk_coins int not null default 0,
  total_otk_earned int not null default 0,
  otaku_class text,
  referral_count int not null default 0,
  referral_year int,
  sponsor_id uuid references public.profiles (id) on delete set null,

  -- Adhésion
  membership_tier public.membership_tier,
  membership_status text,
  is_subscription_active boolean not null default false,
  subscription_expires_at timestamptz,
  selected_pack text,
  member_since timestamptz,
  onboarding_completed boolean not null default false,

  -- Consentements & accès
  image_rights_consent boolean not null default false,
  rules_accepted boolean not null default false,
  rules_accepted_at timestamptz,
  allow_event_checkin boolean not null default true,
  qr_code_token uuid not null default gen_random_uuid() unique,

  -- Mode Otaku
  is_otaku_mode_active boolean not null default false,
  otaku_first_manga text,
  otaku_favorite_artist text,
  otaku_japan_destination text,
  otaku_japan_must_buy text,
  otaku_con_activity text,
  otaku_social_nightmare text,
  otaku_stats jsonb,
  otaku_top3 jsonb,
  favorite_manga text,
  favorite_character text,
  favorite_character_image text,
  favorite_genres text[],
  favorite_activities text[],
  best_character_id uuid,  -- FK ref_characters ajoutée en migration référentiels
  worst_character_id uuid, -- idem
  podium_lock_states jsonb,

  -- Mode Cosplayer
  is_cosplayer_mode_active boolean not null default false,
  cosplay_style text,
  cosplay_specialties text[],
  cosplay_years_experience text,
  cosplay_motivation text,
  cosplay_con_crunch text,
  cosplay_nightmare text,
  cosplay_collaboration_prefs text[],

  -- Mode Créateur
  is_creator_profile_active boolean not null default false,
  creator_domains text[],
  creator_experience_level text,
  creative_software_skills text[],
  creative_hardware_equipment text,
  creative_tool_preference text,
  creative_workflow_vibe text,
  creative_project_habit text,
  creative_commission_status text,
  creative_collaboration_types text[],
  creative_nightmare text,

  -- Mode Gamer
  is_gamer_mode_active boolean not null default false,
  gamer_favorite_genre text,
  gamer_play_style text,
  gamer_ids jsonb,
  gamer_mobile_vice text,
  gamer_rage_trigger text,
  gamer_friendship_breaker text,
  gaming_platforms text[],

  -- Social & collaboration
  social_links jsonb,
  collaboration_interests text[],
  inspiration_universes text[],

  -- Confidentialité
  privacy_settings jsonb,
  profile_visibility text not null default 'public',

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil utilisateur (1:1 avec auth.users). Rôles via user_roles, partenaires via pro_partners, PII via profiles_private.';

create index profiles_username_idx on public.profiles (username);
create index profiles_sponsor_id_idx on public.profiles (sponsor_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- profiles_private — données personnelles sensibles (self/admin)
-- ============================================================
create table public.profiles_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date,
  phone text,
  payment_method text,
  -- Tuteur légal (mineurs)
  guardian_first_name text,
  guardian_last_name text,
  guardian_relationship text,
  guardian_email text,
  guardian_phone text,
  guardian_address text,
  parental_authorization_url text,
  -- Santé (sensible)
  health_allergies text,
  health_conditions text,
  health_treatments text,
  updated_at timestamptz not null default now()
);

comment on table public.profiles_private is
  'PII sensibles (santé, tuteur, coordonnées). Lecture/écriture self + admin uniquement.';

create trigger profiles_private_updated_at
  before update on public.profiles_private
  for each row execute function public.handle_updated_at();

-- ============================================================
-- user_roles — rôles globaux (source unique de vérité)
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

-- === Helpers d'autorisation (SECURITY DEFINER pour éviter la récursion RLS) ===
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(coalesce(_user_id, auth.uid()), 'admin');
$$;

-- ============================================================
-- Création automatique du profil + rôle à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;

  insert into public.profiles_private (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.profiles_private enable row level security;
alter table public.user_roles enable row level security;

-- profiles : lecture par tout utilisateur connecté ; écriture self ; admin total.
-- TODO (data-model.md) : vue publique « safe » pour l'accès anonyme/SEO.
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles_private : self + admin uniquement.
create policy "profiles_private_self"
  on public.profiles_private for all to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- user_roles : lecture self + admin ; écriture admin uniquement.
create policy "user_roles_select_self_or_admin"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "user_roles_admin_write"
  on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
