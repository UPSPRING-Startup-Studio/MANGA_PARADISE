-- ============================================================
-- 0006 — Cosplay : projets (cosplans), tâches, dossiers, photos,
--        tags de photos, book photo (showcase), trophées
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts
--       (cosplay_plans, cosplay_plan_tasks, cosplay_photos,
--        cosplay_photo_tags, cosplay_achievements)
--   - legacy migrations (tables absentes de types.ts + RLS/enrichissements) :
--       20260226_create_cosplay_folders, 20260226_create_showcase_photos,
--       20260224_add_auto_progress_to_cosplans, 20260224_add_target_event_to_cosplans,
--       20260225_add_social_features_to_cosplans, 20260226_add_kanban_fields_to_cosplan_tasks,
--       20260226_complete_wardrobe_migration, 20260410_lot1_cosplay_data_model_unification,
--       20260401_cosplay_photo_enrichment, 20260402_enriched_photo_tags,
--       20260402_photo_activity_link, 20260403_add_shot_date_to_cosplay_photos.
-- Dépendances : 0001 (profiles), 0005 (events, event_schedule) — numéro inférieur, FK OK.
-- Cleanups (cf. docs/data-model.md) :
--   - cosplay_vestiaire NON recréée (fusionnée dans cosplay_plans). Les colonnes
--     issues de la fusion (user_image_url, official_image_url, is_in_wardrobe…) sont
--     conservées ; source_vestiaire_id (tracking de migration) abandonné (pas de reprise).
--   - status normalisé en enum PG cosplan_status (legacy : enum puis TEXT+CHECK).
--   - cosplan_reactions conservée (réactions sociales sur les cosplans).
--   - Tables de line-up (cosplay_lineups, event_lineups, event_cosplay_lineups,
--     cosplay_incarnations) appartiennent à 0007 — NON recréées ici.
-- ============================================================

-- === Enums ===
-- Statut d'avancement d'un projet cosplay (« cosplan »).
create type public.cosplan_status as enum (
  'wishlist', 'started', 'paused', 'finished'
);

-- ============================================================
-- cosplay_folders — dossiers hiérarchiques d'organisation des cosplans
-- ============================================================
create table public.cosplay_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  parent_id uuid references public.cosplay_folders (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cosplay_folders is
  'Dossiers hiérarchiques d''organisation des projets cosplay. Propriétaire + admin.';

create index cosplay_folders_user_id_idx on public.cosplay_folders (user_id);
create index cosplay_folders_parent_id_idx on public.cosplay_folders (parent_id);

create trigger cosplay_folders_updated_at
  before update on public.cosplay_folders
  for each row execute function public.handle_updated_at();

-- ============================================================
-- cosplay_plans — projet cosplay (source de vérité unique, ex-« vestiaire »)
-- ============================================================
create table public.cosplay_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- Personnage / univers
  character_name text not null,
  universe text not null,
  image_url text,            -- visuel principal du projet
  user_image_url text,       -- photo du cosplayeur (issue de l'ancien vestiaire)
  official_image_url text,   -- image officielle du personnage (issue du vestiaire)

  -- Avancement
  status public.cosplan_status not null default 'wishlist',
  progress_level int not null default 0,
  auto_progress boolean not null default false, -- progress_level dérivé des tâches
  priority int not null default 0,
  target_year int not null default extract(year from now())::int,
  deadline date,
  completed_at timestamptz,

  -- Atelier / vestiaire
  budget numeric(10, 2),
  notes text,
  craft_type text check (craft_type is null or craft_type in ('handmade', 'bought', 'mixed')),
  is_in_wardrobe boolean not null default false,

  -- Rattachements
  folder_id uuid references public.cosplay_folders (id) on delete set null,
  target_event_id uuid references public.events (id) on delete set null,
  group_id uuid, -- party/groupe collaboratif (FK logique vers 0007, non contrainte)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cosplay_plans is
  'Projet cosplay (« cosplan »). Source de vérité unique (fusion de l''ancien cosplay_vestiaire). Propriétaire + admin.';
comment on column public.cosplay_plans.auto_progress is
  'Si vrai, progress_level est recalculé automatiquement à partir des tâches terminées.';
comment on column public.cosplay_plans.group_id is
  'Référence logique vers une party/groupe (0007). Non contrainte pour éviter une dépendance circulaire.';

create index cosplay_plans_user_id_idx on public.cosplay_plans (user_id);
create index cosplay_plans_status_idx on public.cosplay_plans (status);
create index cosplay_plans_folder_id_idx on public.cosplay_plans (folder_id)
  where folder_id is not null;
create index cosplay_plans_target_event_id_idx on public.cosplay_plans (target_event_id)
  where target_event_id is not null;
create index cosplay_plans_group_id_idx on public.cosplay_plans (group_id)
  where group_id is not null;

create trigger cosplay_plans_updated_at
  before update on public.cosplay_plans
  for each row execute function public.handle_updated_at();

-- ============================================================
-- cosplay_plan_tasks — tâches kanban d'un cosplan
-- ============================================================
create table public.cosplay_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.cosplay_plans (id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  category text not null default 'craft' check (category in ('craft', 'achat', 'dressing')),
  price numeric(10, 2),
  created_at timestamptz not null default now()
);

comment on table public.cosplay_plan_tasks is
  'Tâches kanban d''un projet cosplay (couture/achat/dressing). Propriétaire du plan + admin.';

create index cosplay_plan_tasks_plan_id_idx on public.cosplay_plan_tasks (plan_id);
create index cosplay_plan_tasks_plan_status_idx on public.cosplay_plan_tasks (plan_id, status);

-- ============================================================
-- cosplan_reactions — réactions sociales sur un cosplan
-- ============================================================
create table public.cosplan_reactions (
  id uuid primary key default gen_random_uuid(),
  cosplay_plan_id uuid not null references public.cosplay_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('hype', 'love', 'favorite', 'amazing')),
  created_at timestamptz not null default now(),
  unique (cosplay_plan_id, user_id)
);

comment on table public.cosplan_reactions is
  'Réactions sociales (hype, love, favorite, amazing) sur un projet cosplay. Lecture publique, écriture self.';

create index cosplan_reactions_cosplay_plan_id_idx on public.cosplan_reactions (cosplay_plan_id);
create index cosplan_reactions_user_id_idx on public.cosplan_reactions (user_id);

-- ============================================================
-- cosplay_photos — photos enrichies d'un cosplan (galerie/book)
-- ============================================================
create table public.cosplay_photos (
  id uuid primary key default gen_random_uuid(),
  cosplay_id uuid not null references public.cosplay_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text not null,
  photo_type text not null default 'shooting'
    check (photo_type in ('toi', 'original', 'wip', 'shooting', 'detail')),

  -- Rattachement événement / activité
  event_id uuid references public.events (id) on delete set null,
  activity_id uuid references public.event_schedule (id) on delete set null,
  event_name_manual text,
  event_date_manual date,
  event_location_manual text,

  -- Photo de groupe (showcase social)
  is_group_photo boolean not null default false,
  is_showcase boolean not null default false, -- mise en avant dans le book public

  -- Métadonnées
  caption text check (caption is null or char_length(caption) <= 200),
  shot_date date, -- jour de prise de vue normalisé
  exif_date timestamptz,
  exif_gps_lat double precision,
  exif_gps_lng double precision,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cosplay_photos is
  'Photos enrichies d''un projet cosplay. Lecture authentifiée ; écriture propriétaire + admin.';
comment on column public.cosplay_photos.shot_date is
  'Jour de prise de vue normalisé. Priorité : saisie manuelle > exif_date > date événement.';
comment on column public.cosplay_photos.is_showcase is
  'Photo mise en avant dans le book public du cosplayeur.';

create index cosplay_photos_cosplay_id_idx on public.cosplay_photos (cosplay_id);
create index cosplay_photos_user_id_idx on public.cosplay_photos (user_id);
create index cosplay_photos_event_id_idx on public.cosplay_photos (event_id)
  where event_id is not null;
create index cosplay_photos_activity_id_idx on public.cosplay_photos (activity_id)
  where activity_id is not null;
create index cosplay_photos_shot_date_idx on public.cosplay_photos (shot_date)
  where shot_date is not null;

create trigger cosplay_photos_updated_at
  before update on public.cosplay_photos
  for each row execute function public.handle_updated_at();

-- ============================================================
-- cosplay_photo_tags — tags de personnes sur une photo (pins x/y)
-- ============================================================
create table public.cosplay_photo_tags (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.cosplay_photos (id) on delete cascade,
  tagger_user_id uuid not null references public.profiles (id) on delete cascade,
  tagged_user_id uuid references public.profiles (id) on delete set null,
  tagged_name text,
  tagged_character text,
  tagged_social_link text,
  linked_cosplay_id uuid references public.cosplay_plans (id) on delete set null,

  -- Position du pin (coordonnées normalisées 0..1)
  pin_x double precision not null check (pin_x >= 0 and pin_x <= 1),
  pin_y double precision not null check (pin_y >= 0 and pin_y <= 1),

  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  notified_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.cosplay_photo_tags is
  'Tags de cosplayeurs sur une photo (pin x/y). Tags acceptés visibles ; pending/declined visibles du tagueur et du tagué.';

create index cosplay_photo_tags_photo_id_idx on public.cosplay_photo_tags (photo_id);
create index cosplay_photo_tags_tagger_user_id_idx on public.cosplay_photo_tags (tagger_user_id);
create index cosplay_photo_tags_tagged_user_status_idx
  on public.cosplay_photo_tags (tagged_user_id, status)
  where tagged_user_id is not null;
create index cosplay_photo_tags_linked_cosplay_id_idx
  on public.cosplay_photo_tags (linked_cosplay_id)
  where linked_cosplay_id is not null;

-- ============================================================
-- cosplay_showcase_photos — book photo d'un cosplan terminé
-- ============================================================
create table public.cosplay_showcase_photos (
  id uuid primary key default gen_random_uuid(),
  cosplay_plan_id uuid not null references public.cosplay_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

comment on table public.cosplay_showcase_photos is
  'Book photo (galerie) d''un projet cosplay terminé. Lecture publique ; écriture propriétaire + admin.';

create index cosplay_showcase_photos_cosplay_plan_id_idx
  on public.cosplay_showcase_photos (cosplay_plan_id);
create index cosplay_showcase_photos_user_id_idx
  on public.cosplay_showcase_photos (user_id);

-- ============================================================
-- cosplay_achievements — trophées de concours (modérés par l'admin)
-- ============================================================
create table public.cosplay_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  contest_name text not null,
  award_title text not null,
  event_date date not null,
  proof_image_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cosplay_achievements is
  'Trophées de concours cosplay. Lecture publique des approuvés ; écriture self ; modération admin.';

create index cosplay_achievements_user_id_idx on public.cosplay_achievements (user_id);
create index cosplay_achievements_status_idx on public.cosplay_achievements (status);

create trigger cosplay_achievements_updated_at
  before update on public.cosplay_achievements
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Helper : propriétaire d'un cosplan (SECURITY DEFINER, évite la récursion RLS)
-- ============================================================
create or replace function public.owns_cosplan(_plan_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cosplay_plans
    where id = _plan_id and user_id = coalesce(_user_id, auth.uid())
  );
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.cosplay_folders enable row level security;
alter table public.cosplay_plans enable row level security;
alter table public.cosplay_plan_tasks enable row level security;
alter table public.cosplan_reactions enable row level security;
alter table public.cosplay_photos enable row level security;
alter table public.cosplay_photo_tags enable row level security;
alter table public.cosplay_showcase_photos enable row level security;
alter table public.cosplay_achievements enable row level security;

-- --- cosplay_folders : propriétaire + admin ---
create policy "cosplay_folders_select_own"
  on public.cosplay_folders for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "cosplay_folders_modify_own"
  on public.cosplay_folders for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- cosplay_plans : propriétaire + admin ---
-- TODO (data-model.md) : lecture publique des cosplans des amis / showcase.
create policy "cosplay_plans_select_own"
  on public.cosplay_plans for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "cosplay_plans_modify_own"
  on public.cosplay_plans for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- cosplay_plan_tasks : propriétaire du plan + admin ---
create policy "cosplay_plan_tasks_select_own"
  on public.cosplay_plan_tasks for select to authenticated
  using (public.owns_cosplan(plan_id) or public.is_admin());
create policy "cosplay_plan_tasks_modify_own"
  on public.cosplay_plan_tasks for all to authenticated
  using (public.owns_cosplan(plan_id) or public.is_admin())
  with check (public.owns_cosplan(plan_id) or public.is_admin());

-- --- cosplan_reactions : lecture publique (authentifiée) ; écriture self ---
create policy "cosplan_reactions_select_all"
  on public.cosplan_reactions for select to authenticated using (true);
create policy "cosplan_reactions_insert_self"
  on public.cosplan_reactions for insert to authenticated
  with check (auth.uid() = user_id);
create policy "cosplan_reactions_delete_self"
  on public.cosplan_reactions for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- --- cosplay_photos : lecture authentifiée ; écriture propriétaire + admin ---
-- Lecture large (amis/public selon is_showcase géré côté applicatif) ;
-- la base autorise tout authentifié à lire, l'écriture reste au propriétaire.
create policy "cosplay_photos_select_all"
  on public.cosplay_photos for select to authenticated using (true);
create policy "cosplay_photos_modify_own"
  on public.cosplay_photos for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- cosplay_photo_tags : tagué/tagueur + tags acceptés visibles de tous ---
create policy "cosplay_photo_tags_select_accepted"
  on public.cosplay_photo_tags for select to authenticated
  using (status = 'accepted');
create policy "cosplay_photo_tags_select_involved"
  on public.cosplay_photo_tags for select to authenticated
  using (auth.uid() = tagger_user_id or auth.uid() = tagged_user_id or public.is_admin());
create policy "cosplay_photo_tags_insert_tagger"
  on public.cosplay_photo_tags for insert to authenticated
  with check (auth.uid() = tagger_user_id);
-- Seul le tagué modifie le statut (accepter / refuser, choisir le cosplan lié).
create policy "cosplay_photo_tags_update_tagged"
  on public.cosplay_photo_tags for update to authenticated
  using (auth.uid() = tagged_user_id or public.is_admin())
  with check (auth.uid() = tagged_user_id or public.is_admin());
create policy "cosplay_photo_tags_delete_involved"
  on public.cosplay_photo_tags for delete to authenticated
  using (auth.uid() = tagger_user_id or auth.uid() = tagged_user_id or public.is_admin());

-- --- cosplay_showcase_photos : lecture publique ; écriture propriétaire + admin ---
create policy "cosplay_showcase_photos_select_all"
  on public.cosplay_showcase_photos for select to authenticated using (true);
create policy "cosplay_showcase_photos_modify_own"
  on public.cosplay_showcase_photos for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- cosplay_achievements : lecture publique des approuvés + self ; modération admin ---
create policy "cosplay_achievements_select_approved"
  on public.cosplay_achievements for select to authenticated
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "cosplay_achievements_insert_self"
  on public.cosplay_achievements for insert to authenticated
  with check (auth.uid() = user_id);
create policy "cosplay_achievements_update_self_or_admin"
  on public.cosplay_achievements for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "cosplay_achievements_delete_self_or_admin"
  on public.cosplay_achievements for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());
