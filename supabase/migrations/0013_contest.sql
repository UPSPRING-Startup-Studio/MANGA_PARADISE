-- ============================================================
-- 0013 — Concours cosplay : inscriptions + configuration concours
-- ------------------------------------------------------------
-- Sources (legacy) :
--   - 20260216_create_contest_registrations.sql
--   - 20260216_add_passage_order.sql
--   - 20260216_add_media_type_to_contest_registrations.sql
--   - 20260216_add_unique_constraint_contest_registrations.sql
--   - 20260216_add_delete_policy_contest_registrations.sql
--   - 20260216_add_contest_config_column.sql / APPLY_CONTEST_CONFIG_COLUMN.sql
--   - APPLY_CONTEST_REGISTRATIONS_COMPLETE.sql
-- Dépendances : 0001 (profiles, is_admin), 0005 (events, event_schedule),
--   0006 (cosplay_plans).
-- ------------------------------------------------------------
-- Cleanups appliqués (cf. docs/data-model.md) :
--   - Admin via is_admin() (0001) au lieu de profiles.role IN ('admin','super_admin')
--     (colonne profiles.role SUPPRIMÉE en 0001).
--   - Statut / format / type de média normalisés en enums PG.
--   - cosplay_id -> cosplay_plans (0006), nullable : lie l'inscription à un cosplan.
--   - passage_time / judging_time : timestamptz RÉELS (étaient mockés côté front).
--   - event_contest_config modélisé en TABLE (1:1 event), pas en colonne JSONB
--     sur event_schedule comme dans le legacy.
--   - Contrainte unique (user_id, event_id) : une inscription par user et par event.
-- ============================================================


-- ============================================================
-- Enums
-- ============================================================

-- Statut d'une inscription au concours.
create type public.contest_registration_status as enum (
  'pending', 'approved', 'rejected', 'waitlist'
);

-- Format de prestation.
create type public.contest_format as enum (
  'solo', 'duo', 'trio', 'quatuor', 'group'
);

-- Type de média de prestation (audio uploadé, vidéo uploadée, lien externe).
create type public.contest_media_type as enum ('audio', 'video', 'link');


-- ============================================================
-- contest_registrations — inscriptions à un concours cosplay
-- ============================================================
create table public.contest_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  activity_id uuid references public.event_schedule (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- Cosplan rattaché (0006), facultatif : peut pré-remplir personnage/univers.
  cosplay_id uuid references public.cosplay_plans (id) on delete set null,

  status public.contest_registration_status not null default 'pending',

  -- Données cosplay
  character_name text not null,
  universe text,
  format public.contest_format not null,
  group_name text,

  -- Média de prestation (audio/vidéo uploadé, ou lien externe YouTube/Vimeo)
  media_type public.contest_media_type not null default 'audio',
  audio_file_url text,  -- réutilisé pour audio ET vidéo uploadés
  media_link text,      -- lien externe (YouTube/Vimeo non listé)

  -- Fichiers complémentaires
  ref_image_url text,
  wip_image_url text,

  -- Besoins techniques
  lighting_needs jsonb not null default '{}'::jsonb,
  props_needs text,

  -- Autorisation mineur
  is_minor boolean not null default false,
  guardian_name text,
  guardian_consent boolean not null default false,
  guardian_phone text,
  guardian_email text,

  -- Gestion administrative
  admin_notes text,
  passage_order integer,   -- ordre de passage des candidats validés

  -- Horaires réels (étaient mockés côté front) : créneaux planifiés par l'orga
  passage_time timestamptz,  -- heure de passage sur scène
  judging_time timestamptz,  -- heure de pré-jugement

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Une seule inscription par utilisateur et par événement.
  constraint contest_registrations_user_event_unique unique (user_id, event_id)
);

comment on table public.contest_registrations is
  'Inscriptions au concours cosplay (1/user/event). Écriture candidat (sa propre inscription) + organisateur/admin.';
comment on column public.contest_registrations.audio_file_url is
  'URL du fichier audio OU vidéo uploadé (Storage).';
comment on column public.contest_registrations.passage_order is
  'Ordre de passage sur scène, fixé par l''organisateur (candidats validés).';
comment on column public.contest_registrations.passage_time is
  'Heure réelle de passage sur scène (planifiée par l''organisateur).';
comment on column public.contest_registrations.judging_time is
  'Heure réelle de pré-jugement (planifiée par l''organisateur).';

create index contest_registrations_event_idx on public.contest_registrations (event_id);
create index contest_registrations_activity_idx on public.contest_registrations (activity_id)
  where activity_id is not null;
create index contest_registrations_user_idx on public.contest_registrations (user_id);
create index contest_registrations_cosplay_idx on public.contest_registrations (cosplay_id)
  where cosplay_id is not null;
create index contest_registrations_status_idx on public.contest_registrations (status);
create index contest_registrations_passage_order_idx
  on public.contest_registrations (event_id, passage_order) where status = 'approved';

create trigger contest_registrations_updated_at
  before update on public.contest_registrations
  for each row execute function public.handle_updated_at();


-- ============================================================
-- event_contest_config — configuration du concours par événement (1:1)
-- ------------------------------------------------------------
-- Modélisé en TABLE (et non en colonne JSONB sur event_schedule comme le
-- legacy) : config concours rattachée à l'événement, avec critères de jury.
-- ============================================================
create table public.event_contest_config (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,

  -- Type de concours (libre : performance, défilé, craftsmanship…).
  contest_type text not null default 'performance',

  -- Critères de jugement et formats autorisés (structure souple).
  judging_criteria jsonb not null default '[]'::jsonb,
  allowed_formats jsonb not null default '{
    "solo": { "enabled": true, "max_duration_sec": 90 },
    "duo": { "enabled": true, "max_duration_sec": 120 },
    "trio": { "enabled": true, "max_duration_sec": 180 },
    "quatuor": { "enabled": true, "max_duration_sec": 210 },
    "group": { "enabled": true, "max_duration_sec": 240, "max_participants": 12 }
  }'::jsonb,

  -- Logistique scène
  prejudging_time text,   -- heure indicative de pré-jugement (HH:MM)
  stage_dimensions text,
  dressing_info text,

  -- Flags
  allow_lights boolean not null default false,
  allow_props boolean not null default false,
  is_open boolean not null default false,  -- inscriptions ouvertes ?

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_contest_config is
  'Configuration du concours cosplay d''un événement (1:1) : type, critères de jury, formats, logistique scène.';

create index event_contest_config_event_idx on public.event_contest_config (event_id);

create trigger event_contest_config_updated_at
  before update on public.event_contest_config
  for each row execute function public.handle_updated_at();


-- ============================================================
-- Helper : organisateur/admin habilité sur le concours d'un événement
-- (SECURITY DEFINER → évite la récursion RLS).
-- ------------------------------------------------------------
-- Réutilise la logique d'organisateur de 0005 (events) :
--   admin plateforme, admin de l'asso organisatrice, partenaire pro
--   organisateur, ou utilisateur organisateur.
-- ============================================================
create or replace function public.can_manage_event_contest(_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = _event_id
        and (
          (e.association_id is not null and public.is_association_admin(e.association_id))
          or (e.organizer_type = 'association' and e.organizer_id is not null
              and public.is_association_admin(e.organizer_id))
          or (e.organizer_type = 'pro_partner' and e.organizer_id is not null
              and public.is_pro_partner_admin(e.organizer_id))
          or (e.organizer_type = 'user' and e.organizer_id = auth.uid())
        )
    );
$$;


-- ============================================================
-- RLS
-- ============================================================
alter table public.contest_registrations enable row level security;
alter table public.event_contest_config enable row level security;

-- ---- contest_registrations ----
-- SELECT : le candidat voit ses inscriptions ; l'organisateur/admin voit
--          toutes celles de son événement.
create policy "contest_registrations_select"
  on public.contest_registrations for select to authenticated
  using (
    auth.uid() = user_id
    or public.can_manage_event_contest(event_id)
  );

-- INSERT : le candidat crée sa propre inscription.
create policy "contest_registrations_insert_self"
  on public.contest_registrations for insert to authenticated
  with check (auth.uid() = user_id);

-- UPDATE : le candidat modifie sa propre inscription tant qu'elle est en
--          attente ; l'organisateur/admin modifie (statut, ordre, horaires…).
create policy "contest_registrations_update"
  on public.contest_registrations for update to authenticated
  using (
    (auth.uid() = user_id and status = 'pending')
    or public.can_manage_event_contest(event_id)
  )
  with check (
    auth.uid() = user_id
    or public.can_manage_event_contest(event_id)
  );

-- DELETE : le candidat supprime sa propre inscription en attente ;
--          l'organisateur/admin supprime n'importe laquelle.
create policy "contest_registrations_delete"
  on public.contest_registrations for delete to authenticated
  using (
    (auth.uid() = user_id and status = 'pending')
    or public.can_manage_event_contest(event_id)
  );

-- ---- event_contest_config ----
-- SELECT : lecture publique (la config du concours est affichée sur la page
--          de l'événement, accès anon + authentifié).
create policy "event_contest_config_select_anon"
  on public.event_contest_config for select to anon using (true);
create policy "event_contest_config_select"
  on public.event_contest_config for select to authenticated using (true);

-- INSERT/UPDATE/DELETE : organisateur/admin de l'événement.
create policy "event_contest_config_write"
  on public.event_contest_config for all to authenticated
  using (public.can_manage_event_contest(event_id))
  with check (public.can_manage_event_contest(event_id));
