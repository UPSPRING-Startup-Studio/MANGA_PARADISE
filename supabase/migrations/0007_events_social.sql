-- ============================================================
-- 0007 — Social événementiel : parties, squads, line-ups, rencontres…
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (event_parties,
--     event_party_members, party_invitations, event_encounters,
--     event_memories, event_memory_photos, meetups, meetup_participants,
--     cosplay_lineups)
--   - legacy migrations (tables absentes de types.ts + RLS) :
--       20260226_create_squads, 20260225_party_finder_slots_architecture,
--       20260226_create_event_lineups, 20260411_create_event_cosplay_lineups,
--       20260216_visual_lineup_phase1_cleanup, 20260216_visual_lineup_rls_policies.
-- Dépendances : 0001 (profiles), 0005 (events), 0006 (cosplay_plans) —
--   tous de numéro inférieur, FK OK.
-- Cleanups : legacy référençait cosplay_vestiaire pour cosplay_lineups.cosplay_id
--   -> remplacé par cosplay_plans (table unifiée). event_parties.slots (jsonb)
--   conservé pour compat ; le modèle riche passe par squads/squad_slots.
-- ============================================================

-- === Enums ===
-- Statut d'invitation (party_invitations ; legacy : enum invitation_status).
create type public.invitation_status as enum (
  'pending', 'accepted', 'declined'
);

-- Mode / visibilité d'une party (legacy : TEXT libres → normalisés).
create type public.party_mode as enum ('squad', 'shooting', 'concours');
create type public.party_visibility as enum ('public', 'private');

-- Statut d'adhésion à une party / squad.
create type public.party_member_status as enum ('pending', 'accepted', 'declined');

-- Type de slot d'une squad (rôle recherché).
create type public.squad_slot_role as enum ('character', 'staff', 'generic');

-- Créneau de line-up cosplay sur une journée.
create type public.cosplay_slot_type as enum ('full_day', 'morning', 'afternoon');

-- ============================================================
-- event_parties — groupes (party finder « léger ») rattachés à un event
-- ============================================================
create table public.event_parties (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  mode public.party_mode not null default 'squad',
  visibility public.party_visibility not null default 'public',
  max_members int,
  slots jsonb,               -- legacy : définition de slots inline (compat)
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_parties is
  'Groupe de participants autour d''un événement. Lecture selon visibilité ; écriture créateur + admin.';

create index event_parties_event_id_idx on public.event_parties (event_id);
create index event_parties_creator_id_idx on public.event_parties (creator_id);

create trigger event_parties_updated_at
  before update on public.event_parties
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_party_members — membres d'une party
-- ============================================================
create table public.event_party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.event_parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  slot_index int,
  status public.party_member_status not null default 'pending',
  joined_at timestamptz not null default now(),
  unique (party_id, user_id)
);

comment on table public.event_party_members is
  'Membres d''une party (statut d''adhésion + slot). Lecture/écriture membre & créateur + admin.';

create index event_party_members_party_id_idx on public.event_party_members (party_id);
create index event_party_members_user_id_idx on public.event_party_members (user_id);

-- ============================================================
-- party_invitations — invitations à rejoindre une party
-- ============================================================
create table public.party_invitations (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.event_parties (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.party_invitations is
  'Invitations à rejoindre une party. Visibles/gérables par émetteur, destinataire + admin.';

create index party_invitations_party_id_idx on public.party_invitations (party_id);
create index party_invitations_receiver_id_idx on public.party_invitations (receiver_id);
create index party_invitations_sender_id_idx on public.party_invitations (sender_id);

create trigger party_invitations_updated_at
  before update on public.party_invitations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- squads — groupes cosplay (Party Finder, modèle slot-based)
-- (migration-only : 20260226_create_squads + 20260225 slots)
-- ============================================================
create table public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  target_event_id uuid references public.events (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  mode public.party_mode not null default 'squad',
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  constraint squads_name_not_empty check (length(trim(name)) > 0)
);

comment on table public.squads is
  'Groupe cosplay organisé autour d''un événement (Party Finder). Lecture publique ; écriture leader + admin.';

create index squads_target_event_id_idx on public.squads (target_event_id);
create index squads_created_by_idx on public.squads (created_by);
create index squads_mode_idx on public.squads (mode);

-- ============================================================
-- squad_slots — ouvertures (rôles/places) définies par le leader
-- ============================================================
create table public.squad_slots (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  title text not null,
  role_type public.squad_slot_role not null default 'generic',
  requirements text,
  created_at timestamptz not null default now(),
  constraint squad_slots_title_not_empty check (length(trim(title)) > 0)
);

comment on table public.squad_slots is
  'Place ouverte dans une squad (rôle/staff/générique). Lecture publique ; écriture leader + admin.';

create index squad_slots_squad_id_idx on public.squad_slots (squad_id);
create index squad_slots_role_type_idx on public.squad_slots (role_type);

-- ============================================================
-- squad_members — candidatures/adhésions (1 par slot par user)
-- ============================================================
create table public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  slot_id uuid references public.squad_slots (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  cosplay_plan_id uuid references public.cosplay_plans (id) on delete set null,
  status public.party_member_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint squad_members_slot_user_unique unique (slot_id, user_id)
);

comment on table public.squad_members is
  'Adhésion d''un user à une squad/slot (+ cosplay_plan apporté). Lecture publique ; écriture membre & leader + admin.';

create index squad_members_squad_id_idx on public.squad_members (squad_id);
create index squad_members_slot_id_idx on public.squad_members (slot_id);
create index squad_members_user_id_idx on public.squad_members (user_id);
create index squad_members_cosplay_plan_id_idx on public.squad_members (cosplay_plan_id);

-- ============================================================
-- event_lineups — N:M cosplay_plans <-> events (« je porte ce cosplay ici »)
-- (migration-only : 20260226_create_event_lineups)
-- ============================================================
create table public.event_lineups (
  id uuid primary key default gen_random_uuid(),
  cosplay_plan_id uuid not null references public.cosplay_plans (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_lineups_cosplay_event_unique unique (cosplay_plan_id, event_id)
);

comment on table public.event_lineups is
  'Affectation N:M cosplay_plan <-> événement. Lecture/écriture propriétaire + admin.';

create index event_lineups_cosplay_plan_id_idx on public.event_lineups (cosplay_plan_id);
create index event_lineups_event_id_idx on public.event_lineups (event_id);
create index event_lineups_user_id_idx on public.event_lineups (user_id);

-- ============================================================
-- event_cosplay_lineups — line-up cosplay par jour & créneau
-- (migration-only : 20260411_create_event_cosplay_lineups)
-- ============================================================
create table public.event_cosplay_lineups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  cosplay_project_id uuid references public.cosplay_plans (id) on delete set null,
  event_date date not null,
  slot_type public.cosplay_slot_type not null default 'full_day',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_cosplay_lineups_user_event_date_slot_unique
    unique (user_id, event_id, event_date, slot_type)
);

comment on table public.event_cosplay_lineups is
  'Line-up cosplay par jour/créneau (visual line-up). Lecture publique ; écriture propriétaire + admin.';

create index event_cosplay_lineups_user_id_idx on public.event_cosplay_lineups (user_id);
create index event_cosplay_lineups_event_id_idx on public.event_cosplay_lineups (event_id);
create index event_cosplay_lineups_cosplay_project_id_idx
  on public.event_cosplay_lineups (cosplay_project_id) where cosplay_project_id is not null;
create index event_cosplay_lineups_event_date_idx on public.event_cosplay_lineups (event_date);

create trigger event_cosplay_lineups_updated_at
  before update on public.event_cosplay_lineups
  for each row execute function public.handle_updated_at();

-- ============================================================
-- cosplay_lineups — line-up legacy (cosplay_id -> cosplay_plans)
-- (types.ts ; legacy pointait sur cosplay_vestiaire -> remplacé)
-- ============================================================
create table public.cosplay_lineups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  cosplay_id uuid references public.cosplay_plans (id) on delete set null,
  event_date date not null,
  slot_type text not null default 'full_day',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cosplay_lineups is
  'Line-up cosplay (variante legacy, cosplay_id -> cosplay_plans). Lecture publique ; écriture propriétaire + admin.';

create index cosplay_lineups_user_id_idx on public.cosplay_lineups (user_id);
create index cosplay_lineups_event_id_idx on public.cosplay_lineups (event_id);
create index cosplay_lineups_cosplay_id_idx
  on public.cosplay_lineups (cosplay_id) where cosplay_id is not null;

create trigger cosplay_lineups_updated_at
  before update on public.cosplay_lineups
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_encounters — rencontres faites pendant un événement
-- ============================================================
create table public.event_encounters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  encountered_user_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.event_encounters is
  'Personnes rencontrées lors d''un événement (carnet privé). Lecture/écriture propriétaire + admin.';

create index event_encounters_event_id_idx on public.event_encounters (event_id);
create index event_encounters_user_id_idx on public.event_encounters (user_id);
create index event_encounters_encountered_user_id_idx
  on public.event_encounters (encountered_user_id);

-- ============================================================
-- event_memories — souvenirs textuels d'un événement
-- ============================================================
create table public.event_memories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.event_memories is
  'Souvenir/texte d''un utilisateur sur un événement. Lecture publique ; écriture propriétaire + admin.';

create index event_memories_event_id_idx on public.event_memories (event_id);
create index event_memories_user_id_idx on public.event_memories (user_id);

create trigger event_memories_updated_at
  before update on public.event_memories
  for each row execute function public.handle_updated_at();

-- ============================================================
-- event_memory_photos — photos rattachées aux souvenirs
-- ============================================================
create table public.event_memory_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

comment on table public.event_memory_photos is
  'Photos de souvenirs d''événement. Lecture publique ; écriture propriétaire + admin.';

create index event_memory_photos_event_id_idx on public.event_memory_photos (event_id);
create index event_memory_photos_user_id_idx on public.event_memory_photos (user_id);

-- ============================================================
-- meetups — rendez-vous communautaires (éventuellement liés à un event)
-- ============================================================
create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  title text not null,
  theme text not null,
  description text,
  location text not null,
  cover_image text,
  start_time timestamptz not null,
  max_participants int not null default 0,
  current_participants int not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meetups is
  'Rendez-vous communautaire (lié ou non à un événement). Lecture publique ; écriture organisateur + admin.';

create index meetups_organizer_id_idx on public.meetups (organizer_id);
create index meetups_event_id_idx on public.meetups (event_id);

create trigger meetups_updated_at
  before update on public.meetups
  for each row execute function public.handle_updated_at();

-- ============================================================
-- meetup_participants — participants d'un meetup
-- ============================================================
create table public.meetup_participants (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (meetup_id, user_id)
);

comment on table public.meetup_participants is
  'Participants d''un meetup. Lecture publique ; écriture self + organisateur + admin.';

create index meetup_participants_meetup_id_idx on public.meetup_participants (meetup_id);
create index meetup_participants_user_id_idx on public.meetup_participants (user_id);

-- ============================================================
-- Fonctions (SECURITY DEFINER) — signatures issues de types.ts Functions
-- ============================================================

-- Vrai si _user_id est le créateur de la party.
create or replace function public.is_party_creator(_party_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_parties
    where id = _party_id and creator_id = _user_id
  );
$$;

-- Vrai si _user_id est membre accepté de la party (ou son créateur).
create or replace function public.is_party_member(_party_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_party_members
    where party_id = _party_id
      and user_id = _user_id
      and status = 'accepted'
  ) or public.is_party_creator(_party_id, _user_id);
$$;

-- Nombre d'événements distincts où ce cosplay (cosplay_plan) a été porté/prévu.
-- TODO: valider la définition métier (agrège event_lineups + event_cosplay_lineups).
create or replace function public.get_cosplay_events_count(p_cosplay_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct event_id)::int
  from (
    select event_id from public.event_lineups where cosplay_plan_id = p_cosplay_id
    union
    select event_id from public.event_cosplay_lineups where cosplay_project_id = p_cosplay_id
    union
    select event_id from public.cosplay_lineups where cosplay_id = p_cosplay_id
  ) e;
$$;

-- Nombre de personnes distinctes rencontrées sur les événements liés à ce cosplay.
-- TODO: valider — on relie le cosplay à ses événements puis on compte les
-- rencontres du propriétaire du cosplay sur ces événements.
create or replace function public.get_cosplay_people_met(p_cosplay_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with owner as (
    select user_id from public.cosplay_plans where id = p_cosplay_id
  ),
  evts as (
    select event_id from public.event_lineups where cosplay_plan_id = p_cosplay_id
    union
    select event_id from public.event_cosplay_lineups where cosplay_project_id = p_cosplay_id
    union
    select event_id from public.cosplay_lineups where cosplay_id = p_cosplay_id
  )
  select count(distinct enc.encountered_user_id)::int
  from public.event_encounters enc
  join owner o on enc.user_id = o.user_id
  where enc.event_id in (select event_id from evts);
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.event_parties enable row level security;
alter table public.event_party_members enable row level security;
alter table public.party_invitations enable row level security;
alter table public.squads enable row level security;
alter table public.squad_slots enable row level security;
alter table public.squad_members enable row level security;
alter table public.event_lineups enable row level security;
alter table public.event_cosplay_lineups enable row level security;
alter table public.cosplay_lineups enable row level security;
alter table public.event_encounters enable row level security;
alter table public.event_memories enable row level security;
alter table public.event_memory_photos enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_participants enable row level security;

-- ── event_parties : public si visible, sinon créateur/membre ; écriture créateur ──
create policy "event_parties_select"
  on public.event_parties for select to authenticated
  using (
    visibility = 'public'
    or public.is_party_creator(id, auth.uid())
    or public.is_party_member(id, auth.uid())
    or public.is_admin()
  );
create policy "event_parties_insert_creator"
  on public.event_parties for insert to authenticated
  with check (auth.uid() = creator_id);
create policy "event_parties_update_creator"
  on public.event_parties for update to authenticated
  using (auth.uid() = creator_id or public.is_admin())
  with check (auth.uid() = creator_id or public.is_admin());
create policy "event_parties_delete_creator"
  on public.event_parties for delete to authenticated
  using (auth.uid() = creator_id or public.is_admin());

-- ── event_party_members : membre & créateur ──
create policy "event_party_members_select"
  on public.event_party_members for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_party_creator(party_id, auth.uid())
    or public.is_party_member(party_id, auth.uid())
    or public.is_admin()
  );
create policy "event_party_members_insert_self"
  on public.event_party_members for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_party_members_update"
  on public.event_party_members for update to authenticated
  using (auth.uid() = user_id or public.is_party_creator(party_id, auth.uid()) or public.is_admin())
  with check (auth.uid() = user_id or public.is_party_creator(party_id, auth.uid()) or public.is_admin());
create policy "event_party_members_delete"
  on public.event_party_members for delete to authenticated
  using (auth.uid() = user_id or public.is_party_creator(party_id, auth.uid()) or public.is_admin());

-- ── party_invitations : émetteur/destinataire + admin ──
create policy "party_invitations_select"
  on public.party_invitations for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin());
create policy "party_invitations_insert_sender"
  on public.party_invitations for insert to authenticated
  with check (auth.uid() = sender_id and public.is_party_creator(party_id, auth.uid()));
-- Le destinataire répond (accept/decline) ; l'émetteur peut annuler.
create policy "party_invitations_update"
  on public.party_invitations for update to authenticated
  using (auth.uid() = receiver_id or auth.uid() = sender_id or public.is_admin())
  with check (auth.uid() = receiver_id or auth.uid() = sender_id or public.is_admin());
create policy "party_invitations_delete"
  on public.party_invitations for delete to authenticated
  using (auth.uid() = sender_id or public.is_admin());

-- ── squads : lecture publique ; écriture leader (created_by) + admin ──
create policy "squads_select_all"
  on public.squads for select to authenticated using (true);
create policy "squads_insert_leader"
  on public.squads for insert to authenticated
  with check (auth.uid() = created_by);
create policy "squads_update_leader"
  on public.squads for update to authenticated
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());
create policy "squads_delete_leader"
  on public.squads for delete to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- ── squad_slots : lecture publique ; écriture leader de la squad + admin ──
create policy "squad_slots_select_all"
  on public.squad_slots for select to authenticated using (true);
create policy "squad_slots_write_leader"
  on public.squad_slots for all to authenticated
  using (
    public.is_admin()
    or auth.uid() in (select created_by from public.squads where id = squad_slots.squad_id)
  )
  with check (
    public.is_admin()
    or auth.uid() in (select created_by from public.squads where id = squad_slots.squad_id)
  );

-- ── squad_members : lecture publique ; membre & leader + admin ──
create policy "squad_members_select_all"
  on public.squad_members for select to authenticated using (true);
create policy "squad_members_insert_self"
  on public.squad_members for insert to authenticated
  with check (auth.uid() = user_id);
create policy "squad_members_update"
  on public.squad_members for update to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
    or auth.uid() in (select created_by from public.squads where id = squad_members.squad_id)
  )
  with check (
    auth.uid() = user_id
    or public.is_admin()
    or auth.uid() in (select created_by from public.squads where id = squad_members.squad_id)
  );
create policy "squad_members_delete"
  on public.squad_members for delete to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
    or auth.uid() in (select created_by from public.squads where id = squad_members.squad_id)
  );

-- ── event_lineups : propriétaire + admin ──
create policy "event_lineups_select_own"
  on public.event_lineups for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "event_lineups_insert_own"
  on public.event_lineups for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_lineups_delete_own"
  on public.event_lineups for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── event_cosplay_lineups : lecture publique (visual line-up) ; écriture propriétaire ──
create policy "event_cosplay_lineups_select_all"
  on public.event_cosplay_lineups for select to authenticated using (true);
create policy "event_cosplay_lineups_insert_own"
  on public.event_cosplay_lineups for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_cosplay_lineups_update_own"
  on public.event_cosplay_lineups for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event_cosplay_lineups_delete_own"
  on public.event_cosplay_lineups for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── cosplay_lineups : lecture publique ; écriture propriétaire ──
create policy "cosplay_lineups_select_all"
  on public.cosplay_lineups for select to authenticated using (true);
create policy "cosplay_lineups_insert_own"
  on public.cosplay_lineups for insert to authenticated
  with check (auth.uid() = user_id);
create policy "cosplay_lineups_update_own"
  on public.cosplay_lineups for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cosplay_lineups_delete_own"
  on public.cosplay_lineups for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── event_encounters : carnet privé (propriétaire) + admin ──
create policy "event_encounters_select_own"
  on public.event_encounters for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "event_encounters_insert_own"
  on public.event_encounters for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_encounters_update_own"
  on public.event_encounters for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event_encounters_delete_own"
  on public.event_encounters for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── event_memories : lecture publique ; écriture propriétaire + admin ──
create policy "event_memories_select_all"
  on public.event_memories for select to authenticated using (true);
create policy "event_memories_insert_own"
  on public.event_memories for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_memories_update_own"
  on public.event_memories for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event_memories_delete_own"
  on public.event_memories for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── event_memory_photos : lecture publique ; écriture propriétaire + admin ──
create policy "event_memory_photos_select_all"
  on public.event_memory_photos for select to authenticated using (true);
create policy "event_memory_photos_insert_own"
  on public.event_memory_photos for insert to authenticated
  with check (auth.uid() = user_id);
create policy "event_memory_photos_delete_own"
  on public.event_memory_photos for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── meetups : lecture publique ; écriture organisateur + admin ──
create policy "meetups_select_all"
  on public.meetups for select to authenticated using (true);
create policy "meetups_insert_organizer"
  on public.meetups for insert to authenticated
  with check (auth.uid() = organizer_id);
create policy "meetups_update_organizer"
  on public.meetups for update to authenticated
  using (auth.uid() = organizer_id or public.is_admin())
  with check (auth.uid() = organizer_id or public.is_admin());
create policy "meetups_delete_organizer"
  on public.meetups for delete to authenticated
  using (auth.uid() = organizer_id or public.is_admin());

-- ── meetup_participants : lecture publique ; self + organisateur + admin ──
create policy "meetup_participants_select_all"
  on public.meetup_participants for select to authenticated using (true);
create policy "meetup_participants_insert_self"
  on public.meetup_participants for insert to authenticated
  with check (auth.uid() = user_id);
create policy "meetup_participants_delete"
  on public.meetup_participants for delete to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
    or auth.uid() in (select organizer_id from public.meetups where id = meetup_participants.meetup_id)
  );
