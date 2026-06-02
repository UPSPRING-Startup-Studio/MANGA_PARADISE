-- ============================================================
-- SEED : Definition du formulaire Manga Paradise 2025-2026
--
-- Insere la definition complete du bulletin d'adhesion
-- dans membership_form_definitions pour l'association
-- Manga Paradise (retrouvee par slug).
--
-- IDEMPOTENT : ON CONFLICT DO UPDATE
-- ============================================================

DO $$
DECLARE
  v_asso_id uuid;
  v_form_def jsonb;
BEGIN
  -- Retrouver l'association Manga Paradise par slug
  SELECT id INTO v_asso_id
  FROM public.associations
  WHERE slug = 'manga-paradise'
  LIMIT 1;

  -- Si l'association n'existe pas, on skip silencieusement
  IF v_asso_id IS NULL THEN
    RAISE NOTICE 'Association manga-paradise introuvable. Seed skip.';
    RETURN;
  END IF;

  -- La definition JSONB complete (steps, description, links, etc.)
  v_form_def := '{
    "description": "Bienvenue chez Manga Paradise ! Ce formulaire te permet d''adherer a notre association pour la saison 2025-2026. Il prend environ 5 a 10 minutes.\n\nAvant de commencer, assure-toi d''avoir lu notre reglement interieur et notre politique de protection des donnees.",
    "estimatedDuration": "5 a 10 minutes",
    "links": [
      {"label": "Reglement interieur", "url": "/docs/reglement"},
      {"label": "Politique RGPD", "url": "/docs/rgpd"},
      {"label": "Politique d''accueil et inclusion", "url": "/docs/inclusion"}
    ],
    "steps": [
      {
        "id": "preambule",
        "title": "Bienvenue",
        "description": "Avant de commencer, aide-nous a adapter le formulaire a ta situation.",
        "fields": [
          {"key": "_info_preambule", "type": "paragraph", "content": "Manga Paradise est une association loi 1901 basee a Nice, dediee a la pop culture japonaise : manga, anime, cosplay, gaming et bien plus.\n\nCe bulletin d''adhesion nous permet de t''accueillir dans les meilleures conditions et de mieux connaitre tes centres d''interet."},
          {"key": "_pathway", "type": "radio", "label": "Le futur membre a-t-il 18 ans ou plus ?", "options": [{"value": "major", "label": "Oui, je suis majeur·e", "description": "J''ai 18 ans ou plus au moment de l''adhesion"}, {"value": "minor", "label": "Non, le futur membre est mineur·e", "description": "Le formulaire devra etre rempli par un representant legal"}], "validation": {"required": true, "requiredMessage": "Merci d''indiquer si le membre est majeur ou mineur"}}
        ]
      },
      {
        "id": "major-identity",
        "title": "Informations personnelles",
        "description": "Tes coordonnees de base pour l''adhesion.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "major"}]},
        "fields": [
          {"key": "civilite", "type": "select", "label": "Civilite", "placeholder": "Choisir...", "options": [{"value": "m", "label": "Monsieur"}, {"value": "mme", "label": "Madame"}, {"value": "autre", "label": "Autre / Ne souhaite pas preciser"}], "gridSpan": 0.5},
          {"key": "last_name", "type": "text", "label": "Nom", "placeholder": "Ton nom de famille", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "first_name", "type": "text", "label": "Prenom", "placeholder": "Ton prenom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "birth_date", "type": "date", "label": "Date de naissance", "validation": {"required": true, "minAge": 18}, "gridSpan": 0.5},
          {"key": "pseudo", "type": "text", "label": "Pseudonyme / surnom", "placeholder": "Comment tu veux qu''on t''appelle", "helpText": "Facultatif, mais utile pour la communaute"},
          {"key": "email", "type": "email", "label": "Adresse email", "placeholder": "ton@email.com", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "phone", "type": "tel", "label": "Telephone", "placeholder": "06 XX XX XX XX", "gridSpan": 0.5},
          {"key": "city", "type": "text", "label": "Ville", "placeholder": "Ta ville de residence", "validation": {"required": true}}
        ]
      },
      {
        "id": "major-profile",
        "title": "Profil communautaire",
        "description": "Aide-nous a mieux te connaitre pour te proposer les activites qui te correspondent.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "major"}]},
        "fields": [
          {"key": "interests", "type": "checkbox-group", "label": "Tes centres d''interet", "helpText": "Coche tout ce qui t''interesse", "options": [{"value": "manga", "label": "Manga"}, {"value": "anime", "label": "Anime"}, {"value": "cosplay", "label": "Cosplay"}, {"value": "gaming", "label": "Jeux video"}, {"value": "jpop", "label": "J-Pop / J-Rock"}, {"value": "cuisine", "label": "Cuisine japonaise"}, {"value": "langue", "label": "Langue japonaise"}, {"value": "dessin", "label": "Dessin / Illustration"}, {"value": "figurines", "label": "Figurines / Collection"}, {"value": "lightnovel", "label": "Light Novels"}, {"value": "culture", "label": "Culture & Histoire du Japon"}], "validation": {"required": true, "requiredMessage": "Selectionne au moins un centre d''interet"}},
          {"key": "favorite_manga", "type": "text", "label": "Ton manga / anime prefere", "placeholder": "One Piece, Naruto, Demon Slayer..."},
          {"key": "is_cosplayer", "type": "radio", "label": "Fais-tu du cosplay ?", "options": [{"value": "oui", "label": "Oui"}, {"value": "non", "label": "Non"}, {"value": "curieux", "label": "Pas encore, mais je suis curieux·se"}]},
          {"key": "is_gamer", "type": "radio", "label": "Es-tu gamer ?", "options": [{"value": "oui", "label": "Oui"}, {"value": "non", "label": "Non"}, {"value": "casual", "label": "Occasionnellement"}]},
          {"key": "discord_username", "type": "text", "label": "Pseudo Discord", "placeholder": "TonPseudo#1234", "helpText": "Pour rejoindre notre serveur communautaire"},
          {"key": "participation_wishes", "type": "checkbox-group", "label": "Je souhaite participer a...", "options": [{"value": "evenements", "label": "Participer aux evenements"}, {"value": "benevolat", "label": "Devenir benevole"}, {"value": "staff", "label": "Rejoindre le staff"}, {"value": "ateliers", "label": "Participer ou animer des ateliers"}, {"value": "contenu", "label": "Creer du contenu (photos, videos, articles)"}, {"value": "tournois", "label": "Participer aux tournois gaming"}]}
        ]
      },
      {
        "id": "major-health",
        "title": "Sante & accessibilite",
        "description": "Ces informations restent strictement confidentielles.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "major"}]},
        "fields": [
          {"key": "has_accessibility_needs", "type": "radio", "label": "As-tu des besoins particuliers en termes d''accessibilite ?", "options": [{"value": "non", "label": "Non"}, {"value": "oui", "label": "Oui, j''ai des besoins specifiques"}]},
          {"key": "accessibility_details", "type": "textarea", "label": "Precisions sur tes besoins d''accessibilite", "placeholder": "Decris tes besoins...", "visibleWhen": {"conditions": [{"field": "has_accessibility_needs", "operator": "equals", "value": "oui"}]}},
          {"key": "health_info", "type": "textarea", "label": "Informations de sante utiles (facultatif)", "placeholder": "Allergies, traitements...", "helpText": "Facultatif."},
          {"key": "_emergency_heading", "type": "heading", "label": "Personne a contacter en cas d''urgence"},
          {"key": "emergency_name", "type": "text", "label": "Nom & prenom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "emergency_phone", "type": "tel", "label": "Telephone", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "emergency_relation", "type": "text", "label": "Lien (conjoint, parent, ami...)", "gridSpan": 0.5}
        ]
      },
      {
        "id": "major-payment",
        "title": "Cotisation",
        "description": "La cotisation annuelle est de 15 euros pour la saison 2025-2026.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "major"}]},
        "fields": [
          {"key": "payment_method", "type": "radio", "label": "Mode de paiement", "options": [{"value": "helloasso", "label": "HelloAsso (carte bancaire en ligne)"}, {"value": "virement", "label": "Virement bancaire"}, {"value": "cheque", "label": "Cheque"}, {"value": "especes", "label": "Especes"}], "validation": {"required": true}},
          {"key": "payment_cash_person", "type": "text", "label": "A qui remets-tu la cotisation ?", "placeholder": "Nom du membre du bureau", "visibleWhen": {"conditions": [{"field": "payment_method", "operator": "equals", "value": "especes"}]}, "validation": {"required": true}},
          {"key": "_divider_reglement", "type": "divider"},
          {"key": "accept_reglement", "type": "consent", "label": "J''ai lu et j''accepte le reglement interieur de Manga Paradise", "content": "Le reglement interieur definit les regles de vie commune.", "validation": {"required": true, "requiredMessage": "Tu dois accepter le reglement interieur"}},
          {"key": "accept_charte", "type": "consent", "label": "Je m''engage a respecter la charte des membres", "validation": {"required": true, "requiredMessage": "Tu dois accepter la charte"}}
        ]
      },
      {
        "id": "major-consents",
        "title": "Consentements & signature",
        "description": "Derniere etape ! Gere tes preferences de communication et signe ton adhesion.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "major"}]},
        "fields": [
          {"key": "consent_rgpd", "type": "consent", "label": "J''autorise Manga Paradise a traiter mes donnees personnelles", "content": "Conformement au RGPD, tes donnees sont collectees uniquement pour la gestion de ton adhesion.", "validation": {"required": true, "requiredMessage": "Le consentement RGPD est obligatoire"}},
          {"key": "consent_annuaire", "type": "consent", "label": "J''accepte d''apparaitre dans l''annuaire interne des membres"},
          {"key": "consent_email", "type": "consent", "label": "J''accepte de recevoir les communications par email"},
          {"key": "consent_discord", "type": "consent", "label": "J''accepte de recevoir les notifications sur Discord"},
          {"key": "image_rights", "type": "radio", "label": "Droit a l''image", "helpText": "Les photos prises lors de nos evenements peuvent etre publiees.", "options": [{"value": "oui_total", "label": "Oui, sans restriction"}, {"value": "oui_groupe", "label": "Oui, uniquement photos de groupe"}, {"value": "non", "label": "Non, je refuse"}], "validation": {"required": true}},
          {"key": "_divider_signature", "type": "divider"},
          {"key": "signature_member", "type": "signature", "label": "Signature electronique", "helpText": "En signant, tu confirmes l''exactitude des informations.", "validation": {"required": true, "requiredMessage": "La signature est obligatoire"}}
        ]
      },
      {
        "id": "minor-intro",
        "title": "Information importante",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "_minor_intro_text", "type": "paragraph", "content": "Ce formulaire doit etre rempli par le parent ou tuteur legal du mineur souhaitant adherer a Manga Paradise."}
        ]
      },
      {
        "id": "minor-guardian",
        "title": "Responsable legal",
        "description": "Vos informations en tant que representant legal.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "guardian_last_name", "type": "text", "label": "Nom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "guardian_first_name", "type": "text", "label": "Prenom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "guardian_email", "type": "email", "label": "Email", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "guardian_phone", "type": "tel", "label": "Telephone", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "guardian_address", "type": "text", "label": "Adresse postale", "validation": {"required": true}},
          {"key": "guardian_relation", "type": "select", "label": "Lien de parente", "options": [{"value": "pere", "label": "Pere"}, {"value": "mere", "label": "Mere"}, {"value": "tuteur", "label": "Tuteur legal"}, {"value": "autre", "label": "Autre"}], "validation": {"required": true}},
          {"key": "guardian_confirm", "type": "consent", "label": "Je confirme agir en qualite de representant legal", "validation": {"required": true}}
        ]
      },
      {
        "id": "minor-authorization",
        "title": "Autorisation parentale",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "_auth_text", "type": "paragraph", "content": "En cochant la case ci-dessous, vous autorisez votre enfant a adherer a Manga Paradise."},
          {"key": "minor_last_name_auth", "type": "text", "label": "Nom du mineur", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "minor_first_name_auth", "type": "text", "label": "Prenom du mineur", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "parental_authorization", "type": "consent", "label": "J''autorise mon enfant a adherer a Manga Paradise", "validation": {"required": true, "requiredMessage": "L''autorisation parentale est obligatoire"}}
        ]
      },
      {
        "id": "minor-identity",
        "title": "Informations du mineur",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "minor_last_name", "type": "text", "label": "Nom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "minor_first_name", "type": "text", "label": "Prenom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "minor_birth_date", "type": "date", "label": "Date de naissance", "validation": {"required": true}},
          {"key": "minor_pseudo", "type": "text", "label": "Pseudonyme / surnom", "helpText": "Facultatif"},
          {"key": "minor_civilite", "type": "select", "label": "Genre / Civilite", "options": [{"value": "m", "label": "Masculin"}, {"value": "f", "label": "Feminin"}, {"value": "autre", "label": "Autre"}]},
          {"key": "minor_email", "type": "email", "label": "Email du mineur (facultatif)"},
          {"key": "minor_phone", "type": "tel", "label": "Telephone du mineur (facultatif)"}
        ]
      },
      {
        "id": "minor-profile",
        "title": "Profil du mineur",
        "description": "Aidez-nous a mieux connaitre les interets de votre enfant.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "minor_interests", "type": "checkbox-group", "label": "Centres d''interet", "options": [{"value": "manga", "label": "Manga"}, {"value": "anime", "label": "Anime"}, {"value": "cosplay", "label": "Cosplay"}, {"value": "gaming", "label": "Jeux video"}, {"value": "jpop", "label": "J-Pop / J-Rock"}, {"value": "cuisine", "label": "Cuisine japonaise"}, {"value": "langue", "label": "Langue japonaise"}, {"value": "dessin", "label": "Dessin / Illustration"}, {"value": "figurines", "label": "Figurines / Collection"}, {"value": "lightnovel", "label": "Light Novels"}, {"value": "culture", "label": "Culture & Histoire du Japon"}]},
          {"key": "minor_participation", "type": "checkbox-group", "label": "Envies de participation", "options": [{"value": "evenements", "label": "Participer aux evenements"}, {"value": "benevolat", "label": "Devenir benevole"}, {"value": "staff", "label": "Rejoindre le staff"}, {"value": "ateliers", "label": "Participer ou animer des ateliers"}, {"value": "contenu", "label": "Creer du contenu"}, {"value": "tournois", "label": "Participer aux tournois gaming"}]}
        ]
      },
      {
        "id": "minor-health",
        "title": "Sante & accessibilite",
        "description": "Informations strictement confidentielles.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "minor_allergies", "type": "textarea", "label": "Allergies connues", "placeholder": "Lister les allergies si applicable..."},
          {"key": "minor_health_info", "type": "textarea", "label": "Informations de sante utiles", "placeholder": "Traitements, precautions..."},
          {"key": "minor_has_accessibility", "type": "radio", "label": "Besoins particuliers en termes d''accessibilite ?", "options": [{"value": "non", "label": "Non"}, {"value": "oui", "label": "Oui"}]},
          {"key": "minor_accessibility_details", "type": "textarea", "label": "Precisions", "visibleWhen": {"conditions": [{"field": "minor_has_accessibility", "operator": "equals", "value": "oui"}]}},
          {"key": "_minor_emergency_heading", "type": "heading", "label": "Personne a prevenir en urgence"},
          {"key": "minor_emergency_name", "type": "text", "label": "Nom & prenom", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "minor_emergency_phone", "type": "tel", "label": "Telephone", "validation": {"required": true}, "gridSpan": 0.5},
          {"key": "consent_inclusion", "type": "consent", "label": "J''ai pris connaissance de la politique d''accueil et d''inclusion", "validation": {"required": true}}
        ]
      },
      {
        "id": "minor-rgpd",
        "title": "Protection des donnees (RGPD)",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "_rgpd_text", "type": "paragraph", "content": "Conformement au RGPD, les donnees personnelles de votre enfant sont collectees uniquement pour la gestion associative."},
          {"key": "consent_rgpd_minor", "type": "consent", "label": "J''autorise le traitement des donnees personnelles de mon enfant", "validation": {"required": true, "requiredMessage": "Le consentement RGPD est obligatoire"}}
        ]
      },
      {
        "id": "minor-image",
        "title": "Droit a l''image",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "_image_text", "type": "paragraph", "content": "Lors des evenements, des photos et videos peuvent etre realisees et publiees."},
          {"key": "minor_image_rights", "type": "radio", "label": "Autorisez-vous la captation d''images de votre enfant ?", "options": [{"value": "oui_total", "label": "Oui, sans restriction"}, {"value": "oui_groupe", "label": "Oui, uniquement photos de groupe"}, {"value": "non", "label": "Non, je refuse"}], "validation": {"required": true}}
        ]
      },
      {
        "id": "minor-responsibility",
        "title": "Responsabilite",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "_responsibility_text", "type": "paragraph", "content": "L''association assure l''encadrement pendant les activites officielles. En dehors, la responsabilite revient aux parents."},
          {"key": "accept_responsibility", "type": "consent", "label": "Je reconnais avoir pris connaissance des regles de responsabilite", "validation": {"required": true}}
        ]
      },
      {
        "id": "minor-payment",
        "title": "Cotisation & validation",
        "description": "La cotisation annuelle est de 15 euros pour la saison 2025-2026.",
        "visibleWhen": {"conditions": [{"field": "_pathway", "operator": "equals", "value": "minor"}]},
        "fields": [
          {"key": "payment_method", "type": "radio", "label": "Mode de paiement", "options": [{"value": "helloasso", "label": "HelloAsso"}, {"value": "virement", "label": "Virement bancaire"}, {"value": "cheque", "label": "Cheque"}, {"value": "especes", "label": "Especes"}], "validation": {"required": true}},
          {"key": "payment_cash_person", "type": "text", "label": "A qui remettez-vous la cotisation ?", "placeholder": "Nom du membre du bureau", "visibleWhen": {"conditions": [{"field": "payment_method", "operator": "equals", "value": "especes"}]}, "validation": {"required": true}},
          {"key": "_divider_final", "type": "divider"},
          {"key": "accept_reglement_minor", "type": "consent", "label": "J''ai lu et j''accepte le reglement interieur", "validation": {"required": true}},
          {"key": "accept_charte_minor", "type": "consent", "label": "Je m''engage a ce que mon enfant respecte la charte", "validation": {"required": true}},
          {"key": "_divider_signature_minor", "type": "divider"},
          {"key": "signature_guardian", "type": "signature", "label": "Signature du responsable legal", "helpText": "En signant, vous confirmez l''exactitude des informations.", "validation": {"required": true, "requiredMessage": "La signature est obligatoire"}}
        ]
      }
    ]
  }'::jsonb;

  -- Upsert the form definition
  INSERT INTO public.membership_form_definitions (
    association_id, slug, name, season, version, status, definition, is_default
  )
  VALUES (
    v_asso_id,
    'adhesion-2025-2026',
    'Bulletin d''adhesion 2025-2026',
    '2025-2026',
    1,
    'published',
    v_form_def,
    true
  )
  ON CONFLICT (association_id, slug, version) DO UPDATE SET
    definition = EXCLUDED.definition,
    status = EXCLUDED.status,
    is_default = EXCLUDED.is_default,
    name = EXCLUDED.name,
    updated_at = now();

  RAISE NOTICE 'Formulaire Manga Paradise 2025-2026 insere/mis a jour.';
END $$;
