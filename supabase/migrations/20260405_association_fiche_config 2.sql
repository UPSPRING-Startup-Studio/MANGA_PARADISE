-- ============================================================
-- MODULE FICHE ASSOCIATION — Configuration de la fiche publique
--
-- Ajoute une table de configuration par association pour gérer :
--   - Le contenu éditorial (mission, vision, valeurs, mot du président)
--   - La visibilité des sections (toggle on/off)
--   - Les documents mis en avant sur la fiche
--   - La configuration du trombinoscope (quels rôles afficher)
--
-- IDEMPOTENT : tout est en IF NOT EXISTS / DO $$ EXCEPTION $$
-- ============================================================


-- ============================================================
-- 1. TABLE : association_fiche_config
-- ============================================================

CREATE TABLE IF NOT EXISTS public.association_fiche_config (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id    uuid NOT NULL UNIQUE REFERENCES public.associations(id) ON DELETE CASCADE,

  -- ── Contenu éditorial ──
  president_message text,                          -- Mot du/de la président·e (markdown ou texte)
  president_name    text,                          -- Nom affiché du/de la président·e
  president_title   text DEFAULT 'Président·e',    -- Titre affiché (ex: "Président·e", "Co-Président")
  president_photo   text,                          -- URL photo du/de la président·e
  mission           text,                          -- Notre mission
  vision            text,                          -- Notre vision
  values            text,                          -- Nos valeurs
  charter_rules     jsonb DEFAULT '[]'::jsonb,     -- Règles de la charte [{emoji, title, description}]

  -- ── Visibilité des sections ──
  -- Chaque section peut être : 'visible' (tous membres), 'internal' (membres only), 'hidden'
  sections_visibility jsonb NOT NULL DEFAULT '{
    "president_message": "visible",
    "mission": "visible",
    "vision": "visible",
    "values": "visible",
    "team_bureau": "visible",
    "team_staff": "visible",
    "documents": "internal",
    "charter": "visible",
    "quick_actions": "internal",
    "faq": "hidden"
  }'::jsonb,

  -- ── Configuration du trombinoscope ──
  -- Quels rôles montrer dans le trombinoscope de la fiche
  team_visible_roles text[] NOT NULL DEFAULT ARRAY[
    'president', 'vice_president', 'tresorier', 'secretaire', 'responsable'
  ]::text[],

  -- ── Documents mis en avant sur la fiche (IDs de association_documents) ──
  featured_document_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- ── Métadonnées ──
  updated_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_fiche_config_association
  ON public.association_fiche_config(association_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS on_fiche_config_updated ON public.association_fiche_config;
CREATE TRIGGER on_fiche_config_updated
  BEFORE UPDATE ON public.association_fiche_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

ALTER TABLE public.association_fiche_config ENABLE ROW LEVEL SECURITY;

-- SELECT : Tout utilisateur authentifié peut lire la config
-- (la visibilité par section est gérée côté applicatif)
CREATE POLICY "fiche_config_select_authenticated"
  ON public.association_fiche_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.associations a
      WHERE a.id = association_fiche_config.association_id
        AND a.status = 'active'
    )
    OR public.is_platform_admin()
  );

-- INSERT : Bureau de l'association ou admin plateforme
CREATE POLICY "fiche_config_insert_bureau"
  ON public.association_fiche_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_association_admin(association_id)
  );

-- UPDATE : Bureau de l'association ou admin plateforme
CREATE POLICY "fiche_config_update_bureau"
  ON public.association_fiche_config
  FOR UPDATE
  TO authenticated
  USING (
    public.is_association_admin(association_id)
  )
  WITH CHECK (
    public.is_association_admin(association_id)
  );

-- DELETE : Owner ou admin plateforme uniquement
CREATE POLICY "fiche_config_delete_owner"
  ON public.association_fiche_config
  FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_association_owner(association_id)
  );


-- ============================================================
-- 3. FONCTION : Créer automatiquement une fiche config vide
--    quand une association est créée
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_create_fiche_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.association_fiche_config (association_id)
  VALUES (NEW.id)
  ON CONFLICT (association_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_fiche_config ON public.associations;
CREATE TRIGGER trg_auto_create_fiche_config
  AFTER INSERT ON public.associations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_fiche_config();

-- Backfill : Créer une fiche config pour les associations existantes
INSERT INTO public.association_fiche_config (association_id)
SELECT id FROM public.associations
WHERE id NOT IN (SELECT association_id FROM public.association_fiche_config)
ON CONFLICT (association_id) DO NOTHING;


-- ============================================================
-- RÉCAPITULATIF
-- ============================================================
-- TABLE CRÉÉE :
--   association_fiche_config (1 par association, UNIQUE constraint)
--
-- RLS :
--   SELECT : tout authentifié (asso active) ou admin plateforme
--   INSERT/UPDATE : bureau de l'asso (via is_association_admin)
--   DELETE : owner ou admin plateforme
--
-- TRIGGER :
--   auto_create_fiche_config : crée automatiquement une ligne
--   quand une nouvelle association est insérée
--
-- BACKFILL :
--   Crée une fiche config vide pour les associations existantes
