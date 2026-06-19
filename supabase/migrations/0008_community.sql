-- ============================================================
-- 0008 — Communauté : géoloc (radar), nakamas, fil social, chat,
--        notifications, favoris polymorphes
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts
--       (friendships, posts, post_comments, post_likes, notifications,
--        chat_rooms, chat_messages, chat_participants)
--   - legacy migrations (PostGIS, modules absents de types.ts, RLS) :
--       20260216_enable_postgis_and_location, 20260216_create_get_nearby_profiles_function,
--       20260216_create_update_location_function, 20260214_create_user_favorites,
--       20260401_nakamas_friendships_notifications, 20260401_profiles_rls_public_select.
-- Dépendances : 0001 (profiles), 0005 (events) — numéro inférieur, FK OK.
-- Cleanups (cf. docs/data-model.md) :
--   - user_favorites recréée en table POLYMORPHE (favoritable_type/_id) :
--     couvre les favoris d'activités/events (« bookmarks ») ET de cosplans
--     (legacy : table limitée à event_schedule). Pas de reprise de données.
--   - get_nearby_profiles réécrite sur les colonnes propres de profiles
--     (legacy référençait cosplayer_name/title/badges, absents du schéma propre).
--   - update_user_location -> update_my_location (agit sur auth.uid()).
--   - enums message_type / chat_room_type / friendship_status normalisés en enums PG.
-- ============================================================

-- === Extension géospatiale (radar communautaire) ===
create extension if not exists postgis;

-- === Enums ===
create type public.friendship_status as enum ('pending', 'accepted', 'rejected');
create type public.message_type as enum ('text', 'image', 'location', 'system');
create type public.chat_room_type as enum ('event', 'guild', 'dm');

-- ============================================================
-- profiles — colonnes de géolocalisation (radar « otakus près de moi »)
-- ============================================================
alter table public.profiles
  add column if not exists location_geo geography(Point, 4326),
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_city text,
  add column if not exists location_country text,
  add column if not exists is_location_public boolean not null default false,
  add column if not exists location_updated_at timestamptz;

comment on column public.profiles.location_geo is
  'Point géographique (lat/lng) pour le radar communautaire (offset flou pour la confidentialité).';
comment on column public.profiles.is_location_public is
  'Le membre accepte d''apparaître sur la carte communautaire.';

-- Index géospatial + filtre des profils publics géolocalisés.
create index if not exists profiles_location_geo_idx
  on public.profiles using gist (location_geo);
create index if not exists profiles_location_public_idx
  on public.profiles (is_location_public)
  where is_location_public = true;

-- ============================================================
-- friendships — nakamas (demandes d'ami bidirectionnelles)
-- ============================================================
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  meeting_context text,
  meeting_event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

comment on table public.friendships is
  'Relations nakamas (demandes d''ami). Visible/éditable par les deux parties.';

-- Unicité bidirectionnelle : empêche les doublons A→B et B→A.
create unique index friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);
create index friendships_status_idx on public.friendships (status);

create trigger friendships_updated_at
  before update on public.friendships
  for each row execute function public.handle_updated_at();

-- ============================================================
-- posts — fil social (publications)
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'general',
  content_type text not null default 'text',
  post_type text,
  title text,
  content text,
  media_url text,
  tags text[],
  is_pinned boolean not null default false,
  likes_count int not null default 0,
  comments_count int not null default 0,
  related_cosplay_id uuid references public.cosplay_plans (id) on delete set null,
  related_event_id uuid references public.events (id) on delete set null,
  tagged_photographer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.posts is
  'Publications du fil social. Lecture publique (authentifiée) ; écriture auteur + admin.';

create index posts_author_id_idx on public.posts (author_id);
create index posts_category_idx on public.posts (category);
create index posts_related_cosplay_id_idx on public.posts (related_cosplay_id)
  where related_cosplay_id is not null;
create index posts_related_event_id_idx on public.posts (related_event_id)
  where related_event_id is not null;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- post_comments — commentaires (threadés via parent_id)
-- ============================================================
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.post_comments (id) on delete cascade,
  content text not null,
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.post_comments is
  'Commentaires d''une publication (threadés). Lecture publique ; écriture auteur + admin.';

create index post_comments_post_id_idx on public.post_comments (post_id);
create index post_comments_author_id_idx on public.post_comments (author_id);
create index post_comments_parent_id_idx on public.post_comments (parent_id)
  where parent_id is not null;

create trigger post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.handle_updated_at();

-- ============================================================
-- post_likes — likes d'une publication
-- ============================================================
create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

comment on table public.post_likes is
  'Likes d''une publication. Lecture publique ; écriture self.';

create index post_likes_post_id_idx on public.post_likes (post_id);
create index post_likes_user_id_idx on public.post_likes (user_id);

-- ============================================================
-- notifications — notifications utilisateur (DenDenMushi)
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  type text not null,          -- FRIEND_REQUEST | PHOTO_TAG | LIKE | COMMENT | EVENT_REMINDER | SYSTEM…
  content text not null,
  related_link text,           -- ex. friendship_id / tag_id (UUID en texte)
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'Notifications destinées à un utilisateur. Lecture/écriture destinataire (insert aussi via fonctions SECURITY DEFINER).';

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_is_read_idx on public.notifications (is_read);
create index notifications_type_idx on public.notifications (type);

-- ============================================================
-- user_favorites — favoris polymorphes (events/bookmarks + cosplans)
-- ============================================================
create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  favoritable_type text not null check (favoritable_type in ('event', 'activity', 'cosplay_plan', 'post')),
  favoritable_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, favoritable_type, favoritable_id)
);

comment on table public.user_favorites is
  'Favoris polymorphes (bookmarks d''events/activités, cosplans…). FK logique via favoritable_type/_id. Self uniquement.';

create index user_favorites_user_id_idx on public.user_favorites (user_id);
create index user_favorites_target_idx on public.user_favorites (favoritable_type, favoritable_id);

-- ============================================================
-- chat_rooms — salons de discussion (event / guild / dm)
-- ============================================================
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type public.chat_room_type not null,
  name text not null,
  related_id uuid,             -- event_id / guild_id selon le type (FK logique)
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chat_rooms is
  'Salons de discussion (event/guild/dm). Lecture/écriture réservées aux participants.';

create index chat_rooms_type_idx on public.chat_rooms (type);
create index chat_rooms_related_id_idx on public.chat_rooms (related_id)
  where related_id is not null;

create trigger chat_rooms_updated_at
  before update on public.chat_rooms
  for each row execute function public.handle_updated_at();

-- ============================================================
-- chat_participants — membres d'un salon
-- ============================================================
create table public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (room_id, user_id)
);

comment on table public.chat_participants is
  'Participants d''un salon de discussion.';

create index chat_participants_room_id_idx on public.chat_participants (room_id);
create index chat_participants_user_id_idx on public.chat_participants (user_id);

-- ============================================================
-- chat_messages — messages d'un salon
-- ============================================================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  message_type public.message_type not null default 'text',
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is
  'Messages d''un salon. Lecture/écriture réservées aux participants du salon.';

create index chat_messages_room_id_idx on public.chat_messages (room_id);
create index chat_messages_sender_id_idx on public.chat_messages (sender_id);

-- ============================================================
-- Helpers (SECURITY DEFINER set search_path = public, anti-récursion RLS)
-- ============================================================

-- Deux profils sont-ils amis (relation acceptée) ?
create or replace function public.are_friends(_user_id1 uuid, _user_id2 uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and (
        (requester_id = _user_id1 and addressee_id = _user_id2)
        or (requester_id = _user_id2 and addressee_id = _user_id1)
      )
  );
$$;

-- L'utilisateur courant participe-t-il à un salon ?
create or replace function public.is_chat_participant(_room_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_participants
    where room_id = _room_id and user_id = coalesce(_user_id, auth.uid())
  );
$$;

-- Met à jour la position de l'utilisateur courant (radar communautaire).
create or replace function public.update_my_location(
  _longitude double precision,
  _latitude double precision,
  _city text default null,
  _country text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set location_geo = ST_SetSRID(ST_MakePoint(_longitude, _latitude), 4326)::geography,
      location_lat = _latitude,
      location_lng = _longitude,
      location_city = coalesce(_city, location_city),
      location_country = coalesce(_country, location_country),
      is_location_public = true,
      location_updated_at = now()
  where id = auth.uid();
end;
$$;

-- Profils proches d'un point (radar). Réécrite sur les colonnes propres.
-- TODO: valider les filtres métier (classe otaku, mode cosplayeur) une fois
--       les colonnes correspondantes stabilisées dans profiles.
create or replace function public.get_nearby_profiles(
  _lat double precision,
  _lng double precision,
  _radius_meters int default 50000
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  otaku_class text,
  is_cosplayer_mode_active boolean,
  city text,
  distance_meters double precision,
  latitude double precision,
  longitude double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.otaku_class,
    p.is_cosplayer_mode_active,
    coalesce(p.location_city, p.city),
    ST_Distance(
      p.location_geo,
      ST_SetSRID(ST_MakePoint(_lng, _lat), 4326)::geography
    ) as distance_meters,
    ST_Y(p.location_geo::geometry) as latitude,
    ST_X(p.location_geo::geometry) as longitude
  from public.profiles p
  where p.is_location_public = true
    and p.location_geo is not null
    and ST_DWithin(
      p.location_geo,
      ST_SetSRID(ST_MakePoint(_lng, _lat), 4326)::geography,
      _radius_meters
    )
  order by distance_meters asc
  limit 500;
$$;

-- ============================================================
-- Trigger : notifier le destinataire d'une demande d'ami
-- ============================================================
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select coalesce(display_name, username, 'Quelqu''un')
  into sender_name
  from public.profiles
  where id = new.requester_id;

  insert into public.notifications (user_id, sender_id, type, content, related_link, is_read)
  values (
    new.addressee_id,
    new.requester_id,
    'FRIEND_REQUEST',
    sender_name || ' veut rejoindre ton équipage !',
    new.id::text,
    false
  );

  return new;
end;
$$;

create trigger trg_notify_friend_request
  after insert on public.friendships
  for each row execute function public.notify_friend_request();

-- ============================================================
-- RLS
-- ============================================================
alter table public.friendships enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.notifications enable row level security;
alter table public.user_favorites enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

-- --- friendships : les deux parties ---
create policy "friendships_select_parties"
  on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id or public.is_admin());
create policy "friendships_insert_requester"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id);
create policy "friendships_update_parties"
  on public.friendships for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_delete_parties"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id or public.is_admin());

-- --- posts : lecture publique (authentifiée) ; écriture auteur + admin ---
create policy "posts_select_all"
  on public.posts for select to authenticated using (true);
create policy "posts_insert_author"
  on public.posts for insert to authenticated
  with check (auth.uid() = author_id);
create policy "posts_update_author"
  on public.posts for update to authenticated
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());
create policy "posts_delete_author"
  on public.posts for delete to authenticated
  using (auth.uid() = author_id or public.is_admin());

-- --- post_comments : lecture publique ; écriture auteur + admin ---
create policy "post_comments_select_all"
  on public.post_comments for select to authenticated using (true);
create policy "post_comments_insert_author"
  on public.post_comments for insert to authenticated
  with check (auth.uid() = author_id);
create policy "post_comments_update_author"
  on public.post_comments for update to authenticated
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());
create policy "post_comments_delete_author"
  on public.post_comments for delete to authenticated
  using (auth.uid() = author_id or public.is_admin());

-- --- post_likes : lecture publique ; écriture self ---
create policy "post_likes_select_all"
  on public.post_likes for select to authenticated using (true);
create policy "post_likes_insert_self"
  on public.post_likes for insert to authenticated
  with check (auth.uid() = user_id);
create policy "post_likes_delete_self"
  on public.post_likes for delete to authenticated
  using (auth.uid() = user_id);

-- --- notifications : destinataire (insert self ou service_role via SECURITY DEFINER) ---
create policy "notifications_select_self"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "notifications_insert_self_or_service"
  on public.notifications for insert to authenticated
  with check (auth.uid() = user_id or auth.role() = 'service_role');
create policy "notifications_update_self"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_self"
  on public.notifications for delete to authenticated
  using (auth.uid() = user_id);

-- --- user_favorites : self uniquement ---
create policy "user_favorites_select_self"
  on public.user_favorites for select to authenticated
  using (auth.uid() = user_id);
create policy "user_favorites_insert_self"
  on public.user_favorites for insert to authenticated
  with check (auth.uid() = user_id);
create policy "user_favorites_delete_self"
  on public.user_favorites for delete to authenticated
  using (auth.uid() = user_id);

-- --- chat_rooms : participants (création authentifiée, admin total) ---
create policy "chat_rooms_select_participant"
  on public.chat_rooms for select to authenticated
  using (public.is_chat_participant(id) or public.is_admin());
create policy "chat_rooms_insert_authenticated"
  on public.chat_rooms for insert to authenticated
  with check (true);
create policy "chat_rooms_update_participant"
  on public.chat_rooms for update to authenticated
  using (public.is_chat_participant(id) or public.is_admin())
  with check (public.is_chat_participant(id) or public.is_admin());
create policy "chat_rooms_admin_delete"
  on public.chat_rooms for delete to authenticated
  using (public.is_admin());

-- --- chat_participants : voir les membres de ses salons ; se gérer soi-même ---
create policy "chat_participants_select_member"
  on public.chat_participants for select to authenticated
  using (public.is_chat_participant(room_id) or public.is_admin());
create policy "chat_participants_insert_self"
  on public.chat_participants for insert to authenticated
  with check (auth.uid() = user_id);
create policy "chat_participants_update_self"
  on public.chat_participants for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chat_participants_delete_self"
  on public.chat_participants for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- --- chat_messages : participants du salon ---
create policy "chat_messages_select_participant"
  on public.chat_messages for select to authenticated
  using (public.is_chat_participant(room_id) or public.is_admin());
create policy "chat_messages_insert_participant"
  on public.chat_messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_chat_participant(room_id));
create policy "chat_messages_update_sender"
  on public.chat_messages for update to authenticated
  using (auth.uid() = sender_id) with check (auth.uid() = sender_id);
create policy "chat_messages_delete_sender"
  on public.chat_messages for delete to authenticated
  using (auth.uid() = sender_id or public.is_admin());
