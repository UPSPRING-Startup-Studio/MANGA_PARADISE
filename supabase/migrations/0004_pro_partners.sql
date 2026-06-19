-- ============================================================
-- 0004 — Partenaires professionnels : structures, membres, candidatures
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (pro_partners,
--     pro_partner_members, pro_partner_applications — schéma consolidé).
--   - legacy migrations (vérité pour le schéma) :
--       20260406_pro_partners_module_v1,
--       20260409_pro_partners_v2_consolidation,
--       20260409_pro_partners_v3_crm_socials,
--       20260415_admin_status_governance,
--       20260416_admin_status_rls_phase3_hardening.
--   - IGNORÉ : 20260409_import_45_partners (données — non reprises).
-- Dépendances : 0001 (profiles, is_admin, handle_updated_at),
--   0003 (enum admin_status).
-- ------------------------------------------------------------
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - Admin plateforme via is_admin() (0001) au lieu des helpers legacy
--     (is_global_association_admin / superadmin) lisant profiles.role.
--   - Colonnes des ALTER successifs (v2 governance + v3 CRM/socials)
--     consolidées dans le CREATE TABLE.
--   - Trigger updated_at unifié sur handle_updated_at() (0001).
--   - Enum admin_status réutilisé depuis 0003 ; admin_status est donc
--     un enum PG (et non text+check).
--   - Soft-delete (deleted_at / deleted_by / deletion_reason).
-- ============================================================


-- ============================================================
-- pro_partners — fiches structures professionnelles partenaires
-- ============================================================
create table public.pro_partners (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  name text not null,
  slug text not null unique,
  type text not null default 'societe'
    check (type in (
      'societe', 'association', 'auto_entrepreneur',
      'institution', 'collectivite', 'boutique',
      'lieu_culturel', 'media', 'autre'
    )),
  description text,
  description_long text,
  member_benefit text,
  logo_url text,
  banner_url text,

  -- Catégorisation annuaire
  directory_category text check (
    directory_category is null or directory_category in (
      'acteurs_publics', 'boutiques_librairies', 'cinemas',
      'restauration', 'partenaires_associatifs', 'artistes_createurs',
      'evenements_lieux_culturels', 'entreprises_marques'
    )
  ),
  subcategories text[] not null default '{}',

  -- Identifiants légaux
  siret text,

  -- Coordonnées
  address text,
  city text,
  postal_code text,
  region text,
  email text,
  phone text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,

  -- Réseaux sociaux (colonnes directes, queryables)
  facebook_url text default '',
  instagram_url text default '',
  twitter_url text default '',
  tiktok_url text default '',
  youtube_url text default '',
  linkedin_url text default '',

  -- Pipeline CRM interne
  partner_status text not null default 'opportunite'
    check (partner_status in (
      'opportunite', 'mail_envoye', 'en_cours_edition',
      'attente_signature', 'accord_principe', 'convention_signee'
    )),
  partner_offers text default '',
  mp_offers text default '',

  -- Statut métier & visibilité
  status text not null default 'active'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  is_public boolean not null default false,
  is_featured boolean not null default false,

  -- Gouvernance plateforme (enum admin_status défini en 0003)
  admin_status public.admin_status not null default 'active',
  admin_status_reason text,
  admin_status_changed_at timestamptz,
  admin_status_changed_by uuid references public.profiles (id) on delete set null,
  admin_notes text,

  -- Soft-delete
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,

  -- Métadonnées
  source_import text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pro_partners is
  'Structures professionnelles partenaires (sociétés, boutiques, institutions, lieux culturels…). Gouvernance via admin_status, soft-delete via deleted_at.';

create index pro_partners_slug_idx on public.pro_partners (slug);
create index pro_partners_status_idx on public.pro_partners (status);
create index pro_partners_type_idx on public.pro_partners (type);
create index pro_partners_city_idx on public.pro_partners (city);
create index pro_partners_created_by_idx on public.pro_partners (created_by);
create index pro_partners_admin_status_idx on public.pro_partners (admin_status);
create index pro_partners_partner_status_idx on public.pro_partners (partner_status);
create index pro_partners_directory_category_idx
  on public.pro_partners (directory_category) where directory_category is not null;
create index pro_partners_subcategories_idx on public.pro_partners using gin (subcategories);
create index pro_partners_is_public_idx on public.pro_partners (is_public) where is_public = true;
create index pro_partners_featured_idx on public.pro_partners (is_featured) where is_featured = true;
create index pro_partners_deleted_at_idx on public.pro_partners (deleted_at) where deleted_at is null;

create trigger pro_partners_updated_at
  before update on public.pro_partners
  for each row execute function public.handle_updated_at();


-- ============================================================
-- pro_partner_members — utilisateurs rattachés à une structure
-- ============================================================
create table public.pro_partner_members (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.pro_partners (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'manager', 'member')),
  title text,
  notes text,
  is_active boolean not null default true,
  membership_status text not null default 'active'
    check (membership_status in ('invited', 'active', 'inactive', 'left', 'revoked')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, user_id)
);

comment on table public.pro_partner_members is
  'Liaison utilisateurs ↔ structures partenaires (rôle owner/admin/manager/member).';

create index pro_partner_members_partner_idx on public.pro_partner_members (partner_id);
create index pro_partner_members_user_idx on public.pro_partner_members (user_id);
create index pro_partner_members_status_idx on public.pro_partner_members (membership_status);
create index pro_partner_members_active_idx
  on public.pro_partner_members (partner_id, user_id) where is_active = true;

create trigger pro_partner_members_updated_at
  before update on public.pro_partner_members
  for each row execute function public.handle_updated_at();

-- Synchronisation membership_status ↔ is_active / left_at (UPDATE).
create or replace function public.sync_pro_partner_membership_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.membership_status is distinct from old.membership_status then
    case new.membership_status
      when 'active' then
        new.is_active = true;
        new.left_at = null;
      when 'invited' then new.is_active = false;
      when 'inactive' then new.is_active = false;
      when 'left' then
        new.is_active = false;
        if new.left_at is null then new.left_at = now(); end if;
      when 'revoked' then
        new.is_active = false;
        if new.left_at is null then new.left_at = now(); end if;
    end case;
  elsif tg_op = 'UPDATE' and new.is_active is distinct from old.is_active then
    if new.is_active = false and new.membership_status = 'active' then
      new.membership_status = 'inactive';
    elsif new.is_active = true and new.membership_status <> 'active' then
      new.membership_status = 'active';
    end if;
  end if;
  return new;
end;
$$;

create trigger pro_partner_members_sync_status
  before update on public.pro_partner_members
  for each row execute function public.sync_pro_partner_membership_status();


-- ============================================================
-- pro_partner_applications — demandes "Devenir partenaire"
-- ============================================================
create table public.pro_partner_applications (
  id uuid primary key default gen_random_uuid(),

  -- Infos structure
  company_name text not null,
  company_type text not null default 'societe'
    check (company_type in (
      'societe', 'association', 'institution',
      'boutique', 'lieu_culturel', 'media', 'autre'
    )),
  siret text,
  description text,

  -- Contact
  contact_first_name text not null,
  contact_last_name text not null,
  contact_email text not null,
  contact_phone text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  message text,

  -- Workflow
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,

  -- Liens
  partner_id uuid references public.pro_partners (id) on delete set null,
  submitted_by uuid references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pro_partner_applications is
  'Demandes "Devenir partenaire" en attente de validation par un admin plateforme.';

create index pro_partner_apps_status_idx on public.pro_partner_applications (status);
create index pro_partner_apps_email_idx on public.pro_partner_applications (contact_email);
create index pro_partner_apps_partner_idx on public.pro_partner_applications (partner_id);
create index pro_partner_apps_submitted_by_idx on public.pro_partner_applications (submitted_by);
create index pro_partner_apps_created_idx on public.pro_partner_applications (created_at desc);

create trigger pro_partner_apps_updated_at
  before update on public.pro_partner_applications
  for each row execute function public.handle_updated_at();


-- ============================================================
-- Helpers d'autorisation (SECURITY DEFINER → anti-récursion RLS)
-- ------------------------------------------------------------
-- Rôles partenaire : owner > admin > manager > member.
--   - admin du partenaire = owner / admin
--   - membre = appartenance active
-- L'admin plateforme (is_admin(), 0001) bypasse ces contrôles.
-- ============================================================

-- is_pro_partner_member : appartenance active au partenaire.
create or replace function public.is_pro_partner_member(_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_partner_members
    where partner_id = _partner_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- has_pro_partner_role : possède un des rôles donnés dans le partenaire.
create or replace function public.has_pro_partner_role(_partner_id uuid, _roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_partner_members
    where partner_id = _partner_id
      and user_id = auth.uid()
      and is_active = true
      and role = any (_roles)
  );
$$;

-- is_pro_partner_admin : admin du partenaire (owner/admin) OU admin plateforme.
-- Signature exacte attendue par 0005_events_core.sql.
create or replace function public.is_pro_partner_admin(_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.has_pro_partner_role(_partner_id, array['owner', 'admin']);
$$;

-- is_pro_partner_writable : partenaire ni bloqué ni supprimé.
create or replace function public.is_pro_partner_writable(_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_partners
    where id = _partner_id
      and admin_status <> 'blocked'
      and deleted_at is null
  );
$$;

-- is_pro_partner_restricted : partenaire sous restriction administrative.
create or replace function public.is_pro_partner_restricted(_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_partners
    where id = _partner_id
      and admin_status = 'restricted'
  );
$$;


-- ============================================================
-- RLS
-- ============================================================
alter table public.pro_partners enable row level security;
alter table public.pro_partner_members enable row level security;
alter table public.pro_partner_applications enable row level security;

-- ---- pro_partners ----
-- SELECT : admin plateforme voit tout ; sinon non supprimés + (public
--          OU membre OU draft du créateur).
create policy "pro_partners_select"
  on public.pro_partners for select to authenticated
  using (
    public.is_admin()
    or (
      deleted_at is null
      and (
        is_public = true
        or public.is_pro_partner_member(id)
        or (status = 'draft' and created_by = auth.uid())
      )
    )
  );

-- Partenaires actifs & publics lisibles publiquement (accès anonyme).
create policy "pro_partners_select_public_anon"
  on public.pro_partners for select to anon
  using (status = 'active' and is_public = true and deleted_at is null);

-- INSERT : admin plateforme uniquement (créés après validation d'une candidature).
create policy "pro_partners_insert_admin"
  on public.pro_partners for insert to authenticated
  with check (public.is_admin());

-- UPDATE : admin plateforme OU (owner/admin du partenaire ET partenaire writable).
create policy "pro_partners_update"
  on public.pro_partners for update to authenticated
  using (
    public.is_admin()
    or (public.has_pro_partner_role(id, array['owner', 'admin'])
        and public.is_pro_partner_writable(id))
  )
  with check (
    public.is_admin()
    or (public.has_pro_partner_role(id, array['owner', 'admin'])
        and public.is_pro_partner_writable(id))
  );

-- DELETE : admin plateforme uniquement (préférer le soft-delete).
create policy "pro_partners_delete_admin"
  on public.pro_partners for delete to authenticated
  using (public.is_admin());

-- ---- pro_partner_members ----
-- SELECT : self OU membre du même partenaire OU admin plateforme.
create policy "pro_partner_members_select"
  on public.pro_partner_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_pro_partner_member(partner_id)
  );

-- INSERT : admin plateforme OU (owner/admin ET partenaire writable ET non restreint).
create policy "pro_partner_members_insert"
  on public.pro_partner_members for insert to authenticated
  with check (
    public.is_admin()
    or (public.has_pro_partner_role(partner_id, array['owner', 'admin'])
        and public.is_pro_partner_writable(partner_id)
        and not public.is_pro_partner_restricted(partner_id))
  );

-- UPDATE : admin plateforme OU (owner/admin ET writable) OU self-leave (désactivation).
create policy "pro_partner_members_update"
  on public.pro_partner_members for update to authenticated
  using (
    public.is_admin()
    or (public.has_pro_partner_role(partner_id, array['owner', 'admin'])
        and public.is_pro_partner_writable(partner_id))
    or (user_id = auth.uid() and public.is_pro_partner_writable(partner_id))
  )
  with check (
    public.is_admin()
    or (public.has_pro_partner_role(partner_id, array['owner', 'admin'])
        and public.is_pro_partner_writable(partner_id))
    or (user_id = auth.uid() and is_active = false and public.is_pro_partner_writable(partner_id))
  );

-- DELETE : admin plateforme OU (owner ET writable).
create policy "pro_partner_members_delete"
  on public.pro_partner_members for delete to authenticated
  using (
    public.is_admin()
    or (public.has_pro_partner_role(partner_id, array['owner'])
        and public.is_pro_partner_writable(partner_id))
  );

-- ---- pro_partner_applications ----
-- SELECT : admin plateforme OU le soumetteur.
create policy "pro_partner_apps_select"
  on public.pro_partner_applications for select to authenticated
  using (public.is_admin() or submitted_by = auth.uid());

-- INSERT : tout utilisateur authentifié peut déposer une candidature.
create policy "pro_partner_apps_insert"
  on public.pro_partner_applications for insert to authenticated
  with check (true);

-- UPDATE : admin plateforme uniquement (approuver/refuser).
create policy "pro_partner_apps_update_admin"
  on public.pro_partner_applications for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE : admin plateforme uniquement.
create policy "pro_partner_apps_delete_admin"
  on public.pro_partner_applications for delete to authenticated
  using (public.is_admin());
