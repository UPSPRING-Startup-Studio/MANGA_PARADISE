-- ============================================================
-- MODULE MISSIONS V2 — Schema Configurator & Enrichment
--
-- ARCHITECTURE :
--   1. Colonnes natives ajoutées à volunteer_missions (queryable, type-safe)
--   2. mission_schema_sections — sections configurables du formulaire
--   3. mission_schema_fields — champs configurables avec types, règles, bindings
--   4. mission_templates — templates réutilisables avec valeurs pré-remplies
--   5. custom_data JSONB sur volunteer_missions — données des champs custom
--
-- PHILOSOPHIE :
--   - Champs standards = colonnes SQL (robustes, filtrables)
--   - Champs custom = schema + JSONB (flexibles, évolutifs)
--   - Désactiver un champ ne supprime pas les données
--   - Les clés techniques (slug) sont stables
--
-- IDEMPOTENT / SAFE
-- ============================================================


-- ============================================================
-- 1. VOLUNTEER_MISSIONS — Colonnes enrichies
-- ============================================================

-- ── Section 1 : Informations générales ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN mission_type text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN mission_subtype text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN secondary_poles text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN location_detail text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN summary text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 2 : Besoin humain ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN slots_min integer NOT NULL DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN slots_max integer; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN suitable_for_beginners boolean NOT NULL DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN suitable_for_minors boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN contact_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 3 : Compétences (complément) ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN optional_skills text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN trainable_skills text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 4 : Planning enrichi ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN setup_start_at timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN teardown_end_at timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN briefing_minutes integer; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN break_minutes integer; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN confirmation_deadline timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 5 : Conditions & organisation ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN briefing_required boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN dress_code text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN equipment_provided text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN equipment_required text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN physical_requirements text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN autonomy_level text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN constraints_text text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN procedures text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 6 : Avantages & valorisation ──
DO $$ BEGIN
  ALTER TABLE public.volunteer_missions ADD COLUMN perks jsonb NOT NULL DEFAULT '{
    "meal": false, "drinks": false, "entry": false, "goodies": false,
    "badge": false, "points": 0, "public_thanks": false, "other": null
  }';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ── Section 7 : Candidature ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN application_mode text NOT NULL DEFAULT 'open'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN is_public boolean NOT NULL DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN application_deadline timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN application_message text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN required_documents text[] NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.volunteer_missions
    ADD CONSTRAINT chk_application_mode
    CHECK (application_mode IN ('open', 'manual', 'invitation_only'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Section 8 : Notes internes ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN internal_checklist jsonb NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN preparation_status text NOT NULL DEFAULT 'not_started'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN risks text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.volunteer_missions
    ADD CONSTRAINT chk_preparation_status
    CHECK (preparation_status IN ('not_started', 'in_progress', 'ready', 'blocked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Template & custom data ──
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN template_id uuid; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.volunteer_missions ADD COLUMN custom_data jsonb NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vol_missions_type ON public.volunteer_missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_vol_missions_subtype ON public.volunteer_missions(mission_subtype);
CREATE INDEX IF NOT EXISTS idx_vol_missions_public ON public.volunteer_missions(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_vol_missions_app_mode ON public.volunteer_missions(application_mode);
CREATE INDEX IF NOT EXISTS idx_vol_missions_template ON public.volunteer_missions(template_id);
CREATE INDEX IF NOT EXISTS idx_vol_missions_custom ON public.volunteer_missions USING gin(custom_data);
CREATE INDEX IF NOT EXISTS idx_vol_missions_secondary_poles ON public.volunteer_missions USING gin(secondary_poles);


-- ============================================================
-- 2. MISSION_SCHEMA_SECTIONS — Sections configurables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mission_schema_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE,
  -- NULL = section globale plateforme

  slug text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,

  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  is_collapsed_default boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  -- is_system = section standard non supprimable

  applicable_poles text[] NOT NULL DEFAULT '{}',
  -- vide = toutes ; sinon filtre par pôle
  applicable_types text[] NOT NULL DEFAULT '{}',
  -- vide = tous ; sinon filtre par type de mission

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mission_section_slug
  ON public.mission_schema_sections(COALESCE(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE INDEX IF NOT EXISTS idx_mission_sections_assoc
  ON public.mission_schema_sections(association_id);
CREATE INDEX IF NOT EXISTS idx_mission_sections_order
  ON public.mission_schema_sections(association_id, display_order);

DROP TRIGGER IF EXISTS trg_mission_sections_updated ON public.mission_schema_sections;
CREATE TRIGGER trg_mission_sections_updated
  BEFORE UPDATE ON public.mission_schema_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 3. MISSION_SCHEMA_FIELDS — Champs configurables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mission_schema_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.mission_schema_sections(id) ON DELETE CASCADE,
  association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE,

  slug text NOT NULL,
  label text NOT NULL,
  helper_text text,
  placeholder text,

  field_type text NOT NULL DEFAULT 'text',
  -- Types : text, textarea, number, boolean, select, multiselect,
  -- date, datetime, tags, url, email, phone, checklist,
  -- relation_event, relation_user, relation_skill, richtext

  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  is_admin_only boolean NOT NULL DEFAULT false,
  is_locked_after_create boolean NOT NULL DEFAULT false,
  is_multi_value boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  -- is_system = champ standard mappé sur une colonne native

  native_column text,
  -- Si is_system=true, nom de la colonne sur volunteer_missions
  -- ex: 'title', 'description', 'mission_type', 'slots_needed'

  default_value jsonb,
  options jsonb NOT NULL DEFAULT '[]',
  -- Pour select/multiselect: [{"value": "x", "label": "X", "emoji": "🎯"}]

  validation_rules jsonb NOT NULL DEFAULT '{}',
  -- Ex: {"min": 1, "max": 100, "pattern": "^[a-z]+$", "maxLength": 500}

  conditions jsonb NOT NULL DEFAULT '[]',
  -- Ex: [{"field_slug": "mission_type", "operator": "eq", "value": "photo"}]
  -- Le champ n'apparaît que si les conditions sont remplies

  visibility_level text NOT NULL DEFAULT 'internal',
  -- 'internal' = staff only, 'volunteer' = visible bénévoles, 'public' = public

  applicable_poles text[] NOT NULL DEFAULT '{}',
  applicable_types text[] NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.mission_schema_fields
    ADD CONSTRAINT chk_field_type
    CHECK (field_type IN (
      'text', 'textarea', 'number', 'boolean', 'select', 'multiselect',
      'date', 'datetime', 'tags', 'url', 'email', 'phone', 'checklist',
      'relation_event', 'relation_user', 'relation_skill', 'richtext'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.mission_schema_fields
    ADD CONSTRAINT chk_visibility_level
    CHECK (visibility_level IN ('internal', 'volunteer', 'public'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mission_field_slug
  ON public.mission_schema_fields(section_id, COALESCE(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE INDEX IF NOT EXISTS idx_mission_fields_section
  ON public.mission_schema_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_mission_fields_assoc
  ON public.mission_schema_fields(association_id);
CREATE INDEX IF NOT EXISTS idx_mission_fields_order
  ON public.mission_schema_fields(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_mission_fields_type
  ON public.mission_schema_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_mission_fields_system
  ON public.mission_schema_fields(is_system) WHERE is_system = true;

DROP TRIGGER IF EXISTS trg_mission_fields_updated ON public.mission_schema_fields;
CREATE TRIGGER trg_mission_fields_updated
  BEFORE UPDATE ON public.mission_schema_fields
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();


-- ============================================================
-- 4. MISSION_TEMPLATES — Templates réutilisables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid REFERENCES public.associations(id) ON DELETE CASCADE,
  -- NULL = template global plateforme

  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,

  pole text,
  mission_type text,
  mission_subtype text,

  -- Valeurs pré-remplies des champs natifs
  default_values jsonb NOT NULL DEFAULT '{}',
  -- Ex: {"slots_needed": 3, "priority": "high", "briefing_required": true, ...}

  -- Valeurs pré-remplies des champs custom
  custom_field_values jsonb NOT NULL DEFAULT '{}',
  -- Ex: {"materiel_photo": "reflex", "zone_couverture": "scene_principale"}

  -- Sections à activer pour ce template
  enabled_sections text[] NOT NULL DEFAULT '{}',
  -- slugs de sections ; vide = toutes

  is_active boolean NOT NULL DEFAULT true,
  is_global boolean NOT NULL DEFAULT false,
  -- is_global = visible par toutes les associations

  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mission_template_slug
  ON public.mission_templates(COALESCE(association_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE INDEX IF NOT EXISTS idx_mission_templates_assoc
  ON public.mission_templates(association_id);
CREATE INDEX IF NOT EXISTS idx_mission_templates_pole
  ON public.mission_templates(pole);
CREATE INDEX IF NOT EXISTS idx_mission_templates_type
  ON public.mission_templates(mission_type);
CREATE INDEX IF NOT EXISTS idx_mission_templates_active
  ON public.mission_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mission_templates_global
  ON public.mission_templates(is_global) WHERE is_global = true;

DROP TRIGGER IF EXISTS trg_mission_templates_updated ON public.mission_templates;
CREATE TRIGGER trg_mission_templates_updated
  BEFORE UPDATE ON public.mission_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_association_updated_at();

-- FK from volunteer_missions.template_id
DO $$ BEGIN
  ALTER TABLE public.volunteer_missions
    ADD CONSTRAINT fk_missions_template
    FOREIGN KEY (template_id) REFERENCES public.mission_templates(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- ── mission_schema_sections ──
ALTER TABLE public.mission_schema_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_sections_select" ON public.mission_schema_sections
  FOR SELECT TO authenticated USING (
    association_id IS NULL  -- global sections visible to all
    OR public.is_association_member(association_id)
    OR public.is_global_association_admin()
  );

CREATE POLICY "ms_sections_manage" ON public.mission_schema_sections
  FOR ALL TO authenticated USING (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  ) WITH CHECK (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  );

-- ── mission_schema_fields ──
ALTER TABLE public.mission_schema_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_fields_select" ON public.mission_schema_fields
  FOR SELECT TO authenticated USING (
    association_id IS NULL
    OR public.is_association_member(association_id)
    OR public.is_global_association_admin()
  );

CREATE POLICY "ms_fields_manage" ON public.mission_schema_fields
  FOR ALL TO authenticated USING (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  ) WITH CHECK (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  );

-- ── mission_templates ──
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_templates_select" ON public.mission_templates
  FOR SELECT TO authenticated USING (
    is_global = true
    OR association_id IS NULL
    OR public.is_association_member(association_id)
    OR public.is_global_association_admin()
  );

CREATE POLICY "ms_templates_manage" ON public.mission_templates
  FOR ALL TO authenticated USING (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  ) WITH CHECK (
    public.is_global_association_admin()
    OR (association_id IS NOT NULL AND public.is_association_admin(association_id))
  );


-- ============================================================
-- 6. SEED : Sections & champs standards (système)
-- ============================================================

-- Upsert helper for idempotent seeding
CREATE OR REPLACE FUNCTION public.seed_mission_section(
  p_slug text, p_name text, p_description text, p_icon text,
  p_order integer, p_required boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.mission_schema_sections
  WHERE association_id IS NULL AND slug = p_slug;

  IF v_id IS NULL THEN
    INSERT INTO public.mission_schema_sections (
      association_id, slug, name, description, icon,
      display_order, is_system, is_required, is_visible, is_active
    ) VALUES (
      NULL, p_slug, p_name, p_description, p_icon,
      p_order, true, p_required, true, true
    ) RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_mission_field(
  p_section_slug text, p_slug text, p_label text,
  p_field_type text, p_order integer,
  p_native_column text DEFAULT NULL,
  p_required boolean DEFAULT false,
  p_helper text DEFAULT NULL,
  p_placeholder text DEFAULT NULL,
  p_options jsonb DEFAULT '[]',
  p_default_value jsonb DEFAULT NULL,
  p_visibility text DEFAULT 'internal'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE v_section_id uuid;
BEGIN
  SELECT id INTO v_section_id FROM public.mission_schema_sections
  WHERE association_id IS NULL AND slug = p_section_slug;

  IF v_section_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.mission_schema_fields (
    section_id, association_id, slug, label, field_type, display_order,
    native_column, is_required, is_system, helper_text, placeholder,
    options, default_value, visibility_level
  ) VALUES (
    v_section_id, NULL, p_slug, p_label, p_field_type, p_order,
    p_native_column, p_required, p_native_column IS NOT NULL,
    p_helper, p_placeholder, p_options, p_default_value, p_visibility
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── Seed sections ──
SELECT public.seed_mission_section('general', 'Informations générales', 'Identité et contexte de la mission', 'Info', 1, true);
SELECT public.seed_mission_section('staffing', 'Besoin humain', 'Effectifs et profils recherchés', 'Users', 2, true);
SELECT public.seed_mission_section('skills', 'Compétences', 'Compétences requises et appréciées', 'Star', 3, false);
SELECT public.seed_mission_section('schedule', 'Créneaux & planning', 'Dates, horaires et shifts', 'Calendar', 4, true);
SELECT public.seed_mission_section('conditions', 'Conditions & organisation', 'Logistique, tenue, matériel', 'Shield', 5, false);
SELECT public.seed_mission_section('perks', 'Avantages & valorisation', 'Contreparties et remerciements', 'Gift', 6, false);
SELECT public.seed_mission_section('application', 'Candidature', 'Modalités de participation', 'ClipboardCheck', 7, false);
SELECT public.seed_mission_section('internal', 'Notes internes', 'Informations staff uniquement', 'Lock', 8, false);

-- ── Seed standard fields — Section: general ──
SELECT public.seed_mission_field('general', 'title', 'Titre de la mission', 'text', 1, 'title', true, NULL, 'Ex: Accueil visiteurs - Hall A');
SELECT public.seed_mission_field('general', 'summary', 'Résumé court', 'textarea', 2, 'summary', false, 'Description courte pour l''appel à participation', 'En quelques mots...', '[]', NULL, 'public');
SELECT public.seed_mission_field('general', 'description', 'Description détaillée', 'textarea', 3, 'description', false, NULL, 'Décris la mission en détail...');
SELECT public.seed_mission_field('general', 'mission_type', 'Type de mission', 'select', 4, 'mission_type', false, NULL, NULL,
  '[{"value":"accueil","label":"Accueil public","emoji":"👋"},{"value":"stand","label":"Stand associatif","emoji":"🎪"},{"value":"quiz","label":"Quiz / Blind test","emoji":"🎯"},{"value":"tournoi","label":"Tournoi jeux vidéo","emoji":"🎮"},{"value":"cosplay","label":"Cosplay / Concours","emoji":"🎭"},{"value":"photo","label":"Photo / Vidéo","emoji":"📸"},{"value":"community","label":"Community management","emoji":"📱"},{"value":"redaction","label":"Rédaction / Blog","emoji":"✍️"},{"value":"atelier","label":"Atelier / Workshop","emoji":"✂️"},{"value":"regie","label":"Régie / Technique","emoji":"🔧"},{"value":"caisse","label":"Caisse / Vente","emoji":"💰"},{"value":"buvette","label":"Buvette / Restauration","emoji":"🍜"},{"value":"logistique","label":"Logistique","emoji":"📦"},{"value":"installation","label":"Installation / Montage","emoji":"🔨"},{"value":"demontage","label":"Démontage","emoji":"🧹"},{"value":"pret_materiel","label":"Prêt de matériel","emoji":"🎲"},{"value":"securite","label":"Sécurité / Orientation","emoji":"🛡️"},{"value":"autre","label":"Autre","emoji":"⚡"}]'::jsonb
);
SELECT public.seed_mission_field('general', 'mission_subtype', 'Sous-type', 'text', 5, 'mission_subtype', false, 'Précision sur le type', 'Ex: Régie son, Quiz anime...');
SELECT public.seed_mission_field('general', 'event_id', 'Événement lié', 'relation_event', 6, 'event_id');
SELECT public.seed_mission_field('general', 'pole', 'Pôle principal', 'select', 7, 'pole', false, NULL, NULL,
  '[{"value":"animation","label":"Animation","emoji":"🎤"},{"value":"culture","label":"Culture","emoji":"📚"},{"value":"communication","label":"Communication","emoji":"📣"},{"value":"creatif","label":"Créatif","emoji":"🎨"},{"value":"technique","label":"Technique","emoji":"🔧"},{"value":"accueil","label":"Accueil","emoji":"👋"},{"value":"logistique","label":"Logistique","emoji":"📦"},{"value":"boutique","label":"Boutique","emoji":"🛍️"},{"value":"coordination","label":"Coordination","emoji":"🧭"}]'::jsonb
);
SELECT public.seed_mission_field('general', 'secondary_poles', 'Pôles secondaires', 'multiselect', 8, 'secondary_poles');
SELECT public.seed_mission_field('general', 'zone', 'Zone', 'text', 9, 'zone', false, NULL, 'Ex: Hall A, Scène principale...');
SELECT public.seed_mission_field('general', 'location_detail', 'Lieu précis', 'text', 10, 'location_detail', false, NULL, 'Ex: Stand 12, Salle B2...');
SELECT public.seed_mission_field('general', 'status', 'Statut', 'select', 11, 'status', true, NULL, NULL,
  '[{"value":"draft","label":"Brouillon"},{"value":"open","label":"Ouverte"},{"value":"in_progress","label":"En cours"},{"value":"complete","label":"Terminée"},{"value":"cancelled","label":"Annulée"}]'::jsonb,
  '"draft"'::jsonb
);
SELECT public.seed_mission_field('general', 'priority', 'Priorité', 'select', 12, 'priority', false, NULL, NULL,
  '[{"value":"low","label":"Basse"},{"value":"medium","label":"Normale"},{"value":"high","label":"Haute"},{"value":"critical","label":"Critique"}]'::jsonb,
  '"medium"'::jsonb
);

-- ── Seed standard fields — Section: staffing ──
SELECT public.seed_mission_field('staffing', 'slots_min', 'Minimum bénévoles', 'number', 1, 'slots_min', true, NULL, '1', '[]', '1');
SELECT public.seed_mission_field('staffing', 'slots_needed', 'Nombre cible', 'number', 2, 'slots_needed', true, NULL, '3', '[]', '1');
SELECT public.seed_mission_field('staffing', 'slots_max', 'Maximum bénévoles', 'number', 3, 'slots_max');
SELECT public.seed_mission_field('staffing', 'required_experience', 'Expérience requise', 'select', 4, 'required_experience', false, NULL, NULL,
  '[{"value":"debutant","label":"Débutant·e"},{"value":"intermediaire","label":"Intermédiaire"},{"value":"confirme","label":"Confirmé·e"},{"value":"expert","label":"Expert·e"}]'::jsonb,
  '"debutant"'::jsonb, 'public'
);
SELECT public.seed_mission_field('staffing', 'suitable_for_beginners', 'Accessible aux débutants', 'boolean', 5, 'suitable_for_beginners', false, NULL, NULL, '[]', 'true', 'public');
SELECT public.seed_mission_field('staffing', 'suitable_for_minors', 'Accessible aux mineurs', 'boolean', 6, 'suitable_for_minors', false, NULL, NULL, '[]', 'false', 'public');
SELECT public.seed_mission_field('staffing', 'responsible_id', 'Responsable référent', 'relation_user', 7, 'responsible_id');
SELECT public.seed_mission_field('staffing', 'contact_id', 'Contact mission', 'relation_user', 8, 'contact_id');

-- ── Seed standard fields — Section: skills ──
SELECT public.seed_mission_field('skills', 'required_skills', 'Compétences obligatoires', 'multiselect', 1, 'required_skills', false, NULL, NULL, '[]', NULL, 'public');
SELECT public.seed_mission_field('skills', 'optional_skills', 'Compétences appréciées', 'multiselect', 2, 'optional_skills');
SELECT public.seed_mission_field('skills', 'trainable_skills', 'Formation possible', 'tags', 3, 'trainable_skills', false, 'Compétences que le bénévole pourra acquérir');
SELECT public.seed_mission_field('skills', 'required_interests', 'Centres d''intérêt liés', 'multiselect', 4, 'required_interests');
SELECT public.seed_mission_field('skills', 'tags', 'Tags thématiques', 'tags', 5, 'tags');

-- ── Seed standard fields — Section: schedule ──
SELECT public.seed_mission_field('schedule', 'start_at', 'Début de mission', 'datetime', 1, 'start_at', false, NULL, NULL, '[]', NULL, 'public');
SELECT public.seed_mission_field('schedule', 'end_at', 'Fin de mission', 'datetime', 2, 'end_at', false, NULL, NULL, '[]', NULL, 'public');
SELECT public.seed_mission_field('schedule', 'setup_start_at', 'Début installation', 'datetime', 3, 'setup_start_at');
SELECT public.seed_mission_field('schedule', 'teardown_end_at', 'Fin démontage', 'datetime', 4, 'teardown_end_at');
SELECT public.seed_mission_field('schedule', 'briefing_minutes', 'Durée briefing (min)', 'number', 5, 'briefing_minutes');
SELECT public.seed_mission_field('schedule', 'break_minutes', 'Temps de pause (min)', 'number', 6, 'break_minutes');
SELECT public.seed_mission_field('schedule', 'confirmation_deadline', 'Date limite confirmation', 'datetime', 7, 'confirmation_deadline');

-- ── Seed standard fields — Section: conditions ──
SELECT public.seed_mission_field('conditions', 'briefing_required', 'Briefing obligatoire', 'boolean', 1, 'briefing_required');
SELECT public.seed_mission_field('conditions', 'dress_code', 'Tenue / Dress code', 'text', 2, 'dress_code', false, NULL, 'Ex: T-shirt staff fourni, tenue sombre...');
SELECT public.seed_mission_field('conditions', 'equipment_provided', 'Matériel fourni', 'tags', 3, 'equipment_provided');
SELECT public.seed_mission_field('conditions', 'equipment_required', 'Matériel à apporter', 'tags', 4, 'equipment_required');
SELECT public.seed_mission_field('conditions', 'physical_requirements', 'Conditions physiques', 'text', 5, 'physical_requirements', false, 'Ex: station debout prolongée, port de charges...');
SELECT public.seed_mission_field('conditions', 'autonomy_level', 'Niveau d''autonomie', 'select', 6, 'autonomy_level', false, NULL, NULL,
  '[{"value":"guided","label":"Guidé (encadrement constant)"},{"value":"semi","label":"Semi-autonome"},{"value":"autonomous","label":"Autonome"},{"value":"lead","label":"Leadership attendu"}]'::jsonb
);
SELECT public.seed_mission_field('conditions', 'constraints_text', 'Contraintes particulières', 'textarea', 7, 'constraints_text');
SELECT public.seed_mission_field('conditions', 'procedures', 'Procédures / Consignes', 'textarea', 8, 'procedures');

-- ── Seed standard fields — Section: perks ──
SELECT public.seed_mission_field('perks', 'perks', 'Avantages offerts', 'checklist', 1, 'perks', false, 'Coche les avantages proposés aux bénévoles', NULL,
  '[{"value":"meal","label":"Repas fourni","emoji":"🍽️"},{"value":"drinks","label":"Boissons / Snacks","emoji":"🥤"},{"value":"entry","label":"Entrée offerte","emoji":"🎫"},{"value":"goodies","label":"Goodies","emoji":"🎁"},{"value":"badge","label":"Badge de participation","emoji":"🏅"},{"value":"public_thanks","label":"Remerciement public","emoji":"🙏"}]'::jsonb,
  NULL, 'public'
);

-- ── Seed standard fields — Section: application ──
SELECT public.seed_mission_field('application', 'application_mode', 'Mode de candidature', 'select', 1, 'application_mode', false, NULL, NULL,
  '[{"value":"open","label":"Candidature libre"},{"value":"manual","label":"Validation manuelle"},{"value":"invitation_only","label":"Sur invitation uniquement"}]'::jsonb,
  '"open"'::jsonb, 'public'
);
SELECT public.seed_mission_field('application', 'is_public', 'Mission publique', 'boolean', 2, 'is_public', false, 'Visible dans l''appel à participation', NULL, '[]', 'true');
SELECT public.seed_mission_field('application', 'application_deadline', 'Date limite candidature', 'datetime', 3, 'application_deadline', false, NULL, NULL, '[]', NULL, 'public');
SELECT public.seed_mission_field('application', 'application_message', 'Message après candidature', 'textarea', 4, 'application_message', false, 'Message automatique envoyé après candidature');
SELECT public.seed_mission_field('application', 'required_documents', 'Documents demandés', 'tags', 5, 'required_documents');

-- ── Seed standard fields — Section: internal ──
SELECT public.seed_mission_field('internal', 'notes', 'Notes privées staff', 'textarea', 1, 'notes', false, 'Visible uniquement par les admins');
SELECT public.seed_mission_field('internal', 'internal_checklist', 'Checklist interne', 'checklist', 2, 'internal_checklist');
SELECT public.seed_mission_field('internal', 'preparation_status', 'Statut de préparation', 'select', 3, 'preparation_status', false, NULL, NULL,
  '[{"value":"not_started","label":"Non commencé"},{"value":"in_progress","label":"En cours"},{"value":"ready","label":"Prêt"},{"value":"blocked","label":"Bloqué"}]'::jsonb,
  '"not_started"'::jsonb
);
SELECT public.seed_mission_field('internal', 'risks', 'Risques / Points d''attention', 'textarea', 4, 'risks');

-- Cleanup seed functions
DROP FUNCTION IF EXISTS public.seed_mission_section(text, text, text, text, integer, boolean);
DROP FUNCTION IF EXISTS public.seed_mission_field(text, text, text, text, integer, text, boolean, text, text, jsonb, jsonb, text);


-- ============================================================
-- RÉCAPITULATIF MISSION SCHEMA V1
-- ============================================================
--
-- COLONNES AJOUTÉES à volunteer_missions (30+) :
--   Section 1: mission_type, mission_subtype, secondary_poles, location_detail, summary
--   Section 2: slots_min, slots_max, suitable_for_beginners, suitable_for_minors, contact_id
--   Section 3: optional_skills, trainable_skills
--   Section 4: setup_start_at, teardown_end_at, briefing_minutes, break_minutes, confirmation_deadline
--   Section 5: briefing_required, dress_code, equipment_provided, equipment_required,
--              physical_requirements, autonomy_level, constraints_text, procedures
--   Section 6: perks (jsonb)
--   Section 7: application_mode, is_public, application_deadline, application_message, required_documents
--   Section 8: internal_checklist, preparation_status, risks
--   Meta: template_id, custom_data
--
-- TABLES CRÉÉES :
--   mission_schema_sections  — 8 sections système préremplies
--   mission_schema_fields    — 50+ champs système mappés sur colonnes natives
--   mission_templates        — templates réutilisables avec valeurs pré-remplies
--
-- SEED DATA :
--   8 sections système (general, staffing, skills, schedule, conditions, perks, application, internal)
--   50+ champs système avec types, options, labels, helpers
--
-- RLS :
--   Sections/Fields : lecture par membres, écriture par admins asso ou super admin
--   Templates : lecture par membres + globaux publics, écriture par admins
