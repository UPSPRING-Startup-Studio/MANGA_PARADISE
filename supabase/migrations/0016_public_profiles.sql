-- ============================================================
-- 0016_public_profiles — Vue publique "safe" de profiles
-- Expose volontairement les colonnes NON sensibles pour l'acces anonyme / SEO
-- (fiches /u/[username]). Cf. docs/data-model.md (TODO "vue publique safe")
-- et docs/adr/0002 (logique dans la base).
-- ============================================================

-- La vue est en SECURITY DEFINER (defaut Postgres pour les vues) : elle ne
-- depend pas de la RLS de profiles et n'expose que la projection ci-dessous.
-- On ne montre que les profils volontairement publics et nommes.
create or replace view public.public_profiles as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.cover_image_url,
  p.bio,
  p.city,
  p.level,
  p.otaku_class,
  p.favorite_manga,
  p.favorite_character,
  p.favorite_character_image,
  p.favorite_genres,
  p.favorite_activities,
  p.created_at
from public.profiles p
where p.username is not null
  and coalesce(p.profile_visibility, 'public') = 'public';

comment on view public.public_profiles is
  'Projection publique (colonnes non sensibles) de profiles pour acces anonyme / SEO.';

-- Lecture publique de la vue uniquement (jamais la table de base).
grant select on public.public_profiles to anon, authenticated;
