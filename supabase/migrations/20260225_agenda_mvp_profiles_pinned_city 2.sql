-- ============================================================
-- MIGRATION: Agenda MVP - Ajout de pinned_city dans profiles
-- Date: 2026-02-25
-- Description: Ajoute le champ pinned_city pour le Hub Local de l'Agenda.
--   Permet à l'utilisateur de sauvegarder sa ville préférée pour filtrer
--   les événements locaux automatiquement.
-- ============================================================

-- Ajouter la colonne pinned_city à la table profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pinned_city TEXT;

-- Index pour les recherches par ville
CREATE INDEX IF NOT EXISTS idx_profiles_pinned_city
  ON public.profiles (pinned_city)
  WHERE pinned_city IS NOT NULL;

-- Commentaire de documentation
COMMENT ON COLUMN public.profiles.pinned_city IS 'Ville préférée de l''utilisateur pour le Hub Local de l''Agenda. Utilisée pour filtrer les événements locaux.';

-- RLS: La colonne hérite des politiques existantes de la table profiles.
-- Les utilisateurs peuvent lire/modifier leur propre profil via les policies existantes.
