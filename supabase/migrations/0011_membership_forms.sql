-- ============================================================
-- 0011 — Adhésion : bulletins (form builder), soumissions,
--        réponses, consentements, signatures, demandes,
--        historique de statut + activation d'adhésion
-- ------------------------------------------------------------
-- Sources :
--   - legacy/supabase/migrations/20260407_membership_workflow.sql
--     (schéma des 7 tables du workflow d'adhésion).
--   - legacy/supabase/migrations/20260408_seed_manga_paradise_form_definition.sql
--     (structure de la définition JSONB — seed NON repris ici).
--   - legacy/src/integrations/supabase/types.ts (signature activate_membership).
-- Dépendances : 0001 (profiles, is_admin, handle_updated_at),
--   0003 (associations + is_association_admin).
-- ------------------------------------------------------------
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - Admin d'asso via is_association_admin() (0003) au lieu des anciens
--     helpers is_global_association_admin (lisaient profiles.role, SUPPRIMÉ).
--   - Trigger updated_at unifié sur handle_updated_at() (0001) à la place de
--     handle_association_updated_at() (legacy).
--   - Enums PG pour les statuts stables (legacy : TEXT + CHECK).
--   - Seed du formulaire Manga Paradise NON inséré (schéma uniquement).
-- ============================================================


-- ============================================================
-- Enums
-- ============================================================

-- Statut d'une définition de formulaire.
create type public.membership_form_status as enum (
  'draft', 'published', 'archived'
);

-- Parcours d'adhésion (majeur / mineur via représentant légal).
create type public.membership_pathway as enum ('major', 'minor');

-- Statut d'un dossier de soumission.
create type public.membership_submission_status as enum (
  'draft', 'submitted', 'under_review', 'needs_more_info',
  'approved', 'rejected', 'awaiting_payment', 'activated'
);

-- Statut de paiement d'une soumission.
create type public.membership_payment_status as enum (
  'unpaid', 'pending', 'paid', 'waived', 'not_applicable'
);

-- Type d'acteur d'un consentement / d'une signature.
create type public.membership_actor_type as enum ('member', 'guardian', 'admin');

-- Statut d'une demande de complément.
create type public.membership_request_status as enum (
  'open', 'resolved', 'cancelled'
);


-- ============================================================
-- membership_form_definitions — bulletins versionnés (form builder)
-- ------------------------------------------------------------
-- La définition JSONB décrit les étapes/champs (cf. seed legacy).
-- ============================================================
create table public.membership_form_definitions (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  slug text not null,
  name text not null,
  season text,
  version integer not null default 1,
  status public.membership_form_status not null default 'published',
  definition jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (association_id, slug, version)
);

comment on table public.membership_form_definitions is
  'Bulletins d''adhésion versionnés (étapes/champs en JSONB). Un formulaire publié est lisible publiquement.';

create index membership_form_defs_association_idx
  on public.membership_form_definitions (association_id);
create index membership_form_defs_slug_idx
  on public.membership_form_definitions (slug);
create index membership_form_defs_default_idx
  on public.membership_form_definitions (association_id, is_default) where is_default = true;

create trigger membership_form_defs_updated_at
  before update on public.membership_form_definitions
  for each row execute function public.handle_updated_at();


-- ============================================================
-- membership_submissions — dossiers de demande d'adhésion
-- ============================================================
create table public.membership_submissions (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  form_definition_id uuid not null
    references public.membership_form_definitions (id) on delete restrict,
  public_slug text,

  -- Demandeur / déposant (peuvent différer : ex. parent déposant pour un mineur)
  applicant_profile_id uuid references public.profiles (id) on delete set null,
  submitted_by_user_id uuid references public.profiles (id) on delete set null,

  pathway public.membership_pathway not null default 'major',
  season text,
  status public.membership_submission_status not null default 'submitted',
  payment_status public.membership_payment_status not null default 'unpaid',
  review_notes text,
  internal_notes text,

  -- Cycle de vie
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  rejected_at timestamptz,
  activated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.membership_submissions is
  'Dossiers de demande d''adhésion. Lecture déposant/demandeur + admins de l''asso ; transitions de statut = admins asso.';

create index membership_submissions_association_idx
  on public.membership_submissions (association_id);
create index membership_submissions_form_def_idx
  on public.membership_submissions (form_definition_id);
create index membership_submissions_status_idx
  on public.membership_submissions (status);
create index membership_submissions_payment_idx
  on public.membership_submissions (payment_status);
create index membership_submissions_applicant_idx
  on public.membership_submissions (applicant_profile_id);
create index membership_submissions_submitted_by_idx
  on public.membership_submissions (submitted_by_user_id);
create index membership_submissions_season_idx
  on public.membership_submissions (season);
create index membership_submissions_submitted_at_idx
  on public.membership_submissions (submitted_at desc);

create trigger membership_submissions_updated_at
  before update on public.membership_submissions
  for each row execute function public.handle_updated_at();


-- ============================================================
-- membership_submission_answers — réponses individuelles aux champs
-- ============================================================
create table public.membership_submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.membership_submissions (id) on delete cascade,
  step_id text not null,
  field_id text not null,
  field_type text not null,
  value jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.membership_submission_answers is
  'Réponses individuelles (champ par champ) d''une soumission. Hérite des droits de la soumission.';

create index membership_answers_submission_idx
  on public.membership_submission_answers (submission_id);
create index membership_answers_field_idx
  on public.membership_submission_answers (field_id);


-- ============================================================
-- membership_consents — consentements tracés (RGPD, image, charte…)
-- ============================================================
create table public.membership_consents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.membership_submissions (id) on delete cascade,
  field_id text not null,
  label text not null,
  accepted boolean not null,
  accepted_at timestamptz,
  consent_text text,
  version text,
  actor_type public.membership_actor_type not null default 'member',
  created_at timestamptz not null default now()
);

comment on table public.membership_consents is
  'Consentements tracés (texte + version + acteur) liés à une soumission.';

create index membership_consents_submission_idx
  on public.membership_consents (submission_id);


-- ============================================================
-- membership_signatures — signatures électroniques tracées
-- ============================================================
create table public.membership_signatures (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.membership_submissions (id) on delete cascade,
  field_id text not null,
  signed_name text not null,
  signed_at timestamptz not null default now(),
  actor_type public.membership_actor_type not null default 'member',
  signature_payload jsonb,
  created_at timestamptz not null default now()
);

comment on table public.membership_signatures is
  'Signatures électroniques (nom + payload) liées à une soumission.';

create index membership_signatures_submission_idx
  on public.membership_signatures (submission_id);


-- ============================================================
-- membership_submission_requests — demandes de complément (admin → déposant)
-- ============================================================
create table public.membership_submission_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.membership_submissions (id) on delete cascade,
  type text not null default 'missing_info',
  message text not null,
  status public.membership_request_status not null default 'open',
  requested_by uuid not null references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.membership_submission_requests is
  'Demandes de complément d''information sur une soumission (gérées par les admins de l''asso).';

create index membership_requests_submission_idx
  on public.membership_submission_requests (submission_id);
create index membership_requests_status_idx
  on public.membership_submission_requests (status);


-- ============================================================
-- membership_submission_status_history — historique des transitions
-- ============================================================
create table public.membership_submission_status_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.membership_submissions (id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.membership_submission_status_history is
  'Historique des changements de statut d''une soumission (audit du workflow).';

create index membership_status_history_submission_idx
  on public.membership_submission_status_history (submission_id);
create index membership_status_history_created_idx
  on public.membership_submission_status_history (created_at desc);


-- ============================================================
-- Helper : déposant/demandeur d'une soumission
-- (SECURITY DEFINER → évite la récursion RLS sur les tables filles)
-- ============================================================
create or replace function public.owns_membership_submission(_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membership_submissions s
    where s.id = _submission_id
      and (s.submitted_by_user_id = auth.uid() or s.applicant_profile_id = auth.uid())
  );
$$;

-- Helper : admin de l'asso propriétaire d'une soumission.
create or replace function public.can_admin_membership_submission(_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membership_submissions s
    where s.id = _submission_id
      and public.is_association_admin(s.association_id)
  );
$$;


-- ============================================================
-- activate_membership — active l'adhésion d'un utilisateur après
-- validation / paiement (crédite les OTK du pack, fixe le tier).
-- ------------------------------------------------------------
-- Signature exacte attendue par le front (types.ts) :
--   activate_membership(_otk_amount numeric, _pack_id text, _user_id uuid)
-- TODO: valider (montants/tiers de packs, anti-double-activation,
--       écriture éventuelle d'une otk_transaction en 0010).
-- ============================================================
create or replace function public.activate_membership(
  _otk_amount numeric,
  _pack_id text,
  _user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier public.membership_tier;
begin
  if _user_id is null then
    raise exception 'user_id requis';
  end if;

  -- Seul l'intéressé ou un admin plateforme peut activer une adhésion.
  if auth.uid() is distinct from _user_id and not public.is_admin() then
    raise exception 'Non autorisé à activer cette adhésion';
  end if;

  -- Mapping pack -> tier (les packs portent les mêmes libellés que le tier).
  v_tier := case lower(coalesce(_pack_id, ''))
    when 'gold' then 'gold'::public.membership_tier
    when 'silver' then 'silver'::public.membership_tier
    else 'bronze'::public.membership_tier
  end;

  update public.profiles
  set
    is_subscription_active = true,
    membership_status = 'active',
    membership_tier = v_tier,
    selected_pack = coalesce(_pack_id, selected_pack),
    subscription_expires_at = now() + interval '1 year',
    member_since = coalesce(member_since, now()),
    onboarding_completed = true,
    otk_coins = otk_coins + coalesce(_otk_amount, 0)::int,
    total_otk_earned = total_otk_earned + coalesce(_otk_amount, 0)::int,
    updated_at = now()
  where id = _user_id;

  return found;
end;
$$;

comment on function public.activate_membership(numeric, text, uuid) is
  'Active l''adhésion (tier + OTK du pack) après validation/paiement. Self ou admin plateforme.';


-- ============================================================
-- RLS
-- ============================================================
alter table public.membership_form_definitions enable row level security;
alter table public.membership_submissions enable row level security;
alter table public.membership_submission_answers enable row level security;
alter table public.membership_consents enable row level security;
alter table public.membership_signatures enable row level security;
alter table public.membership_submission_requests enable row level security;
alter table public.membership_submission_status_history enable row level security;

-- ---- membership_form_definitions ----
-- SELECT : un formulaire publié est lisible publiquement (page d'adhésion
--          publique, accès anon) ; les admins de l'asso voient tous les états.
create policy "membership_form_defs_select_published_anon"
  on public.membership_form_definitions for select to anon
  using (status = 'published');

create policy "membership_form_defs_select"
  on public.membership_form_definitions for select to authenticated
  using (status = 'published' or public.is_association_admin(association_id));

-- INSERT/UPDATE/DELETE : admins de l'asso.
create policy "membership_form_defs_manage"
  on public.membership_form_definitions for all to authenticated
  using (public.is_association_admin(association_id))
  with check (public.is_association_admin(association_id));

-- ---- membership_submissions ----
-- INSERT : tout le monde (y compris anon) peut déposer pour un formulaire publié.
create policy "membership_submissions_insert_public"
  on public.membership_submissions for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.membership_form_definitions fd
      where fd.id = form_definition_id and fd.status = 'published'
    )
  );

-- SELECT : déposant/demandeur OU admins de l'asso.
create policy "membership_submissions_select"
  on public.membership_submissions for select to authenticated
  using (
    submitted_by_user_id = auth.uid()
    or applicant_profile_id = auth.uid()
    or public.is_association_admin(association_id)
  );

-- UPDATE (transitions de statut, notes…) : admins de l'asso uniquement.
create policy "membership_submissions_update_admin"
  on public.membership_submissions for update to authenticated
  using (public.is_association_admin(association_id))
  with check (public.is_association_admin(association_id));

-- DELETE : admins de l'asso.
create policy "membership_submissions_delete_admin"
  on public.membership_submissions for delete to authenticated
  using (public.is_association_admin(association_id));

-- ---- membership_submission_answers ----
-- INSERT : libre pendant la soumission (anon + authentifié) ; la garde est
--          assurée par la policy d'insert des soumissions.
create policy "membership_answers_insert_public"
  on public.membership_submission_answers for insert to anon, authenticated
  with check (true);

-- SELECT : déposant/demandeur OU admins de l'asso (via la soumission parente).
create policy "membership_answers_select"
  on public.membership_submission_answers for select to authenticated
  using (
    public.owns_membership_submission(submission_id)
    or public.can_admin_membership_submission(submission_id)
  );

-- ---- membership_consents ----
create policy "membership_consents_insert_public"
  on public.membership_consents for insert to anon, authenticated
  with check (true);

create policy "membership_consents_select"
  on public.membership_consents for select to authenticated
  using (
    public.owns_membership_submission(submission_id)
    or public.can_admin_membership_submission(submission_id)
  );

-- ---- membership_signatures ----
create policy "membership_signatures_insert_public"
  on public.membership_signatures for insert to anon, authenticated
  with check (true);

create policy "membership_signatures_select"
  on public.membership_signatures for select to authenticated
  using (
    public.owns_membership_submission(submission_id)
    or public.can_admin_membership_submission(submission_id)
  );

-- ---- membership_submission_status_history ----
-- INSERT : déposant (passage à submitted…) OU admins de l'asso (transitions).
create policy "membership_status_history_insert"
  on public.membership_submission_status_history for insert to anon, authenticated
  with check (true);

create policy "membership_status_history_select"
  on public.membership_submission_status_history for select to authenticated
  using (
    public.owns_membership_submission(submission_id)
    or public.can_admin_membership_submission(submission_id)
  );

-- ---- membership_submission_requests ----
-- Gestion (création/résolution) : admins de l'asso. Lecture : déposant + admins.
create policy "membership_requests_manage_admin"
  on public.membership_submission_requests for all to authenticated
  using (public.can_admin_membership_submission(submission_id))
  with check (public.can_admin_membership_submission(submission_id));

create policy "membership_requests_select_own"
  on public.membership_submission_requests for select to authenticated
  using (
    public.owns_membership_submission(submission_id)
    or public.can_admin_membership_submission(submission_id)
  );
