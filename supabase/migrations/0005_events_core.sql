-- ============================================================
-- 0005 — Événements (cœur) : séries, events, programme, participants…
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (events, event_series,
--     event_schedule, event_participants, event_exhibitors, event_quests)
--   - legacy migrations (colonnes enrichies + RLS) :
--       20250212_event_schedule_setup, 20250212_creators_quarter_setup,
--       20260213_add_event_checkin, 20260214_event_participants_rls,
--       20260225_agenda_mvp_events_enrichment,
--       20260225_agenda_mvp_event_participants_cosplay_id,
--       20260215/20260216 contest flags, 20260216 visual_lineup_*,
--       20260403_events_association_rls, 20260409_fix_events_select_rls,
--       20260414_fix_events_update_rls_detach_association,
--       20260413_event_series_phase1,
--       20260407_agenda_bookmarks_proposals (event_proposals),
--       20260408_event_proposals_organizer_contact.
-- Dépendances : 0001 (profiles), 0003 (associations + is_association_admin),
--   0004 (pro_partners + is_pro_partner_admin). cosplay_plans est en 0006
--   (postérieur) : event_participants.cosplay_id reste donc un uuid SANS
--   contrainte FK ici (le legacy l'ajoutait aussi par ALTER ultérieur).
-- Cleanups : pas de table « bookmark » (l'agenda utilise user_favorites,
--   polymorphe, défini en 0008). planned_cosplay_id (legacy cosplay_vestiaire)
--   NON repris : on garde uniquement cosplay_id -> cosplay_plans.
-- ============================================================

-- === Enums ===
-- Type sémantique d'événement (legacy : event_type_enum sur events.type_evenement,
-- ré-utilisé aussi pour event_series.type_evenement).
create type public.event_type as enum (
  'convention', 'tournoi', 'atelier', 'meetup',
  'concert', 'exposition', 'projection', 'autre'
);

-- Organisateur polymorphe d'un événement.
create type public.event_organizer_type as enum (
  'association', 'pro_partner', 'user'
);

-- Statut de modération d'une proposition d'événement communautaire.
create type public.event_proposal_status as enum (
  'submitted', 'under_review', 'needs_changes', 'approved', 'rejected', 'published'
);

-- ============================================================
-- event_series — séries d'événements récurrents (Japan Expo…)
-- ============================================================
create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_name text not null,
  description text,
  type_evenement public.event_type,
  default_city text,
  default_venue text,
  organizer_association_id uuid references public.associations (id) on delete set null,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_series is
  'Série d''événements récurrents (slug canonique). Lecture publique, écriture admin.';

create index event_series_canonical_name_idx on public.event_series (canonical_name);
create index event_series_organizer_association_id_idx
  on public.event_series (organizer_association_id);

create trigger event_series_updated_at
  before update on public.event_series
  for each row execute function public.handle_updated_at();

-- ============================================================
-- events — événement (édition) ; organisateur polymorphe
-- ------------------------------------------------------------
-- Fusion types.ts + champs MVP Agenda + Phase 1 séries/multi-organisateur.
-- Champs legacy date/end_date/location/image_url conservés (compat) ;
-- date_debut/date_fin/adresse/cover_image sont les champs « riches ».
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),

  -- Identité / contenu
  title text not null,
  description text,
  category text not null default 'other',
  type_evenement public.event_type default 'autre',
  image_url text,
  cover_image text,
  external_link text,
  slug text unique,          -- slug d'édition (ex: japan-expo-2026)
  edition_label text,        -- libellé d'édition (ex: 2026, Sud 2026)

  -- Dates (legacy + riches)
  date timestamptz not null, -- legacy (timestamptz dans ce schéma)
  end_date timestamptz,
  time text,
  date_debut timestamptz,
  date_fin timestamptz,

  -- Lieu
  location text,
  venue_name text,
  adresse text,
  city text,
  region text,
  coordonnees_gps jsonb,     -- { "lat": number, "lng": number } (Leaflet)

  -- Billetterie / capacité
  price text,
  max_attendees int,
  ticketing_mode text not null default 'external',
  status text not null default 'draft',
  has_contest boolean not null default false, -- flag calculé (cf. trigger)
  schedule jsonb,            -- legacy : programme inline (déprécié → event_schedule)

  -- Organisateur
  organizer_type public.event_organizer_type not null default 'user',
  organizer_id uuid,         -- id polymorphe (association/pro_partner/user)
  association_id uuid references public.associations (id) on delete set null,
  series_id uuid references public.event_series (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is
  'Événement (édition). Organisateur polymorphe (organizer_type/organizer_id) + association_id/series_id. Lecture publique.';
comment on column public.events.organizer_id is
  'Id polymorphe selon organizer_type (association/pro_partner/user). Pas de FK (polymorphe).';
comment on column public.events.has_contest is
  'Vrai si au moins une activité concours cosplay dans event_schedule (maintenu par trigger).';

create index events_association_id_idx on public.events (association_id);
create index events_series_id_idx on public.events (series_id) where series_id is not null;
create index events_created_by_idx on public.events (created_by);
create index events_organizer_idx on public.events (organizer_type, organizer_id);
create index events_date_debut_idx on public.events (date_debut);
create index events_type_evenement_idx on public.events (type_evenement);
create index events_coordonnees_gps_idx on public.events using gin (coordonnees_gps);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_schedule — programme chronologique d'un événement
-- ============================================================
create table public.event_schedule (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  time text not null,        -- début HH:MM (legacy TEXT)
  start_time text,           -- présent dans types.ts (souvent = time)
  end_time text,
  title text not null,
  location text,
  category text not null default 'other',
  description text,
  day_date text,             -- jour (YYYY-MM-DD) pour les events multi-jours
  is_cosplay_contest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_schedule is
  'Items de programme (animations, panels, concerts…). Lecture publique, écriture admin/organisateur.';
comment on column public.event_schedule.category is
  'animation, conference, meet_greet, concert, gaming, cosplay, workshop, contest, screening, other.';

create index event_schedule_event_id_idx on public.event_schedule (event_id);
create index event_schedule_is_cosplay_contest_idx
  on public.event_schedule (is_cosplay_contest) where is_cosplay_contest = true;

create trigger event_schedule_updated_at
  before update on public.event_schedule
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_participants — inscriptions / présence / line-up visuel
-- ------------------------------------------------------------
-- cosplay_id : uuid sans FK (cosplay_plans est en 0006, postérieur).
-- attendance_dates/cosplay_data : jsonb (types.ts) — divergence legacy où
-- une migration les avait passées en TEXT[] ; on retient le type le plus récent.
-- ============================================================
create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'visitor', -- visitor, cosplayer, photographer, volunteer
  registered_at timestamptz not null default now(),

  -- Check-in
  is_present boolean not null default false,
  checked_in_at timestamptz,

  -- Line-up visuel / cosplay (cosplay_id -> cosplay_plans, sans FK : table 0006)
  cosplay_id uuid,
  universe text,
  attendance_details jsonb,
  attendance_dates jsonb,
  cosplay_data jsonb,

  unique (event_id, user_id)
);

comment on table public.event_participants is
  'Inscriptions à un événement (présence + données cosplay/line-up). Lecture publique, écriture self + admin.';

create index event_participants_event_id_idx on public.event_participants (event_id);
create index event_participants_user_id_idx on public.event_participants (user_id);
create index event_participants_cosplay_id_idx
  on public.event_participants (cosplay_id) where cosplay_id is not null;
create index event_participants_universe_idx on public.event_participants (universe);

-- ============================================================
-- event_exhibitors — exposants / stands d'un événement
-- ============================================================
create table public.event_exhibitors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stand_name text not null,
  stand_description text,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_exhibitors is
  'Candidatures/stands d''exposants. Lecture publique des stands approuvés ; self + admin sinon.';

create index event_exhibitors_event_id_idx on public.event_exhibitors (event_id);
create index event_exhibitors_user_id_idx on public.event_exhibitors (user_id);

create trigger event_exhibitors_updated_at
  before update on public.event_exhibitors
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_quests — quêtes actives sur un événement (N:M events<->quests)
-- (FK quest_id -> quests défini en 0010 ; on ne pose donc PAS la FK ici)
-- ============================================================
create table public.event_quests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  quest_id uuid not null, -- FK -> quests(0010) ajoutée dans la migration gamification
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, quest_id)
);

comment on table public.event_quests is
  'Association événement <-> quête (quest_id : FK posée en 0010). Lecture publique, écriture admin.';

create index event_quests_event_id_idx on public.event_quests (event_id);
create index event_quests_quest_id_idx on public.event_quests (quest_id);

-- ============================================================
-- event_proposals — file de modération des propositions communautaires
-- (migration-only : 20260407 + 20260408)
-- RÈGLE PRODUIT : aucune publication automatique.
-- ============================================================
create table public.event_proposals (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,

  -- Données de l'événement proposé
  title text not null,
  type_evenement text,
  organisateur text,
  city text,
  venue_name text,
  date_debut date not null,
  date_fin date,
  description text,
  external_link text,
  image_url text,
  verification_source text,
  is_free boolean not null default true,
  is_organizer boolean not null default false,

  -- Coordonnées contact organisateur (confidentiel, admin/owner only)
  organizer_contact_first_name text,
  organizer_contact_last_name text,
  organizer_contact_email text,
  organizer_contact_phone text,
  organizer_contact_role text,

  -- Modération
  status public.event_proposal_status not null default 'submitted',
  admin_notes text,        -- notes internes (non visibles du membre)
  rejection_reason text,   -- motif de rejet (visible du membre)
  reviewed_by uuid references public.profiles (id) on delete set null,
  published_event_id uuid references public.events (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_proposals is
  'Propositions d''événements soumises par les membres (modération MP). Aucune publication auto.';

create index event_proposals_submitted_by_idx on public.event_proposals (submitted_by);
create index event_proposals_status_idx on public.event_proposals (status);

create trigger event_proposals_updated_at
  before update on public.event_proposals
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Trigger : maintien du flag events.has_contest
-- ============================================================
create or replace function public.update_event_has_contest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.events
  set has_contest = exists (
    select 1 from public.event_schedule
    where event_id = coalesce(new.event_id, old.event_id)
      and (category in ('contest', 'cosplay_contest') or is_cosplay_contest = true)
  )
  where id = coalesce(new.event_id, old.event_id);
  return coalesce(new, old);
end;
$$;

create trigger event_schedule_has_contest
  after insert or update or delete on public.event_schedule
  for each row execute function public.update_event_has_contest();

-- ============================================================
-- RLS
-- ============================================================
alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_schedule enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_exhibitors enable row level security;
alter table public.event_quests enable row level security;
alter table public.event_proposals enable row level security;

-- ── event_series : lecture publique, écriture admin ──────────
create policy "event_series_select_all"
  on public.event_series for select to authenticated using (true);
create policy "event_series_admin_write"
  on public.event_series for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── events : lecture publique ; écriture par admin asso/pro OU admin ──
-- Un organisateur peut gérer SES événements selon organizer_type :
--   association -> is_association_admin(organizer_id|association_id)
--   pro_partner -> is_pro_partner_admin(organizer_id)
create policy "events_select_all"
  on public.events for select to authenticated using (true);

create policy "events_insert_organizer"
  on public.events for insert to authenticated
  with check (
    public.is_admin()
    or (association_id is not null and public.is_association_admin(association_id))
    or (organizer_type = 'association' and organizer_id is not null
        and public.is_association_admin(organizer_id))
    or (organizer_type = 'pro_partner' and organizer_id is not null
        and public.is_pro_partner_admin(organizer_id))
    or (organizer_type = 'user' and organizer_id = auth.uid())
  );

create policy "events_update_organizer"
  on public.events for update to authenticated
  using (
    public.is_admin()
    or (association_id is not null and public.is_association_admin(association_id))
    or (organizer_type = 'association' and organizer_id is not null
        and public.is_association_admin(organizer_id))
    or (organizer_type = 'pro_partner' and organizer_id is not null
        and public.is_pro_partner_admin(organizer_id))
    or (organizer_type = 'user' and organizer_id = auth.uid())
  )
  with check (
    -- admin sans restriction ; sinon autorise le détachement (association_id null)
    -- ou la conservation sur une asso/pro que l'on administre.
    public.is_admin()
    or association_id is null
    or public.is_association_admin(association_id)
    or (organizer_type = 'pro_partner' and organizer_id is not null
        and public.is_pro_partner_admin(organizer_id))
    or (organizer_type = 'user' and organizer_id = auth.uid())
  );

create policy "events_delete_admin"
  on public.events for delete to authenticated
  using (public.is_admin());

-- ── event_schedule : lecture publique ; écriture admin ou organisateur ──
create policy "event_schedule_select_all"
  on public.event_schedule for select to authenticated using (true);
create policy "event_schedule_write_organizer"
  on public.event_schedule for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_schedule.event_id
        and (
          (e.association_id is not null and public.is_association_admin(e.association_id))
          or (e.organizer_type = 'pro_partner' and e.organizer_id is not null
              and public.is_pro_partner_admin(e.organizer_id))
          or (e.organizer_type = 'user' and e.organizer_id = auth.uid())
        )
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_schedule.event_id
        and (
          (e.association_id is not null and public.is_association_admin(e.association_id))
          or (e.organizer_type = 'pro_partner' and e.organizer_id is not null
              and public.is_pro_partner_admin(e.organizer_id))
          or (e.organizer_type = 'user' and e.organizer_id = auth.uid())
        )
    )
  );

-- ── event_participants : lecture publique (line-up) ; écriture self + admin ──
create policy "event_participants_select_all"
  on public.event_participants for select to authenticated using (true);
create policy "event_participants_insert_self"
  on public.event_participants for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_participants_update_self"
  on public.event_participants for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event_participants_delete_self"
  on public.event_participants for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "event_participants_admin_all"
  on public.event_participants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── event_exhibitors : stands approuvés publics ; self + admin sinon ──
create policy "event_exhibitors_select_approved"
  on public.event_exhibitors for select to authenticated
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "event_exhibitors_insert_self"
  on public.event_exhibitors for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_exhibitors_update_self_or_admin"
  on public.event_exhibitors for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "event_exhibitors_admin_all"
  on public.event_exhibitors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── event_quests : lecture publique ; écriture admin ──
create policy "event_quests_select_all"
  on public.event_quests for select to authenticated using (true);
create policy "event_quests_admin_write"
  on public.event_quests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── event_proposals : owner voit/édite les siennes ; admin total ──
create policy "event_proposals_select_own_or_admin"
  on public.event_proposals for select to authenticated
  using (auth.uid() = submitted_by or public.is_admin());
create policy "event_proposals_insert_own"
  on public.event_proposals for insert to authenticated
  with check (auth.uid() = submitted_by);
-- Membre : éditable seulement si status = 'needs_changes' ; admin : tout.
create policy "event_proposals_update_own_needs_changes"
  on public.event_proposals for update to authenticated
  using (
    (auth.uid() = submitted_by and status = 'needs_changes')
    or public.is_admin()
  )
  with check (auth.uid() = submitted_by or public.is_admin());
create policy "event_proposals_admin_all"
  on public.event_proposals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
