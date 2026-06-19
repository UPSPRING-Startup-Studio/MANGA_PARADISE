-- ============================================================
-- PROFILES — RLS SELECT pour l'annuaire
-- ============================================================
-- Permet la lecture des profils publics (ou visibility null)
-- depuis l'annuaire, ainsi que la lecture de son propre profil.
-- À appliquer SEULEMENT si SELECT count(*) FROM profiles > 0
-- mais que l'annuaire affiche 0 membres.
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : profil public OU son propre profil
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (
    profile_visibility = 'public'
    OR profile_visibility IS NULL
    OR id = auth.uid()
  );
