-- ============================================================
-- 0010 — Gamification & boutique OTK
-- ------------------------------------------------------------
-- Sources :
--   - legacy/src/integrations/supabase/types.ts (badges, user_badges,
--     quests, user_quests, quest_submissions, leagues, user_league_stats,
--     otk_transactions, shop_items, shop_orders) — colonnes & relations
--     + section Functions (complete_quest, admin_process_transaction,
--     process_sponsorship_rewards) pour les signatures.
-- Dépendances : 0001 (profiles + otk_coins/xp/level), 0005 (events) —
--   numéros inférieurs, FK OK.
-- Choix : les champs `status` / `transaction_type` / `rarity` restent en TEXT
--   (absents de la section Enums de types.ts, vocabulaire métier non figé et
--   écrit par des fonctions SECURITY DEFINER — on ne devine pas l'enum).
-- ============================================================

-- ============================================================
-- badges — catalogue de badges (référentiel)
-- ============================================================
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null,
  category text not null,
  rarity text,                 -- ex. common/rare/legendary (non figé)
  xp_reward int default 0,
  otk_reward int default 0,
  created_at timestamptz default now()
);

comment on table public.badges is
  'Catalogue de badges (référentiel). Lecture publique ; écriture admin.';

create index badges_category_idx on public.badges (category);

-- ============================================================
-- user_badges — badges obtenus par un utilisateur
-- ============================================================
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)   -- un badge obtenu une seule fois par user
);

comment on table public.user_badges is
  'Badges obtenus par un utilisateur. Lecture/écriture self + admin.';

create index user_badges_user_id_idx on public.user_badges (user_id);
create index user_badges_badge_id_idx on public.user_badges (badge_id);

-- ============================================================
-- quests — quêtes (catalogue)
-- ============================================================
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  category text,
  quest_type text,
  priority text,
  status text,
  validation_type text,
  class_requirement text,
  target_count int,
  xp_reward int default 0,
  otk_reward int default 0,
  is_active boolean default true,
  deadline timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.quests is
  'Catalogue de quêtes. Lecture publique ; écriture admin.';

create index quests_created_by_idx on public.quests (created_by);
create index quests_is_active_idx on public.quests (is_active);
create index quests_category_idx on public.quests (category);

-- ============================================================
-- user_quests — progression d'un utilisateur sur une quête
-- ============================================================
create table public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  status text default 'in_progress',
  progress int default 0,
  proof_url text,
  completed_at timestamptz,
  validated_at timestamptz,
  validated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.user_quests is
  'Progression d''un utilisateur sur une quête (liée éventuellement à un event). Lecture/écriture self + admin.';

create index user_quests_user_id_idx on public.user_quests (user_id);
create index user_quests_quest_id_idx on public.user_quests (quest_id);
create index user_quests_event_id_idx on public.user_quests (event_id);
create index user_quests_validated_by_idx on public.user_quests (validated_by);

-- ============================================================
-- quest_submissions — preuves soumises pour validation manuelle
-- ============================================================
create table public.quest_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  proof_text text,
  proof_link text,
  status text not null default 'pending',
  feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.quest_submissions is
  'Soumission de preuve d''une quête (validation manuelle). Lecture/écriture self ; revue par admin.';

create index quest_submissions_user_id_idx on public.quest_submissions (user_id);
create index quest_submissions_quest_id_idx on public.quest_submissions (quest_id);
create index quest_submissions_reviewed_by_idx on public.quest_submissions (reviewed_by);
create index quest_submissions_status_idx on public.quest_submissions (status);

create trigger quest_submissions_updated_at
  before update on public.quest_submissions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- leagues — ligues mensuelles (référentiel, classement)
-- ============================================================
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#000000',
  icon text not null default '',
  rank_order int not null default 0,
  min_quests int not null default 0,
  monthly_rent int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.leagues is
  'Ligues mensuelles (référentiel de classement). Lecture publique ; écriture admin.';

create index leagues_rank_order_idx on public.leagues (rank_order);

-- ============================================================
-- user_league_stats — stats mensuelles d'un utilisateur (1 par mois)
-- ============================================================
create table public.user_league_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  current_league_id uuid references public.leagues (id) on delete set null,
  month_year text not null default to_char(now(), 'YYYY-MM'),
  quests_completed_this_month int not null default 0,
  last_updated timestamptz not null default now(),
  unique (user_id, month_year)  -- une ligne par utilisateur et par mois
);

comment on table public.user_league_stats is
  'Statistiques de ligue d''un utilisateur par mois. Lecture/écriture self + admin.';

create index user_league_stats_user_id_idx on public.user_league_stats (user_id);
create index user_league_stats_current_league_id_idx
  on public.user_league_stats (current_league_id);

-- ============================================================
-- otk_transactions — historique de la monnaie OTK
-- ------------------------------------------------------------
-- Aucun INSERT client direct (cf. RLS) : alimenté par les fonctions
-- SECURITY DEFINER (complete_quest, admin_process_transaction,
-- process_sponsorship_rewards…).
-- ============================================================
create table public.otk_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric not null,
  transaction_type text not null,   -- ex. quest_reward/admin/sponsorship/purchase
  description text,
  created_at timestamptz default now()
);

comment on table public.otk_transactions is
  'Historique des mouvements de monnaie OTK. Lecture self + admin ; aucun INSERT client (réservé aux fonctions SECURITY DEFINER).';

create index otk_transactions_user_id_idx on public.otk_transactions (user_id);
create index otk_transactions_type_idx on public.otk_transactions (transaction_type);

-- ============================================================
-- shop_items — articles de la boutique OTK
-- ============================================================
create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  type text not null default 'digital',
  price numeric not null,
  image_url text,
  stock int,
  tags text[],
  partner_name text,
  partner_location text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shop_items is
  'Articles de la boutique OTK. Lecture publique ; écriture admin.';

create index shop_items_category_idx on public.shop_items (category);
create index shop_items_is_available_idx on public.shop_items (is_available);

create trigger shop_items_updated_at
  before update on public.shop_items
  for each row execute function public.handle_updated_at();

-- ============================================================
-- shop_orders — commandes/échanges OTK
-- ============================================================
create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid references public.shop_items (id) on delete set null,
  quantity int not null default 1,
  total_price numeric not null,
  status text not null default 'pending',
  delivery_info jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.shop_orders is
  'Commandes/échanges en boutique OTK. Lecture/écriture self ; gestion (statut) par admin.';

create index shop_orders_user_id_idx on public.shop_orders (user_id);
create index shop_orders_item_id_idx on public.shop_orders (item_id);
create index shop_orders_status_idx on public.shop_orders (status);

-- ============================================================
-- Fonctions (SECURITY DEFINER) — signatures issues de types.ts Functions
-- ------------------------------------------------------------
-- Corps non disponible dans l'ancien dépôt : logique RAISONNABLE reconstituée.
-- ============================================================

-- Valide une quête pour un utilisateur : marque user_quests « completed »,
-- crédite XP/OTK depuis quests et journalise la transaction OTK.
-- TODO: valider la logique (idempotence, anti double-récompense, paliers de level).
create or replace function public.complete_quest(
  _user_id uuid,
  _quest_id uuid,
  _proof_url text default null,
  _event_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  _quest public.quests%rowtype;
  _already boolean;
  _xp int;
  _otk int;
begin
  select * into _quest from public.quests where id = _quest_id;
  if not found then
    return json_build_object('success', false, 'error', 'quest_not_found');
  end if;

  -- Déjà complétée ? (anti double-récompense)
  select exists (
    select 1 from public.user_quests
    where user_id = _user_id and quest_id = _quest_id and status = 'completed'
  ) into _already;
  if _already then
    return json_build_object('success', false, 'error', 'already_completed');
  end if;

  _xp  := coalesce(_quest.xp_reward, 0);
  _otk := coalesce(_quest.otk_reward, 0);

  -- Marque la progression comme complétée (upsert sur (user, quest)).
  insert into public.user_quests (user_id, quest_id, event_id, status, progress, proof_url, completed_at)
  values (_user_id, _quest_id, _event_id, 'completed', coalesce(_quest.target_count, 1), _proof_url, now())
  on conflict do nothing;

  update public.user_quests
  set status = 'completed',
      proof_url = coalesce(_proof_url, proof_url),
      event_id = coalesce(_event_id, event_id),
      completed_at = now()
  where user_id = _user_id and quest_id = _quest_id;

  -- Crédite le profil (XP + monnaie OTK).
  update public.profiles
  set xp = xp + _xp,
      monthly_xp = monthly_xp + _xp,
      otk_coins = otk_coins + _otk,
      total_otk_earned = total_otk_earned + _otk
  where id = _user_id;

  -- Journalise la transaction OTK (si récompense > 0).
  if _otk <> 0 then
    insert into public.otk_transactions (user_id, amount, transaction_type, description)
    values (_user_id, _otk, 'quest_reward', 'Récompense quête: ' || _quest.title);
  end if;

  return json_build_object(
    'success', true,
    'quest_id', _quest_id,
    'xp_awarded', _xp,
    'otk_awarded', _otk
  );
end;
$$;

-- Crédit/débit OTK manuel par un admin (ajustement) + journalisation.
-- TODO: valider la logique (contrôle des droits côté appelant, signe du montant).
create or replace function public.admin_process_transaction(
  _admin_id uuid,
  _amount numeric,
  _reason text,
  _target_user_id uuid,
  _type text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Seul un admin peut déclencher un ajustement manuel.
  if not public.is_admin(_admin_id) then
    return json_build_object('success', false, 'error', 'not_authorized');
  end if;

  -- Applique le mouvement sur le solde OTK.
  update public.profiles
  set otk_coins = otk_coins + _amount,
      total_otk_earned = total_otk_earned + greatest(_amount, 0)
  where id = _target_user_id;

  if not found then
    return json_build_object('success', false, 'error', 'user_not_found');
  end if;

  -- Journalise la transaction.
  insert into public.otk_transactions (user_id, amount, transaction_type, description)
  values (_target_user_id, _amount, coalesce(_type, 'admin'), _reason);

  return json_build_object(
    'success', true,
    'user_id', _target_user_id,
    'amount', _amount,
    'type', coalesce(_type, 'admin')
  );
end;
$$;

-- Récompense de parrainage : crédite le parrain et incrémente son compteur
-- lorsque le filleul remplit les conditions (validation côté appelant).
-- TODO: valider la logique (montant de la prime, anti double-parrainage, année de référence).
create or replace function public.process_sponsorship_rewards(
  _godchild_id uuid,
  _godchild_username text,
  _sponsor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _reward numeric := 100;  -- TODO: paramétrer la prime de parrainage
begin
  if _sponsor_id is null or _godchild_id is null then
    return false;
  end if;

  -- Incrémente le compteur de parrainage du parrain.
  update public.profiles
  set referral_count = referral_count + 1,
      referral_year = extract(year from now())::int
  where id = _sponsor_id;

  if not found then
    return false;
  end if;

  -- Crédite la prime OTK au parrain + journalise.
  update public.profiles
  set otk_coins = otk_coins + _reward,
      total_otk_earned = total_otk_earned + _reward
  where id = _sponsor_id;

  insert into public.otk_transactions (user_id, amount, transaction_type, description)
  values (
    _sponsor_id, _reward, 'sponsorship',
    'Parrainage de ' || coalesce(_godchild_username, _godchild_id::text)
  );

  return true;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.quests enable row level security;
alter table public.user_quests enable row level security;
alter table public.quest_submissions enable row level security;
alter table public.leagues enable row level security;
alter table public.user_league_stats enable row level security;
alter table public.otk_transactions enable row level security;
alter table public.shop_items enable row level security;
alter table public.shop_orders enable row level security;

-- ── badges : lecture publique ; écriture admin ──
create policy "badges_select_all"
  on public.badges for select to authenticated using (true);
create policy "badges_admin_write"
  on public.badges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── user_badges : self (+ admin) ──
create policy "user_badges_select_self"
  on public.user_badges for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "user_badges_insert_self"
  on public.user_badges for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());
create policy "user_badges_delete"
  on public.user_badges for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── quests : lecture publique ; écriture admin ──
create policy "quests_select_all"
  on public.quests for select to authenticated using (true);
create policy "quests_admin_write"
  on public.quests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── user_quests : self (+ admin) ──
create policy "user_quests_select_self"
  on public.user_quests for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "user_quests_insert_self"
  on public.user_quests for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());
create policy "user_quests_update"
  on public.user_quests for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "user_quests_delete"
  on public.user_quests for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── quest_submissions : self ; revue par admin ──
create policy "quest_submissions_select_self"
  on public.quest_submissions for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "quest_submissions_insert_self"
  on public.quest_submissions for insert to authenticated
  with check (auth.uid() = user_id);
-- Le soumetteur peut modifier tant que c'est en attente ; l'admin revoit/valide.
create policy "quest_submissions_update"
  on public.quest_submissions for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "quest_submissions_delete"
  on public.quest_submissions for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── leagues : lecture publique ; écriture admin ──
create policy "leagues_select_all"
  on public.leagues for select to authenticated using (true);
create policy "leagues_admin_write"
  on public.leagues for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── user_league_stats : self (+ admin) ──
create policy "user_league_stats_select_self"
  on public.user_league_stats for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "user_league_stats_insert_self"
  on public.user_league_stats for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());
create policy "user_league_stats_update"
  on public.user_league_stats for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ── otk_transactions : lecture self + admin ; AUCUN insert client ──
--    (alimenté uniquement par les fonctions SECURITY DEFINER ci-dessus).
create policy "otk_transactions_select_self"
  on public.otk_transactions for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
-- Pas de policy INSERT/UPDATE/DELETE pour les clients : RLS bloque par défaut.
-- Les fonctions SECURITY DEFINER contournent la RLS pour écrire.

-- ── shop_items : lecture publique ; écriture admin ──
create policy "shop_items_select_all"
  on public.shop_items for select to authenticated using (true);
create policy "shop_items_admin_write"
  on public.shop_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── shop_orders : self ; gestion (statut) par admin ──
create policy "shop_orders_select_self"
  on public.shop_orders for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy "shop_orders_insert_self"
  on public.shop_orders for insert to authenticated
  with check (auth.uid() = user_id);
create policy "shop_orders_update"
  on public.shop_orders for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
create policy "shop_orders_delete"
  on public.shop_orders for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());
