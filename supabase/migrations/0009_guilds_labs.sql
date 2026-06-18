-- ============================================================
-- 0009 — Guildes & Labs (idées communautaires)
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (guild_categories, guilds,
--     guild_members, guild_invitations, guild_posts, guild_events,
--     labs_ideas, labs_votes) — colonnes & relations.
-- Dépendances : 0001 (profiles), 0005 (events) — numéros inférieurs, FK OK.
-- Cleanups : valeurs TEXT libres de l'ancien schéma normalisées en enums PG
--   quand l'ensemble est stable (rôle/statut/accès guilde, statut/catégorie labs).
--   guild_events.location_type laissé en TEXT (valeurs métier non figées).
-- ============================================================

-- === Enums ===
-- Rôle d'un membre dans une guilde (master = fondateur ; officer = staff).
create type public.guild_role as enum ('master', 'officer', 'member');

-- Cycle de vie d'une guilde.
create type public.guild_status as enum ('active', 'pending', 'archived');

-- Mode d'accès à une guilde.
create type public.guild_access_type as enum ('public', 'private', 'invite_only');

-- Statut d'une invitation de guilde.
create type public.guild_invitation_status as enum ('pending', 'accepted', 'declined');

-- Catégorie d'une idée Labs (types.ts : labs_category).
create type public.labs_category as enum ('event', 'feature', 'merch', 'other');

-- Statut d'une idée Labs (types.ts : labs_status).
create type public.labs_status as enum (
  'draft', 'voting', 'review', 'approved', 'rejected'
);

-- ============================================================
-- guild_categories — catégories de guildes (référentiel)
-- ============================================================
create table public.guild_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

comment on table public.guild_categories is
  'Catégories de guildes (référentiel). Lecture publique ; écriture admin.';

-- ============================================================
-- guilds — guildes (communautés thématiques)
-- ============================================================
create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  goal text,
  category_id uuid references public.guild_categories (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  access_type public.guild_access_type not null default 'public',
  status public.guild_status not null default 'active',
  city text,
  banner_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guilds is
  'Guilde (communauté thématique). Lecture publique ; écriture master/officers (is_guild_admin) + admin.';

create index guilds_category_id_idx on public.guilds (category_id);
create index guilds_created_by_idx on public.guilds (created_by);
create index guilds_status_idx on public.guilds (status);

create trigger guilds_updated_at
  before update on public.guilds
  for each row execute function public.handle_updated_at();

-- ============================================================
-- guild_members — appartenance à une guilde (1 par user/guilde)
-- ============================================================
create table public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.guild_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (guild_id, user_id)
);

comment on table public.guild_members is
  'Membres d''une guilde (rôle master/officer/member). Lecture publique ; le membre gère son appartenance, master/officers gèrent les autres.';

create index guild_members_guild_id_idx on public.guild_members (guild_id);
create index guild_members_user_id_idx on public.guild_members (user_id);

-- ============================================================
-- guild_invitations — invitations à rejoindre une guilde
-- ============================================================
create table public.guild_invitations (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status public.guild_invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guild_invitations is
  'Invitations à rejoindre une guilde. Visibles/gérables par destinataire, émetteur (master/officers) + admin.';

create index guild_invitations_guild_id_idx on public.guild_invitations (guild_id);
create index guild_invitations_user_id_idx on public.guild_invitations (user_id);
create index guild_invitations_invited_by_idx on public.guild_invitations (invited_by);

create trigger guild_invitations_updated_at
  before update on public.guild_invitations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- guild_posts — publications dans une guilde
-- ============================================================
create table public.guild_posts (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  content text,
  image_url text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guild_posts is
  'Publications d''une guilde. Lecture publique ; écriture master/officers (is_guild_admin) + admin.';

create index guild_posts_guild_id_idx on public.guild_posts (guild_id);
create index guild_posts_author_id_idx on public.guild_posts (author_id);

create trigger guild_posts_updated_at
  before update on public.guild_posts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- guild_events — événements organisés par une guilde
-- ------------------------------------------------------------
-- NB : événement propre à la guilde (date/lieu en clair), distinct des
-- events plateforme (0005) ; aucune FK vers events dans types.ts.
-- ============================================================
create table public.guild_events (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  cover_url text,
  location_type text not null default 'physical',  -- physical / online (valeurs non figées)
  location_address text,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guild_events is
  'Événements organisés par une guilde. Lecture publique ; écriture master/officers (is_guild_admin) + admin.';

create index guild_events_guild_id_idx on public.guild_events (guild_id);
create index guild_events_created_by_idx on public.guild_events (created_by);
create index guild_events_start_time_idx on public.guild_events (start_time);

create trigger guild_events_updated_at
  before update on public.guild_events
  for each row execute function public.handle_updated_at();

-- ============================================================
-- labs_ideas — idées soumises par la communauté (vote)
-- ============================================================
create table public.labs_ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  cover_url text not null,
  category public.labs_category not null default 'other',
  status public.labs_status not null default 'draft',
  target_votes int not null default 0,
  votes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.labs_ideas is
  'Idée communautaire soumise au vote. Lecture publique ; écriture auteur + admin.';

create index labs_ideas_author_id_idx on public.labs_ideas (author_id);
create index labs_ideas_status_idx on public.labs_ideas (status);
create index labs_ideas_category_idx on public.labs_ideas (category);

create trigger labs_ideas_updated_at
  before update on public.labs_ideas
  for each row execute function public.handle_updated_at();

-- ============================================================
-- labs_votes — votes sur les idées (1 vote / idée / utilisateur)
-- ============================================================
create table public.labs_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.labs_ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)  -- un seul vote par idée et par utilisateur
);

comment on table public.labs_votes is
  'Vote d''un utilisateur sur une idée Labs (unicité idée+user). Lecture publique ; vote/retrait par l''utilisateur.';

create index labs_votes_idea_id_idx on public.labs_votes (idea_id);
create index labs_votes_user_id_idx on public.labs_votes (user_id);

-- Maintien du compteur labs_ideas.votes_count à partir des votes.
create or replace function public.update_labs_votes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.labs_ideas
  set votes_count = (
    select count(*) from public.labs_votes
    where idea_id = coalesce(new.idea_id, old.idea_id)
  )
  where id = coalesce(new.idea_id, old.idea_id);
  return coalesce(new, old);
end;
$$;

create trigger labs_votes_count
  after insert or delete on public.labs_votes
  for each row execute function public.update_labs_votes_count();

-- ============================================================
-- Helper : admin de guilde (master ou officer) — SECURITY DEFINER
-- ------------------------------------------------------------
-- Stable + search_path figé pour éviter la récursion RLS sur guild_members.
-- ============================================================
create or replace function public.is_guild_admin(_guild_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.guild_members
    where guild_id = _guild_id
      and user_id = _user_id
      and role in ('master', 'officer')
  );
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.guild_categories enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_invitations enable row level security;
alter table public.guild_posts enable row level security;
alter table public.guild_events enable row level security;
alter table public.labs_ideas enable row level security;
alter table public.labs_votes enable row level security;

-- ── guild_categories : lecture publique ; écriture admin ──────
create policy "guild_categories_select_all"
  on public.guild_categories for select to authenticated using (true);
create policy "guild_categories_admin_write"
  on public.guild_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── guilds : lecture publique ; création par tout membre ; écriture master/officers ──
create policy "guilds_select_all"
  on public.guilds for select to authenticated using (true);
create policy "guilds_insert_creator"
  on public.guilds for insert to authenticated
  with check (auth.uid() = created_by);
create policy "guilds_update_admin"
  on public.guilds for update to authenticated
  using (public.is_guild_admin(id, auth.uid()) or public.is_admin())
  with check (public.is_guild_admin(id, auth.uid()) or public.is_admin());
create policy "guilds_delete_admin"
  on public.guilds for delete to authenticated
  using (public.is_guild_admin(id, auth.uid()) or public.is_admin());

-- ── guild_members : lecture publique ; le membre gère son appartenance, ──
--    master/officers gèrent les membres de leur guilde.
create policy "guild_members_select_all"
  on public.guild_members for select to authenticated using (true);
create policy "guild_members_insert"
  on public.guild_members for insert to authenticated
  with check (
    auth.uid() = user_id
    or public.is_guild_admin(guild_id, auth.uid())
    or public.is_admin()
  );
create policy "guild_members_update"
  on public.guild_members for update to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin())
  with check (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());
create policy "guild_members_delete"
  on public.guild_members for delete to authenticated
  using (
    auth.uid() = user_id
    or public.is_guild_admin(guild_id, auth.uid())
    or public.is_admin()
  );

-- ── guild_invitations : destinataire + émetteur (master/officers) + admin ──
create policy "guild_invitations_select"
  on public.guild_invitations for select to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = invited_by
    or public.is_guild_admin(guild_id, auth.uid())
    or public.is_admin()
  );
create policy "guild_invitations_insert"
  on public.guild_invitations for insert to authenticated
  with check (
    auth.uid() = invited_by
    and public.is_guild_admin(guild_id, auth.uid())
  );
-- Le destinataire répond (accept/decline) ; les officers peuvent annuler.
create policy "guild_invitations_update"
  on public.guild_invitations for update to authenticated
  using (
    auth.uid() = user_id
    or public.is_guild_admin(guild_id, auth.uid())
    or public.is_admin()
  )
  with check (
    auth.uid() = user_id
    or public.is_guild_admin(guild_id, auth.uid())
    or public.is_admin()
  );
create policy "guild_invitations_delete"
  on public.guild_invitations for delete to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());

-- ── guild_posts : lecture publique ; écriture master/officers + admin ──
create policy "guild_posts_select_all"
  on public.guild_posts for select to authenticated using (true);
create policy "guild_posts_insert_admin"
  on public.guild_posts for insert to authenticated
  with check (
    auth.uid() = author_id
    and (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin())
  );
create policy "guild_posts_update_admin"
  on public.guild_posts for update to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin())
  with check (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());
create policy "guild_posts_delete_admin"
  on public.guild_posts for delete to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());

-- ── guild_events : lecture publique ; écriture master/officers + admin ──
create policy "guild_events_select_all"
  on public.guild_events for select to authenticated using (true);
create policy "guild_events_insert_admin"
  on public.guild_events for insert to authenticated
  with check (
    auth.uid() = created_by
    and (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin())
  );
create policy "guild_events_update_admin"
  on public.guild_events for update to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin())
  with check (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());
create policy "guild_events_delete_admin"
  on public.guild_events for delete to authenticated
  using (public.is_guild_admin(guild_id, auth.uid()) or public.is_admin());

-- ── labs_ideas : lecture publique ; écriture auteur + admin ──
create policy "labs_ideas_select_all"
  on public.labs_ideas for select to authenticated using (true);
create policy "labs_ideas_insert_author"
  on public.labs_ideas for insert to authenticated
  with check (auth.uid() = author_id);
create policy "labs_ideas_update"
  on public.labs_ideas for update to authenticated
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());
create policy "labs_ideas_delete"
  on public.labs_ideas for delete to authenticated
  using (auth.uid() = author_id or public.is_admin());

-- ── labs_votes : lecture publique ; vote authentifié (1/idée/user) ──
create policy "labs_votes_select_all"
  on public.labs_votes for select to authenticated using (true);
create policy "labs_votes_insert_self"
  on public.labs_votes for insert to authenticated
  with check (auth.uid() = user_id);
create policy "labs_votes_delete_self"
  on public.labs_votes for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());
