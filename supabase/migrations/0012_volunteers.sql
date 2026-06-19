-- ============================================================
-- 0012 — Bénévolat : candidatures, missions, créneaux, affectations…
-- ------------------------------------------------------------
-- Sources :
--   - legacy/supabase/migrations/20260406_volunteer_module_v1.sql
--       (volunteer_applications, _missions, _shifts, _assignments,
--        _documents, _messages, _activity_log + triggers de recalcul)
--   - legacy/supabase/migrations/20260406_mission_schema_v1.sql
--       (colonnes enrichies de missions + mission_schema_sections/_fields
--        + mission_templates)
-- Dépendances : 0001 (profiles, is_admin), 0003 (associations +
--   is_association_admin / is_association_member / is_association_writable),
--   0005 (events).
-- Cleanups (cf. docs/data-model.md) :
--   - L'ancien typait beaucoup de colonnes en TEXT+CHECK faute de types
--     régénérés : on NORMALISE en enums PG (statuts, priorités, types…).
--   - Templates renommés mission_templates -> volunteer_mission_templates
--     (cohérence du préfixe de domaine).
--   - Les helpers RLS globaux legacy (is_global_association_admin, basés sur
--     profiles.role désormais supprimé) sont remplacés par is_admin() (0001).
--   - Les colonnes de stats bénévolat ajoutées par l'ancien sur
--     association_memberships (involvement_status, reliability_score…) NE sont
--     PAS reprises ici : elles relèvent de la table associations (0003).
--     Les triggers de mise à jour de ces stats ne sont donc pas recréés.
-- ============================================================

-- === Enums ===
-- Statut d'une candidature bénévole (workflow complet).
create type public.volunteer_application_status as enum (
  'invited', 'started', 'incomplete', 'pending_review',
  'approved', 'rejected', 'archived'
);

-- Origine de la candidature (spontanée, invitation, externe, promotion).
create type public.volunteer_application_source as enum (
  'self', 'invitation', 'external', 'promotion'
);

-- Statut d'une mission.
create type public.mission_status as enum (
  'draft', 'open', 'in_progress', 'complete', 'cancelled'
);

-- Priorité d'une mission.
create type public.mission_priority as enum (
  'low', 'medium', 'high', 'critical'
);

-- Statut d'un créneau (shift).
create type public.shift_status as enum (
  'open', 'full', 'in_progress', 'completed', 'cancelled'
);

-- Statut d'une affectation bénévole <-> mission/shift.
create type public.assignment_status as enum (
  'proposed', 'confirmed', 'checked_in', 'absent',
  'completed', 'cancelled'
);

-- Type de document bénévole.
create type public.volunteer_document_type as enum (
  'charter', 'image_rights', 'authorization', 'id_copy',
  'medical', 'insurance', 'other'
);

-- Statut de validation d'un document bénévole.
create type public.volunteer_document_status as enum (
  'pending', 'approved', 'rejected', 'expired'
);

-- Type de message bénévole (communications internes).
create type public.volunteer_message_type as enum (
  'welcome', 'reminder', 'assignment', 'document_request',
  'shift_reminder', 'thanks', 'custom', 'broadcast'
);

-- Mode de candidature à une mission (libre / validation / sur invitation).
create type public.mission_application_mode as enum (
  'open', 'manual', 'invitation_only'
);

-- Statut de préparation interne d'une mission.
create type public.mission_preparation_status as enum (
  'not_started', 'in_progress', 'ready', 'blocked'
);

-- ============================================================
-- volunteer_mission_templates — modèles de missions réutilisables
-- ------------------------------------------------------------
-- Défini AVANT volunteer_missions car missions.template_id le référence.
-- association_id NULL = template global plateforme.
-- ============================================================
create table public.volunteer_mission_templates (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references public.associations (id) on delete cascade,

  name text not null,
  slug text not null,
  description text,
  icon text,

  pole text,
  mission_type text,
  mission_subtype text,

  -- Valeurs pré-remplies des champs natifs (ex: {"slots_needed": 3, ...}).
  default_values jsonb not null default '{}',
  -- Valeurs pré-remplies des champs custom.
  custom_field_values jsonb not null default '{}',
  -- Slugs des sections à activer (vide = toutes).
  enabled_sections text[] not null default '{}',

  is_active boolean not null default true,
  is_global boolean not null default false, -- visible par toutes les assos

  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_mission_templates is
  'Modèles de missions réutilisables (valeurs pré-remplies). association_id NULL = template global.';

-- Slug unique par association (NULL traité comme un uuid sentinelle).
create unique index volunteer_mission_templates_slug_uidx
  on public.volunteer_mission_templates
  (coalesce(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index volunteer_mission_templates_association_id_idx
  on public.volunteer_mission_templates (association_id);
create index volunteer_mission_templates_global_idx
  on public.volunteer_mission_templates (is_global) where is_global = true;

create trigger volunteer_mission_templates_updated_at
  before update on public.volunteer_mission_templates
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_applications — candidatures bénévoles
-- ============================================================
create table public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,

  -- Source & statut
  source public.volunteer_application_source not null default 'self',
  status public.volunteer_application_status not null default 'started',

  -- Identité du candidat (externe sans compte)
  first_name text,
  last_name text,
  email text,
  phone text,
  city text,

  -- Données de profil figées au moment de la candidature
  interests text[] not null default '{}',
  skills text[] not null default '{}',
  participation_preferences text[] not null default '{}',
  availability jsonb not null default '{}',
  experience_level text not null default 'debutant',
  languages text[] not null default '{francais}',
  consent_photo boolean not null default false,
  motivation text,

  -- Suivi de l'onboarding
  onboarding_step integer not null default 1,
  onboarding_data jsonb not null default '{}',

  -- Revue / validation
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  rejection_reason text,

  -- Lien d'invitation
  invited_by uuid references public.profiles (id) on delete set null,
  invitation_message text,
  token text unique,
  token_expires_at timestamptz,

  -- Horodatages métier
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_applications is
  'Candidatures bénévoles (workflow invited->approved). Le candidat gère la sienne ; l''admin d''asso la valide.';

create index volunteer_applications_association_id_idx
  on public.volunteer_applications (association_id);
create index volunteer_applications_user_id_idx
  on public.volunteer_applications (user_id);
create index volunteer_applications_event_id_idx
  on public.volunteer_applications (event_id);
create index volunteer_applications_status_idx
  on public.volunteer_applications (status);
create index volunteer_applications_assoc_status_idx
  on public.volunteer_applications (association_id, status);
create index volunteer_applications_token_idx
  on public.volunteer_applications (token) where token is not null;

create trigger volunteer_applications_updated_at
  before update on public.volunteer_applications
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_missions — missions bénévoles (colonnes de base + enrichies)
-- ------------------------------------------------------------
-- Fusion des deux migrations legacy (module v1 + mission schema v1) :
-- les colonnes ajoutées par ALTER successifs sont ici déclarées d'emblée.
-- ============================================================
create table public.volunteer_missions (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,

  -- Identité / description
  title text not null,
  summary text,                          -- résumé court (appel à participation)
  description text,
  mission_type text,
  mission_subtype text,
  zone text,
  pole text,
  secondary_poles text[] not null default '{}',
  location_detail text,

  -- Compétences requises / appréciées
  required_skills text[] not null default '{}',
  required_experience text not null default 'debutant',
  required_interests text[] not null default '{}',
  optional_skills text[] not null default '{}',
  trainable_skills text[] not null default '{}',

  -- Besoin humain (capacité)
  slots_min integer not null default 1,
  slots_needed integer not null default 1,
  slots_max integer,
  slots_filled integer not null default 0,
  suitable_for_beginners boolean not null default true,
  suitable_for_minors boolean not null default false,

  -- Planning
  start_at timestamptz,
  end_at timestamptz,
  setup_start_at timestamptz,
  teardown_end_at timestamptz,
  briefing_minutes integer,
  break_minutes integer,
  confirmation_deadline timestamptz,

  -- Conditions & organisation
  briefing_required boolean not null default false,
  dress_code text,
  equipment_provided text[] not null default '{}',
  equipment_required text[] not null default '{}',
  physical_requirements text,
  autonomy_level text,
  constraints_text text,
  procedures text,

  -- Avantages & valorisation
  perks jsonb not null default '{
    "meal": false, "drinks": false, "entry": false, "goodies": false,
    "badge": false, "points": 0, "public_thanks": false, "other": null
  }',

  -- Candidature
  application_mode public.mission_application_mode not null default 'open',
  is_public boolean not null default true,
  application_deadline timestamptz,
  application_message text,
  required_documents text[] not null default '{}',

  -- Notes internes (staff)
  notes text,
  internal_checklist jsonb not null default '[]',
  preparation_status public.mission_preparation_status not null default 'not_started',
  risks text,

  -- Méta & pilotage
  priority public.mission_priority not null default 'medium',
  status public.mission_status not null default 'draft',
  responsible_id uuid references public.profiles (id) on delete set null,
  contact_id uuid references public.profiles (id) on delete set null,
  tags text[] not null default '{}',

  -- Schema configurator
  template_id uuid references public.volunteer_mission_templates (id) on delete set null,
  custom_data jsonb not null default '{}', -- valeurs des champs custom

  -- Audit
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_missions is
  'Missions bénévoles (besoin, planning, conditions, avantages). Gérées par les admins d''asso ou le responsable.';

create index volunteer_missions_association_id_idx
  on public.volunteer_missions (association_id);
create index volunteer_missions_event_id_idx
  on public.volunteer_missions (event_id);
create index volunteer_missions_status_idx
  on public.volunteer_missions (status);
create index volunteer_missions_priority_idx
  on public.volunteer_missions (priority);
create index volunteer_missions_responsible_id_idx
  on public.volunteer_missions (responsible_id);
create index volunteer_missions_contact_id_idx
  on public.volunteer_missions (contact_id);
create index volunteer_missions_template_id_idx
  on public.volunteer_missions (template_id);
create index volunteer_missions_assoc_status_idx
  on public.volunteer_missions (association_id, status);
create index volunteer_missions_public_idx
  on public.volunteer_missions (is_public) where is_public = true;
create index volunteer_missions_required_skills_idx
  on public.volunteer_missions using gin (required_skills);
create index volunteer_missions_custom_data_idx
  on public.volunteer_missions using gin (custom_data);

create trigger volunteer_missions_updated_at
  before update on public.volunteer_missions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_shifts — créneaux horaires d'une mission
-- ============================================================
create table public.volunteer_shifts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.volunteer_missions (id) on delete cascade,

  title text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  slots_needed integer not null default 1,
  slots_filled integer not null default 0,
  location text,
  notes text,
  status public.shift_status not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_shifts is
  'Créneaux horaires rattachés à une mission. slots_filled/status maintenus par trigger.';

create index volunteer_shifts_mission_id_idx
  on public.volunteer_shifts (mission_id);
create index volunteer_shifts_status_idx
  on public.volunteer_shifts (status);
create index volunteer_shifts_start_idx
  on public.volunteer_shifts (mission_id, start_at);

create trigger volunteer_shifts_updated_at
  before update on public.volunteer_shifts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_assignments — affectations bénévole <-> mission/shift
-- ============================================================
create table public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid not null references public.volunteer_missions (id) on delete cascade,
  shift_id uuid references public.volunteer_shifts (id) on delete set null,

  status public.assignment_status not null default 'proposed',

  proposed_by uuid references public.profiles (id) on delete set null,
  proposed_at timestamptz default now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,

  notes text,
  rating integer check (rating between 1 and 5),
  feedback text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_assignments is
  'Affectation d''un bénévole à une mission (et éventuellement un shift). Le bénévole peut confirmer/annuler la sienne.';

-- Un bénévole n'est affecté qu'une fois par mission+shift (shift NULL = sentinelle).
create unique index volunteer_assignments_user_mission_shift_uidx
  on public.volunteer_assignments
  (user_id, mission_id, coalesce(shift_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index volunteer_assignments_association_id_idx
  on public.volunteer_assignments (association_id);
create index volunteer_assignments_user_id_idx
  on public.volunteer_assignments (user_id);
create index volunteer_assignments_mission_id_idx
  on public.volunteer_assignments (mission_id);
create index volunteer_assignments_shift_id_idx
  on public.volunteer_assignments (shift_id);
create index volunteer_assignments_status_idx
  on public.volunteer_assignments (status);

create trigger volunteer_assignments_updated_at
  before update on public.volunteer_assignments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_documents — documents bénévoles (charte, droit image…)
-- ============================================================
create table public.volunteer_documents (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  doc_type public.volunteer_document_type not null default 'other',
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,

  status public.volunteer_document_status not null default 'pending',
  expires_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.volunteer_documents is
  'Documents fournis par les bénévoles. Déposés par le bénévole, validés par l''admin d''asso.';

create index volunteer_documents_association_id_idx
  on public.volunteer_documents (association_id);
create index volunteer_documents_user_id_idx
  on public.volunteer_documents (user_id);
create index volunteer_documents_status_idx
  on public.volunteer_documents (status);
create index volunteer_documents_type_idx
  on public.volunteer_documents (doc_type);

create trigger volunteer_documents_updated_at
  before update on public.volunteer_documents
  for each row execute function public.handle_updated_at();

-- ============================================================
-- volunteer_messages — communications internes
-- ============================================================
create table public.volunteer_messages (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,

  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid references public.profiles (id) on delete cascade,
  mission_id uuid references public.volunteer_missions (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,

  msg_type public.volunteer_message_type not null default 'custom',
  subject text,
  body text not null,
  is_broadcast boolean not null default false,

  is_read boolean not null default false,
  read_at timestamptz,

  created_at timestamptz not null default now()
);

comment on table public.volunteer_messages is
  'Messages bénévolat (1:1 ou broadcast asso). Émis par les admins d''asso ; lus par expéditeur/destinataire.';

create index volunteer_messages_association_id_idx
  on public.volunteer_messages (association_id);
create index volunteer_messages_sender_id_idx
  on public.volunteer_messages (sender_id);
create index volunteer_messages_recipient_id_idx
  on public.volunteer_messages (recipient_id);
create index volunteer_messages_mission_id_idx
  on public.volunteer_messages (mission_id);
create index volunteer_messages_unread_idx
  on public.volunteer_messages (recipient_id, is_read) where is_read = false;

-- ============================================================
-- volunteer_activity_log — historique d'activité & points
-- ------------------------------------------------------------
-- Alimenté par triggers SECURITY DEFINER (pas d'insert direct utilisateur).
-- ============================================================
create table public.volunteer_activity_log (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  event_type text not null, -- application_submitted, application_approved,
                            -- assignment_confirmed, checked_in, mission_completed…
  entity_type text,         -- 'application', 'mission', 'assignment', 'shift', 'document'
  entity_id uuid,
  metadata jsonb not null default '{}',
  points integer not null default 0,

  created_at timestamptz not null default now()
);

comment on table public.volunteer_activity_log is
  'Journal d''activité bénévolat (points inclus). Écriture par triggers SECURITY DEFINER uniquement.';

create index volunteer_activity_log_association_id_idx
  on public.volunteer_activity_log (association_id);
create index volunteer_activity_log_user_id_idx
  on public.volunteer_activity_log (user_id);
create index volunteer_activity_log_user_created_idx
  on public.volunteer_activity_log (user_id, created_at desc);
create index volunteer_activity_log_entity_idx
  on public.volunteer_activity_log (entity_type, entity_id);

-- ============================================================
-- mission_schema_sections — sections configurables du formulaire mission
-- ------------------------------------------------------------
-- association_id NULL = section globale plateforme.
-- ============================================================
create table public.mission_schema_sections (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references public.associations (id) on delete cascade,

  slug text not null,
  name text not null,
  description text,
  icon text,

  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_active boolean not null default true,
  is_collapsed_default boolean not null default false,
  is_required boolean not null default false,
  is_system boolean not null default false, -- section standard non supprimable

  applicable_poles text[] not null default '{}', -- vide = tous
  applicable_types text[] not null default '{}', -- vide = tous

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mission_schema_sections is
  'Sections configurables du formulaire de mission. association_id NULL = section globale.';

create unique index mission_schema_sections_slug_uidx
  on public.mission_schema_sections
  (coalesce(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index mission_schema_sections_association_id_idx
  on public.mission_schema_sections (association_id);
create index mission_schema_sections_order_idx
  on public.mission_schema_sections (association_id, display_order);

create trigger mission_schema_sections_updated_at
  before update on public.mission_schema_sections
  for each row execute function public.handle_updated_at();

-- ============================================================
-- mission_schema_fields — champs configurables (types, règles, bindings)
-- ============================================================
create table public.mission_schema_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.mission_schema_sections (id) on delete cascade,
  association_id uuid references public.associations (id) on delete cascade,

  slug text not null,
  label text not null,
  helper_text text,
  placeholder text,

  -- Type de champ (conservé en TEXT+CHECK : ensemble large et front-driven,
  -- moins stable qu'un enum métier — TODO: enum si l'ensemble se fige).
  field_type text not null default 'text'
    check (field_type in (
      'text', 'textarea', 'number', 'boolean', 'select', 'multiselect',
      'date', 'datetime', 'tags', 'url', 'email', 'phone', 'checklist',
      'relation_event', 'relation_user', 'relation_skill', 'richtext'
    )),

  display_order integer not null default 0,
  is_required boolean not null default false,
  is_visible boolean not null default true,
  is_active boolean not null default true,
  is_admin_only boolean not null default false,
  is_locked_after_create boolean not null default false,
  is_multi_value boolean not null default false,
  is_system boolean not null default false, -- champ mappé sur une colonne native

  native_column text,           -- si is_system : colonne sur volunteer_missions
  default_value jsonb,
  options jsonb not null default '[]',        -- [{value,label,emoji}]
  validation_rules jsonb not null default '{}',
  conditions jsonb not null default '[]',     -- affichage conditionnel

  visibility_level text not null default 'internal'
    check (visibility_level in ('internal', 'volunteer', 'public')),

  applicable_poles text[] not null default '{}',
  applicable_types text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mission_schema_fields is
  'Champs configurables d''une section de mission (natifs ou custom). association_id NULL = champ global.';

create unique index mission_schema_fields_slug_uidx
  on public.mission_schema_fields
  (section_id, coalesce(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index mission_schema_fields_section_id_idx
  on public.mission_schema_fields (section_id);
create index mission_schema_fields_association_id_idx
  on public.mission_schema_fields (association_id);
create index mission_schema_fields_order_idx
  on public.mission_schema_fields (section_id, display_order);

create trigger mission_schema_fields_updated_at
  before update on public.mission_schema_fields
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Fonctions utilitaires (recalcul des slots)
-- ------------------------------------------------------------
-- Reprises de l'ancien module v1. SECURITY DEFINER pour pouvoir écrire
-- missions/shifts indépendamment des RLS de l'appelant.
-- ============================================================

-- Recalcule slots_filled sur la mission (et le shift + son statut) quand les
-- affectations changent. Compte les statuts "engagés".
-- TODO: valider l'ensemble de statuts comptabilisés (devine : confirmed+).
create or replace function public.update_mission_slots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.volunteer_missions
  set slots_filled = (
    select count(*) from public.volunteer_assignments
    where mission_id = coalesce(new.mission_id, old.mission_id)
      and status in ('confirmed', 'checked_in', 'completed')
  )
  where id = coalesce(new.mission_id, old.mission_id);

  if coalesce(new.shift_id, old.shift_id) is not null then
    update public.volunteer_shifts
    set slots_filled = (
      select count(*) from public.volunteer_assignments
      where shift_id = coalesce(new.shift_id, old.shift_id)
        and status in ('confirmed', 'checked_in', 'completed')
    ),
    status = case
      when (select count(*) from public.volunteer_assignments
            where shift_id = coalesce(new.shift_id, old.shift_id)
              and status in ('confirmed', 'checked_in', 'completed'))
           >= (select slots_needed from public.volunteer_shifts
               where id = coalesce(new.shift_id, old.shift_id))
      then 'full'::public.shift_status
      else 'open'::public.shift_status
    end
    where id = coalesce(new.shift_id, old.shift_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger volunteer_assignments_update_slots
  after insert or update or delete on public.volunteer_assignments
  for each row execute function public.update_mission_slots();

-- Journalise l'approbation d'une candidature (création d'adhésion gérée en 0003).
-- TODO: valider — l'ancien créait/mettait à jour association_memberships ici ;
-- déplacé hors de ce module (associations = 0003). On se limite au log.
create or replace function public.on_volunteer_application_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.status = 'approved'
     and old.status <> 'approved'
     and new.user_id is not null
  then
    insert into public.volunteer_activity_log (
      association_id, user_id, event_type, entity_type, entity_id, metadata, points
    ) values (
      new.association_id, new.user_id, 'application_approved', 'application', new.id,
      jsonb_build_object('source', new.source::text), 10
    );
  end if;
  return new;
end;
$$;

create trigger volunteer_applications_approved
  after update on public.volunteer_applications
  for each row execute function public.on_volunteer_application_approved();

-- ============================================================
-- RLS
-- ------------------------------------------------------------
-- Modèle : is_admin() = super-admin plateforme (0001) ; les admins d'asso
-- (is_association_admin) gèrent missions/affectations, sous réserve que
-- l'association soit "writable" (is_association_writable) pour les écritures.
-- Le bénévole voit/édite sa propre candidature et ses affectations.
-- ============================================================
alter table public.volunteer_mission_templates enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.volunteer_missions enable row level security;
alter table public.volunteer_shifts enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.volunteer_documents enable row level security;
alter table public.volunteer_messages enable row level security;
alter table public.volunteer_activity_log enable row level security;
alter table public.mission_schema_sections enable row level security;
alter table public.mission_schema_fields enable row level security;

-- ── volunteer_mission_templates : globaux lisibles par tous ; sinon membres ──
create policy "volunteer_mission_templates_select"
  on public.volunteer_mission_templates for select to authenticated
  using (
    is_global = true
    or association_id is null
    or public.is_association_member(association_id)
    or public.is_admin()
  );
create policy "volunteer_mission_templates_manage"
  on public.volunteer_mission_templates for all to authenticated
  using (
    public.is_admin()
    or (association_id is not null and public.is_association_admin(association_id))
  )
  with check (
    public.is_admin()
    or (association_id is not null
        and public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );

-- ── volunteer_applications : candidat (sienne) + admin d'asso ──
create policy "volunteer_applications_select"
  on public.volunteer_applications for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  );
-- Le candidat crée la sienne ; l'admin d'asso peut en créer (invitation…).
create policy "volunteer_applications_insert"
  on public.volunteer_applications for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
-- Le candidat n'édite la sienne que tant qu'elle est en cours ; l'admin gère tout.
create policy "volunteer_applications_update"
  on public.volunteer_applications for update to authenticated
  using (
    (user_id = auth.uid() and status in ('started', 'incomplete'))
    or public.is_admin()
    or public.is_association_admin(association_id)
  )
  with check (
    (user_id = auth.uid() and status in ('started', 'incomplete', 'pending_review'))
    or public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
create policy "volunteer_applications_delete"
  on public.volunteer_applications for delete to authenticated
  using (public.is_admin() or public.is_association_admin(association_id));

-- ── volunteer_missions : membres lisent ; admins/responsable gèrent ──
create policy "volunteer_missions_select"
  on public.volunteer_missions for select to authenticated
  using (
    public.is_association_member(association_id)
    or responsible_id = auth.uid()
    or public.is_admin()
  );
create policy "volunteer_missions_manage"
  on public.volunteer_missions for all to authenticated
  using (
    public.is_admin()
    or public.is_association_admin(association_id)
    or responsible_id = auth.uid()
  )
  with check (
    public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );

-- ── volunteer_shifts : visibilité/gestion héritées de la mission ──
create policy "volunteer_shifts_select"
  on public.volunteer_shifts for select to authenticated
  using (
    exists (
      select 1 from public.volunteer_missions m
      where m.id = volunteer_shifts.mission_id
        and (public.is_association_member(m.association_id)
             or m.responsible_id = auth.uid()
             or public.is_admin())
    )
  );
create policy "volunteer_shifts_manage"
  on public.volunteer_shifts for all to authenticated
  using (
    exists (
      select 1 from public.volunteer_missions m
      where m.id = volunteer_shifts.mission_id
        and (public.is_admin()
             or public.is_association_admin(m.association_id)
             or m.responsible_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.volunteer_missions m
      where m.id = volunteer_shifts.mission_id
        and (public.is_admin()
             or (public.is_association_admin(m.association_id)
                 and public.is_association_writable(m.association_id)))
    )
  );

-- ── volunteer_assignments : bénévole (sienne) + admin d'asso ──
create policy "volunteer_assignments_select"
  on public.volunteer_assignments for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  );
-- L'admin gère librement ; le bénévole peut confirmer/annuler la sienne.
create policy "volunteer_assignments_manage"
  on public.volunteer_assignments for all to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  )
  with check (
    public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
    or (user_id = auth.uid() and status in ('confirmed', 'cancelled'))
  );

-- ── volunteer_documents : bénévole (siens) + admin d'asso ──
create policy "volunteer_documents_select"
  on public.volunteer_documents for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  );
create policy "volunteer_documents_insert"
  on public.volunteer_documents for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
-- Validation (statut) réservée à l'admin d'asso ; le bénévole ne modifie pas.
create policy "volunteer_documents_update"
  on public.volunteer_documents for update to authenticated
  using (public.is_admin() or public.is_association_admin(association_id))
  with check (
    public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
create policy "volunteer_documents_delete"
  on public.volunteer_documents for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  );

-- ── volunteer_messages : émetteur/destinataire/broadcast ; émis par admins ──
create policy "volunteer_messages_select"
  on public.volunteer_messages for select to authenticated
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or (is_broadcast = true and public.is_association_member(association_id))
    or public.is_admin()
  );
create policy "volunteer_messages_insert"
  on public.volunteer_messages for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
-- Le destinataire peut marquer comme lu (update limité à lui-même).
create policy "volunteer_messages_update_recipient"
  on public.volunteer_messages for update to authenticated
  using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

-- ── volunteer_activity_log : lecture bénévole/admin ; insert via triggers ──
-- (pas de policy INSERT : alimenté par fonctions SECURITY DEFINER)
create policy "volunteer_activity_log_select"
  on public.volunteer_activity_log for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_association_admin(association_id)
  );

-- ── mission_schema_sections : globales lisibles par tous ; sinon membres ──
create policy "mission_schema_sections_select"
  on public.mission_schema_sections for select to authenticated
  using (
    association_id is null
    or public.is_association_member(association_id)
    or public.is_admin()
  );
create policy "mission_schema_sections_manage"
  on public.mission_schema_sections for all to authenticated
  using (
    public.is_admin()
    or (association_id is not null and public.is_association_admin(association_id))
  )
  with check (
    public.is_admin()
    or (association_id is not null
        and public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );

-- ── mission_schema_fields : idem sections ──
create policy "mission_schema_fields_select"
  on public.mission_schema_fields for select to authenticated
  using (
    association_id is null
    or public.is_association_member(association_id)
    or public.is_admin()
  );
create policy "mission_schema_fields_manage"
  on public.mission_schema_fields for all to authenticated
  using (
    public.is_admin()
    or (association_id is not null and public.is_association_admin(association_id))
  )
  with check (
    public.is_admin()
    or (association_id is not null
        and public.is_association_admin(association_id)
        and public.is_association_writable(association_id))
  );
