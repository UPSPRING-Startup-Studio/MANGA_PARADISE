-- ============================================================
-- 0014 — Divers : abonnés newsletter & préférences utilisateur
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts
--       newsletter_subscribers (~L2196), user_preferences (~L3354).
-- Dépendances : 0001 (profiles, is_admin, handle_updated_at).
-- ------------------------------------------------------------
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - RLS : user_preferences = self + admin ; newsletter = INSERT public
--     (abonnement libre) + lecture réservée à l'admin plateforme.
--   - Email newsletter normalisé (lower/trim) + unique.
-- ============================================================


-- ============================================================
-- newsletter_subscribers — abonnés à la newsletter (abonnement public)
-- ============================================================
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  source text,  -- provenance de l'abonnement (formulaire, landing…)
  subscribed_at timestamptz not null default now()
);

comment on table public.newsletter_subscribers is
  'Abonnés newsletter. INSERT public (abonnement libre) ; lecture réservée à l''admin plateforme.';

create index newsletter_subscribers_active_idx
  on public.newsletter_subscribers (is_active) where is_active = true;

-- Normalisation de l'email (lower/trim) avant insertion/mise à jour.
create or replace function public.normalize_newsletter_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email = lower(trim(new.email));
  end if;
  return new;
end;
$$;

create trigger newsletter_subscribers_normalize_email
  before insert or update on public.newsletter_subscribers
  for each row execute function public.normalize_newsletter_email();


-- ============================================================
-- user_preferences — préférences & historique de navigation (1:1)
-- ============================================================
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  favorite_categories text[] not null default '{}',
  interests text[] not null default '{}',
  viewed_events uuid[] not null default '{}',
  viewed_products uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is
  'Préférences & historique de navigation d''un utilisateur (1:1). Accès self + admin.';

create index user_preferences_user_id_idx on public.user_preferences (user_id);

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();


-- ============================================================
-- RLS
-- ============================================================
alter table public.newsletter_subscribers enable row level security;
alter table public.user_preferences enable row level security;

-- ---- newsletter_subscribers ----
-- INSERT : abonnement public (anon + authentifié).
create policy "newsletter_subscribers_insert_public"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

-- SELECT / UPDATE / DELETE : admin plateforme uniquement (données de contact).
create policy "newsletter_subscribers_admin_select"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());
create policy "newsletter_subscribers_admin_write"
  on public.newsletter_subscribers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- user_preferences ----
-- self + admin (lecture & écriture).
create policy "user_preferences_select_self_or_admin"
  on public.user_preferences for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "user_preferences_modify_self_or_admin"
  on public.user_preferences for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
