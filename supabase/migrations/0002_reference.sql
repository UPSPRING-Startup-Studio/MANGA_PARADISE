-- ============================================================
-- 0002 — Référentiels : univers, personnages, œuvres & bibliothèque
-- ------------------------------------------------------------
-- Sources : legacy/src/integrations/supabase/types.ts
--   (ref_universes, ref_characters, official_mangas, official_animes,
--    mangas, otaku_library)
-- Dépendances : 0001 (profiles).
-- Conventions : cf. docs/data-model.md (lecture publique des référentiels,
--   écriture admin ; otaku_library = self + admin).
-- Note : les référentiels (ref_*, official_*, mangas) n'ont qu'un created_at
--   côté legacy pour ref_* ; official_*/mangas ont created_at + updated_at.
-- ============================================================

-- ============================================================
-- ref_universes — univers/franchises (référentiel global)
-- ============================================================
create table public.ref_universes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text, -- nom normalisé (recherche/dédoublonnage)
  created_at timestamptz not null default now()
);

comment on table public.ref_universes is
  'Référentiel des univers/franchises (One Piece, Naruto…). Lecture publique, écriture admin.';

create index ref_universes_name_normalized_idx on public.ref_universes (name_normalized);

-- ============================================================
-- ref_characters — personnages rattachés à un univers
-- ============================================================
create table public.ref_characters (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.ref_universes (id) on delete cascade,
  name text not null,
  name_normalized text,
  official_image_url text,
  created_at timestamptz not null default now()
);

comment on table public.ref_characters is
  'Référentiel des personnages (FK univers). Lecture publique, écriture admin.';

create index ref_characters_universe_id_idx on public.ref_characters (universe_id);
create index ref_characters_name_normalized_idx on public.ref_characters (name_normalized);

-- ============================================================
-- official_mangas — catalogue manga officiel
-- ============================================================
create table public.official_mangas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.official_mangas is
  'Catalogue manga officiel (curated). Lecture publique, écriture admin.';

create trigger official_mangas_updated_at
  before update on public.official_mangas
  for each row execute function public.handle_updated_at();

-- ============================================================
-- official_animes — catalogue anime officiel
-- ============================================================
create table public.official_animes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  studio text,
  cover_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.official_animes is
  'Catalogue anime officiel (curated). Lecture publique, écriture admin.';

create trigger official_animes_updated_at
  before update on public.official_animes
  for each row execute function public.handle_updated_at();

-- ============================================================
-- mangas — œuvres ajoutées (référentiel ouvert, traçabilité created_by)
-- ============================================================
create table public.mangas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover_url text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mangas is
  'Référentiel manga ouvert (created_by trace l''ajout). Lecture publique, écriture admin.';

create index mangas_created_by_idx on public.mangas (created_by);

create trigger mangas_updated_at
  before update on public.mangas
  for each row execute function public.handle_updated_at();

-- ============================================================
-- otaku_library — bibliothèque personnelle (collection utilisateur)
-- ============================================================
create table public.otaku_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  type text not null, -- type d'œuvre (manga, anime, …) — TEXT libre côté legacy
  cover_url text not null,
  created_at timestamptz not null default now()
);

comment on table public.otaku_library is
  'Bibliothèque personnelle d''un utilisateur (œuvres suivies/possédées). Self + admin.';

create index otaku_library_user_id_idx on public.otaku_library (user_id);

-- ============================================================
-- profiles — FK best/worst_character_id -> ref_characters
-- (colonnes créées en 0001 comme uuid, FK différée jusqu'ici)
-- ============================================================
alter table public.profiles
  add constraint profiles_best_character_id_fkey
    foreign key (best_character_id) references public.ref_characters (id) on delete set null,
  add constraint profiles_worst_character_id_fkey
    foreign key (worst_character_id) references public.ref_characters (id) on delete set null;

create index profiles_best_character_id_idx on public.profiles (best_character_id);
create index profiles_worst_character_id_idx on public.profiles (worst_character_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.ref_universes enable row level security;
alter table public.ref_characters enable row level security;
alter table public.official_mangas enable row level security;
alter table public.official_animes enable row level security;
alter table public.mangas enable row level security;
alter table public.otaku_library enable row level security;

-- Référentiels : lecture publique (authenticated), écriture admin uniquement.
create policy "ref_universes_select_all"
  on public.ref_universes for select to authenticated using (true);
create policy "ref_universes_admin_write"
  on public.ref_universes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "ref_characters_select_all"
  on public.ref_characters for select to authenticated using (true);
create policy "ref_characters_admin_write"
  on public.ref_characters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "official_mangas_select_all"
  on public.official_mangas for select to authenticated using (true);
create policy "official_mangas_admin_write"
  on public.official_mangas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "official_animes_select_all"
  on public.official_animes for select to authenticated using (true);
create policy "official_animes_admin_write"
  on public.official_animes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "mangas_select_all"
  on public.mangas for select to authenticated using (true);
create policy "mangas_admin_write"
  on public.mangas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- otaku_library : propriétaire (lecture/écriture) + admin.
create policy "otaku_library_self_or_admin"
  on public.otaku_library for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
