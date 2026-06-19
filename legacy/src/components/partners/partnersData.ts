/**
 * @deprecated Ce fichier contient des données hardcodées. L'annuaire public
 * utilise désormais usePublicProPartners() pour charger les données depuis
 * la table pro_partners en DB. Ce fichier est conservé comme fallback
 * temporaire tant que l'import des données en DB n'est pas complet.
 * Il sera supprimé lorsque les 80+ partenaires seront vérifiés en DB.
 */

// Configuration des catégories avec couleurs Tailwind Neo-Akiba
export const categories = {
  "tous": {
    id: "tous",
    emoji: "🌟",
    label: "Tous",
    textColor: "text-white",
    bgColor: "bg-white/10",
    borderColor: "border-white/20",
    glowColor: "shadow-white/20"
  },
  "acteurs-publics": {
    id: "acteurs-publics",
    emoji: "🏛️",
    label: "Acteurs publics",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/30"
  },
  "boutiques-librairies": {
    id: "boutiques-librairies",
    emoji: "🛍️",
    label: "Boutiques & librairies",
    textColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    glowColor: "shadow-pink-500/30"
  },
  "cinemas": {
    id: "cinemas",
    emoji: "🎬",
    label: "Cinémas",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    glowColor: "shadow-red-500/30"
  },
  "restauration": {
    id: "restauration",
    emoji: "🍱",
    label: "Restauration",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    glowColor: "shadow-orange-500/30"
  },
  "partenaires-associatifs": {
    id: "partenaires-associatifs",
    emoji: "🤝",
    label: "Partenaires associatifs",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/30"
  },
  "artistes-createurs": {
    id: "artistes-createurs",
    emoji: "🎨",
    label: "Artistes & Créateurs",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/30"
  },
  "evenements-lieux-culturels": {
    id: "evenements-lieux-culturels",
    emoji: "🎭",
    label: "Événements & lieux culturels",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    glowColor: "shadow-yellow-500/30"
  },
  "entreprises-marques": {
    id: "entreprises-marques",
    emoji: "🏢",
    label: "Entreprises & marques",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    glowColor: "shadow-cyan-500/30"
  }
};

export type CategoryKey = keyof typeof categories;

export interface Partner {
  name: string;
  category: CategoryKey;
  type: string;
  address: string;
  codePostal: string;
  ville: string;
  description: string;
  siteInternet: string;
  facebook: string;
  instagram: string;
  logo: string;
  member_benefit?: string;
  is_featured?: boolean;
}

// Données complètes des partenaires
export const partnersData: Record<string, Partner[]> = {
  "acteurs-publics": [
    {
      name: "Université Côte d'Azur",
      category: "acteurs-publics",
      type: "Université publique",
      address: "28 avenue Valrose",
      codePostal: "06000",
      ville: "Nice",
      description: "Enseignement supérieur, recherche",
      siteInternet: "https://univcotedazur.fr",
      facebook: "https://www.facebook.com/UnivCotedAzur",
      instagram: "https://www.instagram.com/univ_cotedazur/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940920/UCA_Logo_transparent_enj7po.png"
    },
    {
      name: "Crous Nice Toulon",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "26 route de Turin",
      codePostal: "06300",
      ville: "Nice",
      description: "Établissement public administratif (services étudiants)",
      siteInternet: "https://www.crous-nice.fr",
      facebook: "https://www.facebook.com/crousnicetoulon",
      instagram: "https://www.instagram.com/crousnicetoulon/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940934/Crous-logo-nice-toulon-rouge_40678_kywtzk.png"
    },
    {
      name: "Ville de Nice",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "5 Rue de l'Hôtel de ville",
      codePostal: "06000",
      ville: "Nice",
      description: "Collectivité territoriale / Mairie",
      siteInternet: "https://www.nice.fr",
      facebook: "https://www.facebook.com/VilledeNice",
      instagram: "https://www.instagram.com/villedenice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941335/LOGO_VILLE_DE_NICE_H_QUADRI_TNOIR_k3cloj.png"
    },
    {
      name: "Maison de l'Etudiant",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "5 avenue François Mitterrand",
      codePostal: "06300",
      ville: "Nice",
      description: "Lieu de référence d'informations, d'événements et de rencontres pour les étudiants",
      siteInternet: "https://etudiants.nice.fr",
      facebook: "https://www.facebook.com/lamdenice",
      instagram: "https://www.instagram.com/mde.nice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940892/298935342_102370315930771_999123045570238723_n_usrrrd.jpg"
    },
    {
      name: "Agis 06 - Cap Jeunesse",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "6 avenue Félix Faure",
      codePostal: "06000",
      ville: "Nice",
      description: "Information, accompagnement et animation pour les jeunes, soutien à la jeunesse locale",
      siteInternet: "https://cap-jeunesse.fr/",
      facebook: "https://www.facebook.com/capjeunesseca",
      instagram: "https://www.instagram.com/capjeunesseca/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941201/323768214_3766675103618083_1648418041499790129_n_wdydtc.jpg"
    },
    {
      name: "Bibliothèque de Nice",
      category: "acteurs-publics",
      type: "Bibliothèque municipale",
      address: "",
      codePostal: "",
      ville: "",
      description: "Bibliothèque, médiathèque, prêt de documents, activités culturelles",
      siteInternet: "https://bmvr.nice.fr",
      facebook: "https://www.facebook.com/bmvrNice",
      instagram: "https://www.instagram.com/bibnice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942053/Biblioth%C3%A8que_Nice_png_jh4obx.png"
    },
    {
      name: "Ville de Saint Laurent du Var",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "222 Esp. du Levant",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Collectivité territoriale / Mairie",
      siteInternet: "https://saintlaurentduvar.fr",
      facebook: "https://www.facebook.com/VilledeSaintLaurentduVar",
      instagram: "https://www.instagram.com/saintlaurentduvarofficiel/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941873/Mairie_Saint_Laurent_du_Var_lp3wst.png"
    },
    {
      name: "Ville de Peymeinade",
      category: "acteurs-publics",
      type: "Service public, institution",
      address: "11 Bd du Général de Gaulle",
      codePostal: "06530",
      ville: "Peymeinade",
      description: "Administration municipale",
      siteInternet: "https://www.peymeinade.fr",
      facebook: "https://peymeinade.fr",
      instagram: "https://www.instagram.com/villedepeymeinade/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941880/Mairie_de_Peymeinade_uuasnm.png"
    }
  ],
  "boutiques-librairies": [
    {
      name: "Librairie le Dojo",
      category: "boutiques-librairies",
      type: "Librairie",
      address: "3 Rue Alfred Mortier",
      codePostal: "06000",
      ville: "Nice",
      description: "Vente de mangas, de BD, d'accessoires, figurines, exclusivités, produits collectors et goodies japonais",
      siteInternet: "https://www.alfa-bd.fr",
      facebook: "https://www.facebook.com/librairieledojo",
      instagram: "https://www.instagram.com/ledojo_alfabd/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942891/Dojo_logo_png_ph5xgp.png"
    },
    {
      name: "GameCash",
      category: "boutiques-librairies",
      type: "Boutique spécialisée",
      address: "20 rue Jules Bianchi",
      codePostal: "06200",
      ville: "Nice",
      description: "Achat/vente jeux vidéo, consoles, produits dérivés, retrogaming, goodies, pop culture",
      siteInternet: "https://www.gamecash.fr/magasin-gamecash-nice-m182.html",
      facebook: "https://www.facebook.com/GamecashNice",
      instagram: "https://www.instagram.com/gamecashnice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941893/gamecash_nice_png_ebdgxb.png"
    },
    {
      name: "AltF4",
      category: "boutiques-librairies",
      type: "Bar e-sport",
      address: "20 Rue Jules Bianchi",
      codePostal: "06200",
      ville: "Nice",
      description: "Espace bar-gaming et restauration dédié au jeu vidéo sur PC et consoles",
      siteInternet: "https://altf4esportnice.my.canva.site",
      facebook: "",
      instagram: "https://www.instagram.com/altf4esport.nice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942960/AltF4_png_carre_wfzq8w.png"
    },
    {
      name: "Otak",
      category: "boutiques-librairies",
      type: "Librairie",
      address: "51 Bd Carnot",
      codePostal: "06400",
      ville: "Cannes",
      description: "Librairie spécialisée (manga, produits dérivés japonais, figurines, jeux)",
      siteInternet: "https://www.otak.fr",
      facebook: "https://www.facebook.com/people/Otak/61552497625212/",
      instagram: "https://www.instagram.com/otak.fr/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941120/logo_OTAK_png_r703hm.png"
    },
    {
      name: "Librairie Dernier Rempart",
      category: "boutiques-librairies",
      type: "Librairie",
      address: "10 avenue Robert Soleau",
      codePostal: "06600",
      ville: "Antibes",
      description: "Vente de mangas, BD, romans, jeux de société",
      siteInternet: "https://www.dernier-rempart.com",
      facebook: "https://www.facebook.com/DernierRempartJeuxMangas",
      instagram: "https://www.instagram.com/dernier_rempart_jeux_et_mangas/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942322/277817211_398045322325403_7558863940638545694_n_s5cetg.jpg"
    },
    {
      name: "Librairie du Cap",
      category: "boutiques-librairies",
      type: "Librairie",
      address: "217 Av. Eugène Donadeï",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Vente de mangas, BD, comics, jeux de sociétés, figurines, littérature jeunesse et produits dérivés",
      siteInternet: "https://www.librairieducap.com",
      facebook: "https://www.facebook.com/profile.php?id=100093576970578",
      instagram: "https://www.instagram.com/librairieducap/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752945812/347425391_115746764887889_2704080071050670586_n_ed1ddt.jpg"
    },
    {
      name: "Galerie TCG",
      category: "boutiques-librairies",
      type: "Boutique spécialisée",
      address: "22 Rue Valazé",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Boutique spécialisée cartes à collectionner (TCG) et goodies",
      siteInternet: "https://voggt.com/profiles/857653",
      facebook: "",
      instagram: "https://www.instagram.com/galerie_tcg/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752952159/Galerie_TCG_carre_png_p4cvbf.png"
    },
    {
      name: "Cosplay Smart",
      category: "boutiques-librairies",
      type: "Boutique en ligne",
      address: "",
      codePostal: "",
      ville: "",
      description: "Vente de matériaux, accessoires et produits pour la création de costumes de cosplay",
      siteInternet: "https://cosplaysmart.com",
      facebook: "https://www.facebook.com/cosplaysmart",
      instagram: "https://www.instagram.com/cosplaysmartfr/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942241/331531523_1364229837452812_510241111470137358_n_mlznld.jpg"
    },
    {
      name: "Cash Express Nice",
      category: "boutiques-librairies",
      type: "Achat/vente d'occasion",
      address: "29 avenue Malaussena",
      codePostal: "06000",
      ville: "Nice",
      description: "Achat et revente d'accessoires, jeux vidéo, high-tech, téléphonie, bijoux, multimédia et autres produits d'occasion",
      siteInternet: "https://www.cashexpress.fr",
      facebook: "https://www.facebook.com/cashexpressnice",
      instagram: "https://www.instagram.com/cashexpressnice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942134/292359442_501260321799855_3884853220252512207_n_b9ghlr.jpg"
    }
  ],
  "cinemas": [
    {
      name: "Cinéma Variétés",
      category: "cinemas",
      type: "Cinéma",
      address: "5 boulevard Victor Hugo",
      codePostal: "06000",
      ville: "Nice",
      description: "Exploitation de salles de cinéma, distribution de films",
      siteInternet: "https://www.cinemavarietes.fr",
      facebook: "https://www.facebook.com/cinemavarietesnice",
      instagram: "https://www.instagram.com/cinemavarietesnice/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752943116/Cin%C3%A9ma_Vari%C3%A9t%C3%A9s_png_hc8job.png"
    },
    {
      name: "Cineum Cannes",
      category: "cinemas",
      type: "Cinéma",
      address: "230 avenue Francis Tonner",
      codePostal: "06150",
      ville: "Cannes",
      description: "Exploitation de salles de cinéma, distribution de films",
      siteInternet: "https://www.cineum.fr",
      facebook: "https://www.facebook.com/cineumcannes",
      instagram: "https://www.instagram.com/cineumcannes/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940985/298561427_551651333413435_5087063078027658426_n_eslddl.jpg"
    },
    {
      name: "Pathé – Nice Gare du Sud",
      category: "cinemas",
      type: "Cinéma",
      address: "Gare du Sud",
      codePostal: "06000",
      ville: "Nice",
      description: "Exploitation de salles de cinéma, distribution de films",
      siteInternet: "https://www.pathe.fr/cinemas/cinema-pathe-gare-du-sud",
      facebook: "https://www.facebook.com/PatheGareDuSud",
      instagram: "https://www.instagram.com/pathe.garedusud/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752943095/path%C3%A9_carre_kqr9ap.png"
    },
    {
      name: "Eurozoom",
      category: "cinemas",
      type: "Distributeur",
      address: "",
      codePostal: "",
      ville: "",
      description: "Distribution de films d'animation (japonais, européen)",
      siteInternet: "https://www.eurozoom.fr",
      facebook: "https://www.facebook.com/eurozoom.distributeur",
      instagram: "https://www.instagram.com/eurozoomcinema/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940880/Logo-Eurozoom_hbboht.png"
    }
  ],
  "artistes-createurs": [
    {
      name: "Joel Lange",
      category: "artistes-createurs",
      type: "Auteur / Mangaka",
      address: "",
      codePostal: "",
      ville: "",
      description: "Auteur Mangaka Les Aventuriers de Novagorone",
      siteInternet: "https://www.neiko-editions.com",
      facebook: "https://www.facebook.com/joellangeartiste1",
      instagram: "https://www.instagram.com/joellange_artiste/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953374/joel_lange_logo_carre_gtjsi2.png"
    },
    {
      name: "MeanCatTV",
      category: "artistes-createurs",
      type: "Streamer / Créateur de contenu",
      address: "",
      codePostal: "",
      ville: "",
      description: "Artistes reprenant génériques d'anime interprétés en live, musiques originales, discussions pop culture",
      siteInternet: "https://eliminate.fr/categorie-produit/meancattv/",
      facebook: "https://www.twitch.tv/meancattv",
      instagram: "https://www.instagram.com/meancattv/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953498/MeanCatTV_logo_carre_w3fund.png"
    },
    {
      name: "Fantaisie de Naty",
      category: "artistes-createurs",
      type: "Artiste créateur indépendant",
      address: "",
      codePostal: "",
      ville: "",
      description: "Créations fait main inspirées du fantastique, des fées, du steampunk et de l'univers elfique : bijoux, diadèmes",
      siteInternet: "https://www.etsy.com/fr/shop/FantaisieDeNaty",
      facebook: "https://www.facebook.com/fantaisiedenaty",
      instagram: "https://www.instagram.com/fantaisiedenaty",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953226/Fantaisie_de_Naty_carre_bjepmw.png"
    },
    {
      name: "Frimousserie",
      category: "artistes-createurs",
      type: "Artiste créateur indépendant",
      address: "",
      codePostal: "",
      ville: "",
      description: "Créations artisanales en bois sculpté, ficelle et matières naturelles à thèmes fantasy, médiéval, geek et nature",
      siteInternet: "https://www.etsy.com/fr/shop/Boisetficelle",
      facebook: "https://www.facebook.com/boisetficelle",
      instagram: "https://www.instagram.com/la.frimousserie/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953234/Frimousserie_carre_gwv80t.png"
    },
    {
      name: "Fur'Sud Est",
      category: "artistes-createurs",
      type: "Association déclarée",
      address: "",
      codePostal: "",
      ville: "",
      description: "Organisation de meetups, furs-meets, animations communautaires autour du fandom furry",
      siteInternet: "https://fursudest.fr",
      facebook: "",
      instagram: "https://www.instagram.com/fur.sud.est/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752952632/Logo_Fur_Sud_Est_carre_isti8k.png"
    },
    {
      name: "Pimp My Retrogame",
      category: "artistes-createurs",
      type: "Boutique de retrogaming",
      address: "",
      codePostal: "",
      ville: "",
      description: "Personnalisation de consoles rétro, modding, stickers et accessoires geek faits main.",
      siteInternet: "https://www.vinted.fr/member/207524410-pimpmyretrogame",
      facebook: "",
      instagram: "https://www.instagram.com/pimpmyretrogame/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953305/Logo_pimpmyretrogame_uki2al.png"
    },
    {
      name: "Art'Cade Design",
      category: "artistes-createurs",
      type: "Artiste créateur indépendant",
      address: "",
      codePostal: "",
      ville: "",
      description: "Conception et personnalisation de bornes d'arcade rétro/multijeux",
      siteInternet: "https://www.artcadedesign.fr",
      facebook: "https://www.facebook.com/artcadedesign",
      instagram: "https://www.instagram.com/art_cade_design",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953633/Arcade_Design_carre_logo_qhtms3.png"
    }
  ],
  "evenements-lieux-culturels": [
    {
      name: "Play Azur Festival",
      category: "evenements-lieux-culturels",
      type: "Événement, festival",
      address: "",
      codePostal: "",
      ville: "",
      description: "Festival annuel autour de la culture pop, internet, science, invités YouTube, cosplay, jeux vidéo, animation japonaise, médiation scientifique et associative.",
      siteInternet: "https://playazur.fr",
      facebook: "https://www.facebook.com/search/top?q=play%20azur%20festival",
      instagram: "https://www.instagram.com/playazur/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752940905/Play_Azur_png_uofn9l.png"
    },
    {
      name: "Cap3000",
      category: "evenements-lieux-culturels",
      type: "Centre commercial",
      address: "217 Av. Eugène Donadeï",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Grand centre commercial en bord de mer, boutiques mode, loisirs, beauté & nombreux restaurants",
      siteInternet: "https://www.cap3000.com",
      facebook: "https://www.facebook.com/CentreCommercialCap3000",
      instagram: "https://www.instagram.com/cap3000_cotedazur/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752945622/Cap3000_png_ldu5xz.png"
    }
  ],
  "restauration": [
    {
      name: "Restaurant Otaku",
      category: "restauration",
      type: "Restaurant",
      address: "2 rue Paganini",
      codePostal: "06000",
      ville: "Nice",
      description: "Cuisine japonaise (bento, ramen, donburi, gyoza)",
      siteInternet: "",
      facebook: "https://www.facebook.com/OTAKUnice",
      instagram: "https://www.instagram.com/otakurestaurantjaponais/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941134/restaurant_OTAKU_png_zaruar.png"
    },
    {
      name: "Gare du Sud - Mediterraneo",
      category: "restauration",
      type: "Restaurant",
      address: "35 avenue Malaussena",
      codePostal: "06000",
      ville: "Nice",
      description: "Restauration sur le pouce de spécialités méditerranéennes, pizzas, pâtes, salades, desserts italiens",
      siteInternet: "https://mediterraneo-nice.com",
      facebook: "https://www.facebook.com/mediterraneonice",
      instagram: "https://www.instagram.com/mediterraneo_garedusud",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752943006/Mediterraneo_Gare_du_Sud_Png_tcxa8v.png"
    },
    {
      name: "Restaurant Panasia",
      category: "restauration",
      type: "Restaurant",
      address: "217 Av. Eugène Donadeï",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Cuisine asiatique haut de gamme : spécialités chinoises, thaïlandaises, vietnamiennes, japonaises avec un dressage moderne et des saveurs raffinées.",
      siteInternet: "https://www.panasia.fr",
      facebook: "https://www.facebook.com/restaurantpanasia/",
      instagram: "https://www.instagram.com/panasia.restaurant/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941841/Panasia_png_y6pi66.png"
    },
    {
      name: "Rice Street Cap3000",
      category: "restauration",
      type: "Restaurant",
      address: "217 Av. Eugène Donadeï",
      codePostal: "06700",
      ville: "Saint-Laurent-du-Var",
      description: "Restauration rapide aux saveurs asiatiques : rice bowls, yakitoris, street food d'inspiration japonaise, coréenne & fusion ; spécialités vegan dispo.",
      siteInternet: "https://www.ricestreet.fr",
      facebook: "https://www.facebook.com/ricestreet.fr",
      instagram: "https://www.instagram.com/rice_street_cap3000/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752941150/294740581_418313447010114_1186730966000261129_n_agw4cj.jpg"
    }
  ],
  "partenaires-associatifs": [
    {
      name: "Face06",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "9 rue d'Alsace Lorraine",
      codePostal: "06000",
      ville: "Nice",
      description: "Fédération des associations étudiantes, actions de solidarité étudiante, événements et accompagnement social",
      siteInternet: "https://face06.org",
      facebook: "https://www.facebook.com/face06nice",
      instagram: "https://www.instagram.com/face_06",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942864/Face06_png_xg4wom.png"
    },
    {
      name: "Eventasia",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "",
      codePostal: "",
      ville: "",
      description: "Cours Manga, Danse K-Pop et organisateur d'événements",
      siteInternet: "https://www.eventasia-asso.fr",
      facebook: "https://www.facebook.com/eventasiaassociation/",
      instagram: "https://www.instagram.com/eventasia.asso",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942899/logo_eventasia_carre_png_dupvjs.png"
    },
    {
      name: "Rigel E-Sport",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "",
      codePostal: "",
      ville: "",
      description: "Structure eSport basée sur Rocket League et Valorant sur Nice",
      siteInternet: "https://www.rigelesport.fr/home",
      facebook: "",
      instagram: "https://www.instagram.com/rigel.esport",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752942854/rigel_e_sport_logo_png_ouehhr.png"
    },
    {
      name: "Pokevents",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "",
      codePostal: "",
      ville: "",
      description: "Organisation d'événements et de tournois Pokémon (communauté vidéoludique)",
      siteInternet: "https://www.helloasso.com/associations/pokevents",
      facebook: "",
      instagram: "https://www.instagram.com/pokevents.officiel",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752944372/Pokevents_logo_png_carre_osmngq.png"
    },
    {
      name: "Ecole Tsubaki",
      category: "partenaires-associatifs",
      type: "Enseignement",
      address: "11 Rue Pertinax",
      codePostal: "06000",
      ville: "Nice",
      description: "Cours de japonais tous niveaux et ateliers culturels (art floral, calligraphie, kimono, origami)",
      siteInternet: "https://ecoletsubaki.fr",
      facebook: "https://www.facebook.com/ecoletsubaki",
      instagram: "https://www.instagram.com/ecoletsubaki",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752952646/Ecole_Tsubaki_tjtjwu.png"
    },
    {
      name: "The Cosplayeurs League",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "",
      codePostal: "",
      ville: "",
      description: "Association française de cosplay",
      siteInternet: "https://www.cosplayleague.fr",
      facebook: "https://www.facebook.com/cosplayersleague",
      instagram: "https://www.instagram.com/thecosplayersleague",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752953214/The_cosplayeurs_league_carre_veslhd.png"
    },
    {
      name: "Sharks d'Antibes",
      category: "partenaires-associatifs",
      type: "Club sportif (basketball)",
      address: "250 rue Émile Hugues",
      codePostal: "06600",
      ville: "Antibes",
      description: "Club professionnel de basketball",
      siteInternet: "https://www.sharks-antibes.com",
      facebook: "https://www.facebook.com/AntibesSharks",
      instagram: "https://www.instagram.com/antibessharks/",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1752944435/Sharks_carre_png_qnkwf2.png"
    },
    {
      name: "BDE Campus Valrose",
      category: "partenaires-associatifs",
      type: "Association déclarée",
      address: "28 Av. Valrose",
      codePostal: "06100",
      ville: "Nice",
      description: "Organise des événements festifs, culturels et sportifs pour animer la vie étudiante sur le campus",
      siteInternet: "https://bde-valrose1.odoo.com/",
      facebook: "https://www.facebook.com/bde.sciences.de.valrose",
      instagram: "https://www.instagram.com/bde_sciences_valrose",
      logo: "https://res.cloudinary.com/dkw8snibz/image/upload/v1762346900/images_3_tf5ehh.png"
    }
  ]
};

// Fonction pour optimiser l'URL Cloudinary avec compression
export const optimizeCloudinaryUrl = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  const optimization = '/w_200,h_200,c_fit,q_auto,f_auto/';
  if (url.includes('w_200,h_200,c_fit,q_auto,f_auto')) return url;
  
  return url.replace('/upload/', `/upload${optimization}`);
};
