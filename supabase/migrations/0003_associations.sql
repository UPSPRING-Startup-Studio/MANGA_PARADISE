-- ============================================================
-- 0003 — Associations : fiches, membres, invitations, contacts,
--        documents, configuration de fiche publique
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (colonnes de base :
--     associations, association_contacts, association_documents,
--     association_invitations, association_memberships ; enums associés).
--   - legacy migrations (vérité pour le schéma enrichi) :
--       20260403_association_module_foundation,
--       20260403_association_admin_bootstrap,
--       20260403_fix_association_memberships_rls,
--       20260404_association_module_v2_enrichment,
--       20260404_association_module_v3_consolidation,
--       20260405_association_fiche_config,
--       20260406_association_module_v4_realign,
--       20260406_association_module_v5_members_volunteers,
--       20260406_fix_members_insert_rls,
--       20260415_admin_status_governance,
--       20260416_admin_status_rls_phase3_hardening.
-- Dépendances : 0001 (profiles, is_admin, handle_updated_at).
-- ------------------------------------------------------------
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - Admin plateforme via is_admin() (0001) au lieu des anciens
--     helpers is_platform_admin / is_global_admin / is_global_association_admin
--     qui lisaient profiles.role / role_function (colonnes SUPPRIMÉES).
--   - Colonnes des multiples ALTER (v2→v5 + governance) consolidées
--     directement dans les CREATE TABLE.
--   - Trigger updated_at unifié sur handle_updated_at() (0001).
--   - Enums PG pour les ensembles stables (rôle, statuts, admin_status).
--   - Soft-delete (deleted_at / deleted_by / deletion_reason) sur associations.
--   - Vues/triggers d'audit legacy NON repris (hors périmètre de ce module).
-- ============================================================


-- ============================================================
-- Enums
-- ============================================================

-- Rôle d'un membre dans une association (vocabulaire métier FR).
create type public.association_role as enum (
  'president', 'vice_president', 'tresorier',
  'secretaire', 'responsable', 'benevole', 'membre'
);

-- Statut d'une invitation.
create type public.association_invitation_status as enum (
  'pending', 'accepted', 'rejected', 'expired', 'cancelled'
);

-- Statut d'un document d'association.
create type public.association_document_status as enum (
  'draft', 'pending_review', 'approved', 'rejected', 'archived'
);

-- Type d'un contact CRM d'association.
create type public.association_contact_type as enum (
  'partenaire', 'fournisseur', 'institution',
  'media', 'sponsor', 'intervenant', 'autre'
);

-- Gouvernance plateforme (indépendante du status métier de l'asso).
create type public.admin_status as enum ('active', 'restricted', 'blocked');


-- ============================================================
-- associations — fiche d'une association
-- ============================================================
create table public.associations (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  logo_url text,
  banner_url text,
  association_type text check (
    association_type in ('association1901', 'collectif', 'entreprise', 'autre')
  ),

  -- Identifiants légaux
  siret text,
  rna_number text,

  -- Coordonnées
  address text,
  city text,
  postal_code text,
  region text,
  country text default 'France',
  email text,
  phone text,
  website_url text,
  instagram_url text,
  discord_url text,
  social_links jsonb not null default '{}'::jsonb,

  -- Statut métier & visibilité
  status text not null default 'active'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  is_public boolean not null default false,
  founded_at date,

  -- Propriété
  created_by uuid references public.profiles (id) on delete set null,
  owner_user_id uuid references public.profiles (id) on delete set null,

  -- Gouvernance plateforme
  admin_status public.admin_status not null default 'active',
  admin_status_reason text,
  admin_status_changed_at timestamptz,
  admin_status_changed_by uuid references public.profiles (id) on delete set null,
  admin_notes text,

  -- Soft-delete
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deletion_reason text,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_associations_name_nonempty check (length(trim(name)) >= 1),
  constraint chk_associations_slug_format check (
    slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' or length(slug) <= 2
  )
);

comment on table public.associations is
  'Fiches associations. Admin plateforme via is_admin() ; gouvernance via admin_status ; soft-delete via deleted_at.';

create index associations_slug_idx on public.associations (slug);
create index associations_city_idx on public.associations (city);
create index associations_status_idx on public.associations (status);
create index associations_type_idx on public.associations (association_type);
create index associations_created_by_idx on public.associations (created_by);
create index associations_owner_idx on public.associations (owner_user_id);
create index associations_admin_status_idx on public.associations (admin_status);
create index associations_deleted_at_idx on public.associations (deleted_at);
create index associations_is_public_idx on public.associations (is_public) where is_public = true;

create trigger associations_updated_at
  before update on public.associations
  for each row execute function public.handle_updated_at();


-- ============================================================
-- association_memberships — appartenance d'un utilisateur à une asso
-- ============================================================
create table public.association_memberships (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- Rôle & statut
  role public.association_role not null default 'membre',
  title text,
  is_active boolean not null default true,
  is_primary boolean not null default false,
  membership_status text not null default 'active'
    check (membership_status in ('invited', 'active', 'inactive', 'left', 'revoked')),

  -- Parcours d'engagement (fan → bureau)
  engagement_level text not null default 'membre'
    check (engagement_level in (
      'membre', 'adherent', 'benevole_occasionnel',
      'benevole_actif', 'staff', 'bureau'
    )),
  belonging_status text not null default 'valide'
    check (belonging_status in (
      'invite', 'dossier_commence', 'a_valider',
      'valide', 'refuse', 'archive'
    )),

  -- Données pop culture / bénévolat
  interests text[] not null default '{}',
  participation_preferences text[] not null default '{}',
  availability jsonb not null default '{}'::jsonb,
  volunteer_experience text not null default 'debutant'
    check (volunteer_experience in ('debutant', 'intermediaire', 'confirme', 'expert')),
  languages text[] not null default '{francais}',
  consent_photo boolean not null default false,
  skills text[] not null default '{}',

  -- Données bureau / mandat
  mandate_start date,
  mandate_end date,
  public_visibility boolean not null default false,
  display_order integer not null default 999,

  -- Cycle de vie
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (association_id, user_id)
);

comment on table public.association_memberships is
  'Appartenance utilisateur ↔ association (rôle, engagement, données bénévole/bureau).';

create index assoc_memberships_association_idx on public.association_memberships (association_id);
create index assoc_memberships_user_idx on public.association_memberships (user_id);
create index assoc_memberships_role_idx on public.association_memberships (role);
create index assoc_memberships_assoc_active_idx on public.association_memberships (association_id, is_active);
create index assoc_memberships_user_active_idx on public.association_memberships (user_id, is_active);
create index assoc_memberships_status_idx on public.association_memberships (membership_status);
create index assoc_memberships_engagement_idx on public.association_memberships (engagement_level);
create index assoc_memberships_belonging_idx on public.association_memberships (belonging_status);
create index assoc_memberships_interests_idx on public.association_memberships using gin (interests);
create index assoc_memberships_skills_idx on public.association_memberships using gin (skills);
create unique index assoc_memberships_primary_idx
  on public.association_memberships (user_id) where is_primary = true;
create index assoc_memberships_display_order_idx
  on public.association_memberships (association_id, display_order) where public_visibility = true;

create trigger assoc_memberships_updated_at
  before update on public.association_memberships
  for each row execute function public.handle_updated_at();

-- Synchronisation engagement_level depuis le rôle (INSERT/UPDATE).
create or replace function public.sync_engagement_from_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.role is distinct from old.role) then
    new.engagement_level = case new.role
      when 'president' then 'bureau'
      when 'vice_president' then 'bureau'
      when 'tresorier' then 'bureau'
      when 'secretaire' then 'bureau'
      when 'responsable' then 'staff'
      when 'benevole' then 'benevole_actif'
      else coalesce(new.engagement_level, 'membre')
    end;
    if new.role in ('president', 'vice_president', 'tresorier', 'secretaire') then
      new.public_visibility = true;
    end if;
  end if;
  return new;
end;
$$;

create trigger assoc_memberships_sync_engagement
  before insert or update on public.association_memberships
  for each row execute function public.sync_engagement_from_role();

-- Synchronisation membership_status ↔ is_active / left_at (UPDATE).
create or replace function public.sync_membership_status()
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

create trigger assoc_memberships_sync_status
  before update on public.association_memberships
  for each row execute function public.sync_membership_status();


-- ============================================================
-- association_invitations — invitations à rejoindre une asso
-- ============================================================
create table public.association_invitations (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,

  -- Destinataire : par user_id (inscrit) ou par email (non inscrit).
  user_id uuid references public.profiles (id) on delete cascade,
  invited_user_id uuid references public.profiles (id) on delete set null,
  email text,
  prenom text,
  nom text,
  phone text,

  invited_by uuid not null references public.profiles (id) on delete cascade,
  role public.association_role not null default 'membre',
  status public.association_invitation_status not null default 'pending',
  message text,
  token text,

  -- Cycle de vie
  sent_at timestamptz,
  responded_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz not null default now(),

  constraint chk_invitation_has_target check (
    user_id is not null or invited_user_id is not null or email is not null
  )
);

comment on table public.association_invitations is
  'Invitations à rejoindre une association (par user_id inscrit ou par email).';

create index assoc_invitations_association_idx on public.association_invitations (association_id);
create index assoc_invitations_user_idx on public.association_invitations (user_id);
create index assoc_invitations_invited_user_idx on public.association_invitations (invited_user_id);
create index assoc_invitations_status_idx on public.association_invitations (status);
create index assoc_invitations_assoc_status_idx on public.association_invitations (association_id, status);
create index assoc_invitations_email_idx on public.association_invitations (lower(email));
create index assoc_invitations_expires_idx on public.association_invitations (expires_at);
create index assoc_invitations_token_idx on public.association_invitations (token) where token is not null;

-- Normalisation de l'email en minuscules.
create or replace function public.normalize_invitation_email()
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

create trigger assoc_invitations_normalize_email
  before insert or update on public.association_invitations
  for each row execute function public.normalize_invitation_email();


-- ============================================================
-- association_contacts — carnet de contacts CRM de l'asso
-- ============================================================
create table public.association_contacts (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  name text not null,
  organization text,
  contact_type public.association_contact_type not null default 'autre',
  email text,
  phone text,
  address text,
  city text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  notes text,
  tags text[] not null default '{}',
  last_contacted timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.association_contacts is
  'Carnet de contacts CRM d''une association (partenaires, fournisseurs, médias…).';

create index assoc_contacts_association_idx on public.association_contacts (association_id);
create index assoc_contacts_type_idx on public.association_contacts (contact_type);

create trigger assoc_contacts_updated_at
  before update on public.association_contacts
  for each row execute function public.handle_updated_at();


-- ============================================================
-- association_documents — documents (statuts, PV, comptes…)
-- ============================================================
create table public.association_documents (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  status public.association_document_status not null default 'draft',
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.association_documents is
  'Documents d''une association (statuts, PV, comptes…), avec workflow de validation.';

create index assoc_documents_association_idx on public.association_documents (association_id);
create index assoc_documents_status_idx on public.association_documents (status);
create index assoc_documents_category_idx on public.association_documents (category);

create trigger assoc_documents_updated_at
  before update on public.association_documents
  for each row execute function public.handle_updated_at();


-- ============================================================
-- association_fiche_config — configuration de la fiche publique
-- ============================================================
create table public.association_fiche_config (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null unique references public.associations (id) on delete cascade,

  -- Contenu éditorial
  president_message text,
  president_name text,
  president_title text default 'Président·e',
  president_photo text,
  mission text,
  vision text,
  values text,
  charter_rules jsonb not null default '[]'::jsonb,

  -- Visibilité par section (visible / internal / hidden), gérée côté applicatif.
  sections_visibility jsonb not null default '{
    "president_message": "visible",
    "mission": "visible",
    "vision": "visible",
    "values": "visible",
    "team_bureau": "visible",
    "team_staff": "visible",
    "documents": "internal",
    "charter": "visible",
    "quick_actions": "internal",
    "faq": "hidden"
  }'::jsonb,

  -- Trombinoscope : rôles affichés.
  team_visible_roles text[] not null default array[
    'president', 'vice_president', 'tresorier', 'secretaire', 'responsable'
  ]::text[],

  -- Documents mis en avant (IDs de association_documents).
  featured_document_ids uuid[] not null default array[]::uuid[],

  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.association_fiche_config is
  'Configuration de la fiche publique d''une association (1:1, éditorial + visibilité des sections).';

create index assoc_fiche_config_association_idx on public.association_fiche_config (association_id);

create trigger assoc_fiche_config_updated_at
  before update on public.association_fiche_config
  for each row execute function public.handle_updated_at();

-- Création automatique d'une fiche config vide à la création d'une asso.
create or replace function public.auto_create_fiche_config()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.association_fiche_config (association_id)
  values (new.id)
  on conflict (association_id) do nothing;
  return new;
end;
$$;

create trigger associations_auto_fiche_config
  after insert on public.associations
  for each row execute function public.auto_create_fiche_config();


-- ============================================================
-- Helpers d'autorisation (SECURITY DEFINER → anti-récursion RLS)
-- ------------------------------------------------------------
-- Conventions de rôles :
--   - admin   = president / vice_president
--   - leader  = president / vice_president / secretaire / responsable
--               (bureau élargi : peut gérer membres/invitations/contacts)
--   - owner   = president
--   - membre  = toute appartenance active
-- L'admin plateforme (is_admin(), 0001) bypasse ces contrôles.
-- ============================================================

-- is_association_member : appartenance active à l'asso.
create or replace function public.is_association_member(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.association_memberships
    where association_id = _association_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- is_association_leader : bureau élargi (president, VP, secrétaire, trésorier, responsable).
create or replace function public.is_association_leader(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.association_memberships
    where association_id = _association_id
      and user_id = auth.uid()
      and role in ('president', 'vice_president', 'secretaire', 'tresorier', 'responsable')
      and is_active = true
  );
$$;

-- is_association_owner : président de l'asso (ou owner_user_id de la fiche).
create or replace function public.is_association_owner(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.associations
    where id = _association_id
      and owner_user_id = auth.uid()
  )
  or exists (
    select 1 from public.association_memberships
    where association_id = _association_id
      and user_id = auth.uid()
      and role = 'president'
      and is_active = true
  );
$$;

-- is_association_admin : admin de l'asso (bureau élargi) OU admin plateforme.
-- Signature exacte attendue par 0005_events_core.sql.
create or replace function public.is_association_admin(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.is_association_leader(_association_id);
$$;

-- is_association_writable : asso ni bloquée ni supprimée.
create or replace function public.is_association_writable(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.associations
    where id = _association_id
      and admin_status <> 'blocked'
      and deleted_at is null
  );
$$;

-- is_association_restricted : asso sous restriction administrative.
create or replace function public.is_association_restricted(_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.associations
    where id = _association_id
      and admin_status = 'restricted'
  );
$$;


-- ============================================================
-- accept_association_invitation — accepte une invitation et crée
-- (ou réactive) le membership en une transaction.
-- ============================================================
create or replace function public.accept_association_invitation(_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.association_invitations%rowtype;
  v_membership_id uuid;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Non authentifié';
  end if;

  select * into v_invitation
  from public.association_invitations
  where id = _invitation_id;

  if not found then
    raise exception 'Invitation introuvable';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Cette invitation n''est plus valide (statut: %)', v_invitation.status;
  end if;

  if v_invitation.expires_at is not null and v_invitation.expires_at < now() then
    update public.association_invitations
    set status = 'expired'
    where id = _invitation_id;
    raise exception 'Cette invitation a expiré';
  end if;

  -- Le destinataire désigné (user_id / invited_user_id) doit être l'appelant,
  -- sauf admin plateforme.
  if v_invitation.user_id is not null
     and v_invitation.user_id <> v_caller
     and not public.is_admin() then
    raise exception 'Tu n''es pas le destinataire de cette invitation';
  end if;

  insert into public.association_memberships (association_id, user_id, role, is_active, joined_at)
  values (
    v_invitation.association_id,
    coalesce(v_invitation.user_id, v_invitation.invited_user_id, v_caller),
    v_invitation.role,
    true,
    now()
  )
  on conflict (association_id, user_id) do update
    set role = excluded.role,
        is_active = true,
        membership_status = 'active',
        left_at = null,
        joined_at = coalesce(association_memberships.joined_at, now()),
        updated_at = now()
  returning id into v_membership_id;

  update public.association_invitations
  set status = 'accepted',
      accepted_at = now(),
      responded_at = now(),
      user_id = coalesce(user_id, invited_user_id, v_caller)
  where id = _invitation_id;

  return v_membership_id;
end;
$$;

comment on function public.accept_association_invitation(uuid) is
  'Accepte une invitation (appelant = destinataire, ou admin) et crée/réactive le membership.';


-- ============================================================
-- RLS
-- ============================================================
alter table public.associations enable row level security;
alter table public.association_memberships enable row level security;
alter table public.association_invitations enable row level security;
alter table public.association_contacts enable row level security;
alter table public.association_documents enable row level security;
alter table public.association_fiche_config enable row level security;

-- ---- associations ----
-- SELECT : admin plateforme voit tout ; sinon non supprimées + (publique
--          OU membre OU draft du créateur/owner).
create policy "associations_select"
  on public.associations for select to authenticated
  using (
    public.is_admin()
    or (
      deleted_at is null
      and (
        is_public = true
        or public.is_association_member(id)
        or (status = 'draft' and (created_by = auth.uid() or owner_user_id = auth.uid()))
      )
    )
  );

-- Fiches actives & publiques lisibles publiquement (accès anonyme).
create policy "associations_select_public_anon"
  on public.associations for select to anon
  using (status = 'active' and is_public = true and deleted_at is null);

-- INSERT : admin plateforme uniquement (création contrôlée).
create policy "associations_insert_admin"
  on public.associations for insert to authenticated
  with check (public.is_admin());

-- UPDATE : admin plateforme OU (leader/owner ET asso writable).
create policy "associations_update"
  on public.associations for update to authenticated
  using (
    public.is_admin()
    or ((public.is_association_leader(id) or public.is_association_owner(id))
        and public.is_association_writable(id))
  )
  with check (
    public.is_admin()
    or ((public.is_association_leader(id) or public.is_association_owner(id))
        and public.is_association_writable(id))
  );

-- DELETE : admin plateforme uniquement (préférer le soft-delete).
create policy "associations_delete_admin"
  on public.associations for delete to authenticated
  using (public.is_admin());

-- ---- association_memberships ----
-- SELECT : self OU membre de la même asso OU admin plateforme.
create policy "assoc_memberships_select"
  on public.association_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_member(association_id)
  );

-- INSERT : admin plateforme OU (leader ET asso writable ET non restreinte).
create policy "assoc_memberships_insert"
  on public.association_memberships for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_association_leader(association_id)
        and public.is_association_writable(association_id)
        and not public.is_association_restricted(association_id))
  );

-- UPDATE : admin plateforme OU (leader ET writable) OU self-leave (désactivation).
create policy "assoc_memberships_update"
  on public.association_memberships for update to authenticated
  using (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
    or user_id = auth.uid()
  )
  with check (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
    or (user_id = auth.uid() and is_active = false)
  );

-- DELETE : admin plateforme OU (owner ET writable).
create policy "assoc_memberships_delete"
  on public.association_memberships for delete to authenticated
  using (
    public.is_admin()
    or (public.is_association_owner(association_id) and public.is_association_writable(association_id))
  );

-- ---- association_invitations ----
-- SELECT : destinataire (par user_id/invited_user_id ou email) OU émetteur
--          OU leader de l'asso OU admin plateforme.
create policy "assoc_invitations_select"
  on public.association_invitations for select to authenticated
  using (
    user_id = auth.uid()
    or invited_user_id = auth.uid()
    or invited_by = auth.uid()
    or public.is_admin()
    or public.is_association_leader(association_id)
    or lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  );

-- INSERT : admin plateforme OU (leader ET asso writable ET non restreinte).
create policy "assoc_invitations_insert"
  on public.association_invitations for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_association_leader(association_id)
        and public.is_association_writable(association_id)
        and not public.is_association_restricted(association_id))
  );

-- UPDATE : admin plateforme OU leader OU destinataire (accepter/refuser),
--          le tout si l'asso est writable.
create policy "assoc_invitations_update"
  on public.association_invitations for update to authenticated
  using (
    public.is_admin()
    or ((public.is_association_leader(association_id)
         or user_id = auth.uid()
         or invited_user_id = auth.uid())
        and public.is_association_writable(association_id))
  )
  with check (
    public.is_admin()
    or ((public.is_association_leader(association_id)
         or user_id = auth.uid()
         or invited_user_id = auth.uid())
        and public.is_association_writable(association_id))
  );

-- DELETE : admin plateforme OU leader de l'asso.
create policy "assoc_invitations_delete"
  on public.association_invitations for delete to authenticated
  using (public.is_admin() or public.is_association_leader(association_id));

-- ---- association_contacts ----
-- SELECT : membre actif OU admin plateforme.
create policy "assoc_contacts_select"
  on public.association_contacts for select to authenticated
  using (public.is_admin() or public.is_association_member(association_id));

-- INSERT/UPDATE/DELETE : leader ET asso writable (ou admin plateforme).
create policy "assoc_contacts_insert"
  on public.association_contacts for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
  );

create policy "assoc_contacts_update"
  on public.association_contacts for update to authenticated
  using (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
  )
  with check (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
  );

create policy "assoc_contacts_delete"
  on public.association_contacts for delete to authenticated
  using (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
  );

-- ---- association_documents ----
-- SELECT : leader voit tout ; membre voit les documents approuvés ; admin plateforme.
create policy "assoc_documents_select"
  on public.association_documents for select to authenticated
  using (
    public.is_admin()
    or public.is_association_leader(association_id)
    or (status = 'approved' and public.is_association_member(association_id))
  );

-- INSERT : membre actif ET asso writable (ou admin plateforme).
create policy "assoc_documents_insert"
  on public.association_documents for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_association_member(association_id) and public.is_association_writable(association_id))
  );

-- UPDATE : membre actif ET asso writable (ou admin plateforme).
create policy "assoc_documents_update"
  on public.association_documents for update to authenticated
  using (
    public.is_admin()
    or (public.is_association_member(association_id) and public.is_association_writable(association_id))
  )
  with check (
    public.is_admin()
    or (public.is_association_member(association_id) and public.is_association_writable(association_id))
  );

-- DELETE : leader ET asso writable (ou admin plateforme).
create policy "assoc_documents_delete"
  on public.association_documents for delete to authenticated
  using (
    public.is_admin()
    or (public.is_association_leader(association_id) and public.is_association_writable(association_id))
  );

-- ---- association_fiche_config ----
-- SELECT : config d'une asso active lisible par tout authentifié + admin plateforme.
create policy "assoc_fiche_config_select"
  on public.association_fiche_config for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.associations a
      where a.id = association_fiche_config.association_id
        and a.status = 'active'
        and a.deleted_at is null
    )
  );

-- Lecture publique (anon) pour la fiche publique d'une asso active & publique.
create policy "assoc_fiche_config_select_public_anon"
  on public.association_fiche_config for select to anon
  using (
    exists (
      select 1 from public.associations a
      where a.id = association_fiche_config.association_id
        and a.status = 'active'
        and a.is_public = true
        and a.deleted_at is null
    )
  );

-- INSERT/UPDATE : admin d'asso (is_association_admin) ; DELETE : owner ou admin plateforme.
create policy "assoc_fiche_config_insert"
  on public.association_fiche_config for insert to authenticated
  with check (public.is_association_admin(association_id));

create policy "assoc_fiche_config_update"
  on public.association_fiche_config for update to authenticated
  using (public.is_association_admin(association_id))
  with check (public.is_association_admin(association_id));

create policy "assoc_fiche_config_delete"
  on public.association_fiche_config for delete to authenticated
  using (public.is_admin() or public.is_association_owner(association_id));
