-- ============================================================
-- PRO PARTNERS V3 — CRM pipeline + réseaux sociaux directs
--
-- AJOUTS :
--   partner_status     → pipeline CRM interne (6 états)
--   partner_offers     → contreparties du partenaire
--   mp_offers          → contreparties Manga Paradise
--   facebook_url, instagram_url, twitter_url,
--   tiktok_url, youtube_url, linkedin_url → réseaux sociaux
--
-- NOTE : social_links JSONB est conservé pour rétro-compat.
--        Les colonnes directes permettent le query/filtre/index.
--        logo_url existe déjà (V1).
--
-- IDEMPOTENT : ADD COLUMN IF NOT EXISTS / DO $$ EXCEPTION $$
-- ============================================================

-- ── Pipeline CRM ──
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS partner_status text NOT NULL DEFAULT 'opportunite';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS partner_offers text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS mp_offers text DEFAULT '';

DO $$ BEGIN
  ALTER TABLE public.pro_partners
    ADD CONSTRAINT chk_pro_partners_partner_status
    CHECK (partner_status IN (
      'opportunite', 'mail_envoye', 'en_cours_edition',
      'attente_signature', 'accord_principe', 'convention_signee'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_pro_partners_partner_status
  ON public.pro_partners(partner_status);

-- ── Réseaux sociaux — colonnes directes ──
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS facebook_url  text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS twitter_url   text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS tiktok_url    text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS youtube_url   text DEFAULT '';
ALTER TABLE public.pro_partners ADD COLUMN IF NOT EXISTS linkedin_url  text DEFAULT '';

-- ── Migration données social_links JSONB → colonnes directes ──
-- Copie les valeurs existantes du JSONB vers les nouvelles colonnes
-- (seulement si la colonne directe est vide)
UPDATE public.pro_partners
SET
  facebook_url  = COALESCE(NULLIF(facebook_url, ''),  social_links->>'facebook',  ''),
  instagram_url = COALESCE(NULLIF(instagram_url, ''), social_links->>'instagram', ''),
  twitter_url   = COALESCE(NULLIF(twitter_url, ''),   social_links->>'twitter',   ''),
  tiktok_url    = COALESCE(NULLIF(tiktok_url, ''),    social_links->>'tiktok',    ''),
  youtube_url   = COALESCE(NULLIF(youtube_url, ''),   social_links->>'youtube',   ''),
  linkedin_url  = COALESCE(NULLIF(linkedin_url, ''),  social_links->>'linkedin',  '')
WHERE social_links IS NOT NULL AND social_links != '{}'::jsonb;
