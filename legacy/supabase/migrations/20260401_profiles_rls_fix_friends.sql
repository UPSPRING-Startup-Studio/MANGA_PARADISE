-- ============================================================
-- PROFILES RLS — Membres authentifiés peuvent voir tous les profils
-- ============================================================
-- La colonne profile_visibility contrôle l'ANNUAIRE (filtré côté query),
-- pas l'accès entre membres connectés. Un ami doit pouvoir lire
-- le profil de son ami même si celui-ci est "private".
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : public anonyme voit les profils publics,
--           tout membre authentifié voit tous les profils.
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public_or_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    -- Membres connectés voient tous les profils (amis, nakamas, etc.)
    auth.uid() IS NOT NULL
    -- Visiteurs anonymes ne voient que les profils publics
    OR profile_visibility = 'public'
    OR profile_visibility IS NULL
  );
