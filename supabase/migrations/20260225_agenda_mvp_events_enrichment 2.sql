-- ============================================================
-- MIGRATION: Agenda MVP - Enrichissement de la table events
-- Date: 2026-02-25
-- Description: Ajoute les champs manquants pour le module Agenda/Événements
--   - date_debut / date_fin (timestamps avec timezone, plus précis que date/end_date)
--   - adresse (adresse complète de l'événement)
--   - coordonnees_gps (JSONB pour Leaflet: { lat, lng })
--   - type_evenement (enum: convention, tournoi, atelier, meetup, concert, autre)
--   - cover_image (URL de l'image de couverture haute résolution)
-- ============================================================

-- 1. Créer le type ENUM pour les types d'événements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM (
      'convention',
      'tournoi',
      'atelier',
      'meetup',
      'concert',
      'exposition',
      'projection',
      'autre'
    );
  END IF;
END $$;

-- 2. Ajouter les colonnes manquantes à la table events (idempotent avec IF NOT EXISTS)

-- date_debut: timestamp précis du début de l'événement (remplace/complète le champ 'date')
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS date_debut TIMESTAMPTZ;

-- date_fin: timestamp précis de la fin de l'événement (remplace/complète end_date)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS date_fin TIMESTAMPTZ;

-- adresse: adresse complète (rue, numéro) - complète le champ 'location' existant
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS adresse TEXT;

-- coordonnees_gps: JSONB pour stocker { lat: number, lng: number } pour Leaflet
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS coordonnees_gps JSONB;

-- type_evenement: catégorie sémantique de l'événement (plus précis que 'category')
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS type_evenement TEXT DEFAULT 'autre';

-- cover_image: URL de l'image de couverture haute résolution (complète image_url)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 3. Backfill: Synchroniser les nouvelles colonnes avec les données existantes
-- Note: Le champ 'date' est de type TIMESTAMPTZ dans ce schéma.
-- Le cast direct est donc suffisant et sans risque d'erreur de format.

-- Copier 'date' vers 'date_debut' pour les événements existants
UPDATE public.events
SET date_debut = date::TIMESTAMPTZ
WHERE date_debut IS NULL AND date IS NOT NULL;

-- Copier 'end_date' vers 'date_fin' pour les événements existants
UPDATE public.events
SET date_fin = end_date::TIMESTAMPTZ
WHERE date_fin IS NULL AND end_date IS NOT NULL;

-- Copier 'location' vers 'adresse' pour les événements existants
UPDATE public.events
SET adresse = location
WHERE adresse IS NULL AND location IS NOT NULL;

-- Copier 'image_url' vers 'cover_image' pour les événements existants
UPDATE public.events
SET cover_image = image_url
WHERE cover_image IS NULL AND image_url IS NOT NULL;

-- Mapper 'category' vers 'type_evenement' pour les événements existants
UPDATE public.events
SET type_evenement = CASE
  WHEN category = 'convention' THEN 'convention'
  WHEN category = 'tournament' OR category = 'tournoi' THEN 'tournoi'
  WHEN category = 'workshop' OR category = 'atelier' THEN 'atelier'
  WHEN category = 'meetup' THEN 'meetup'
  WHEN category = 'concert' THEN 'concert'
  WHEN category = 'expo' OR category = 'exposition' THEN 'exposition'
  ELSE 'autre'
END
WHERE type_evenement = 'autre' OR type_evenement IS NULL;

-- 4. Ajouter un index sur coordonnees_gps pour les requêtes géospatiales futures
CREATE INDEX IF NOT EXISTS idx_events_coordonnees_gps
  ON public.events USING GIN (coordonnees_gps);

-- 5. Ajouter un index sur type_evenement pour les filtres
CREATE INDEX IF NOT EXISTS idx_events_type_evenement
  ON public.events (type_evenement);

-- 6. Ajouter un index sur date_debut pour les tris chronologiques
CREATE INDEX IF NOT EXISTS idx_events_date_debut
  ON public.events (date_debut);

-- 7. Commentaires de documentation
COMMENT ON COLUMN public.events.date_debut IS 'Timestamp précis du début de l''événement (avec timezone)';
COMMENT ON COLUMN public.events.date_fin IS 'Timestamp précis de la fin de l''événement (avec timezone)';
COMMENT ON COLUMN public.events.adresse IS 'Adresse complète de l''événement (rue, numéro)';
COMMENT ON COLUMN public.events.coordonnees_gps IS 'Coordonnées GPS pour Leaflet: { "lat": number, "lng": number }';
COMMENT ON COLUMN public.events.type_evenement IS 'Type sémantique: convention, tournoi, atelier, meetup, concert, exposition, projection, autre';
COMMENT ON COLUMN public.events.cover_image IS 'URL de l''image de couverture haute résolution';
