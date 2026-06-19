-- ==============================================================
-- Favoris d'événements & Propositions communautaires
-- Version : 20260407
-- ==============================================================

-- ── TABLE : event_bookmarks ────────────────────────────────────
-- Permet à un membre connecté de sauvegarder un événement.

create table if not exists public.event_bookmarks (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  event_id   uuid        not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);

alter table public.event_bookmarks enable row level security;

create policy "event_bookmarks_select_own"
  on public.event_bookmarks for select
  using (auth.uid() = user_id);

create policy "event_bookmarks_insert_own"
  on public.event_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "event_bookmarks_delete_own"
  on public.event_bookmarks for delete
  using (auth.uid() = user_id);

-- ── TYPE : event_proposal_status ──────────────────────────────

do $$ begin
  create type public.event_proposal_status as enum (
    'submitted',
    'under_review',
    'needs_changes',
    'approved',
    'rejected',
    'published'
  );
exception when duplicate_object then null; end $$;

-- ── TABLE : event_proposals ────────────────────────────────────
-- File de modération : les membres soumettent, l'équipe MP valide.
-- RÈGLE PRODUIT : aucune proposition n'est publiée automatiquement.

create table if not exists public.event_proposals (
  id                   uuid        primary key default gen_random_uuid(),
  submitted_by         uuid        not null references auth.users(id) on delete cascade,

  -- Données de l'événement proposé
  title                text        not null,
  type_evenement       text,
  organisateur         text,
  city                 text,
  venue_name           text,
  date_debut           date        not null,
  date_fin             date,
  description          text,
  external_link        text,
  image_url            text,
  verification_source  text,
  is_free              boolean     not null default true,
  is_organizer         boolean     not null default false,

  -- Modération
  status               public.event_proposal_status not null default 'submitted',
  admin_notes          text,        -- Notes internes (non visibles du membre)
  rejection_reason     text,        -- Motif de rejet (visible du membre)
  reviewed_by          uuid        references auth.users(id) on delete set null,
  published_event_id   uuid        references public.events(id) on delete set null,

  -- Méta
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.event_proposals enable row level security;

-- Membres et admins peuvent voir leurs propres propositions (+ admins voient tout)
create policy "event_proposals_select"
  on public.event_proposals for select
  using (
    auth.uid() = submitted_by
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or role_function = 'admin')
    )
  );

-- Membres : soumettre une proposition
create policy "event_proposals_insert_own"
  on public.event_proposals for insert
  with check (auth.uid() = submitted_by);

-- Membres : modifier si status = 'needs_changes' ; admins : modifier tout
create policy "event_proposals_update"
  on public.event_proposals for update
  using (
    (auth.uid() = submitted_by and status = 'needs_changes')
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or role_function = 'admin')
    )
  )
  with check (
    auth.uid() = submitted_by
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (role = 'admin' or role_function = 'admin')
    )
  );

-- ── Trigger : updated_at automatique ─────────────────────────

create or replace function public.set_event_proposals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_proposals_updated_at on public.event_proposals;
create trigger event_proposals_updated_at
  before update on public.event_proposals
  for each row execute function public.set_event_proposals_updated_at();
