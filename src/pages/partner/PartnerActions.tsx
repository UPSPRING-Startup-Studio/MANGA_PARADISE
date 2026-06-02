import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Palette, 
  Users, 
  Trophy, 
  Heart, 
  Eye,
  Star,
  MapPin,
  Target,
  CheckCircle2,
  ExternalLink,
  X
} from "lucide-react";

// Banner map for Cloudinary images
const getFormatBanner = (formatId: string): string => {
  const bannerMap: Record<string, string> = {
    "cosplay-garden": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532037/Banni%C3%A8re-ACTIONS-WEB-3_xlc3s8.jpg",
    "rave-party-cosplay": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532036/Banni%C3%A8re-ACTIONS-WEB-6_y82lxt.jpg",
    "manga-horror-night": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532036/BANNIERE-ACTIONS-WEB-4_vhuqoi.jpg",
    "cine-club-otaku": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532034/Banni%C3%A8re-ACTIONS-WEB-13_dntqni.jpg",
    "club-manga": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532035/Banni%C3%A8re-ACTIONS-WEB-12_a0jms1.jpg",
    "cap-manga": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532036/Banni%C3%A8re-ACTIONS-WEB-5_ebxdko.jpg",
    "pixel-art": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532036/Banni%C3%A8re-ACTIONS-WEB-7_if2rgo.jpg",
    "dessin-manga": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532035/Banni%C3%A8re-ACTIONS-WEB-11_jxnbat.jpg",
    "cosplay-maquillage": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753533258/Banni%C3%A8re-ACTIONS-WEB-14_kjfxsy.jpg",
    "masques-kitsune": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532035/Banni%C3%A8re-ACTIONS-WEB-11_jxnbat.jpg",
    "shooting-cosplay": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532037/Banni%C3%A8re-ACTIONS-WEB-1_miwart.jpg",
    "concours-cosplay": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532037/Banni%C3%A8re-ACTIONS-WEB-2_qpgbzj.jpg",
    "karaoke-anime": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753533363/Banni%C3%A8re-Actions-WEB-15_dlikdw.jpg",
    "quiz-blindtest": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532035/Banni%C3%A8re-ACTIONS-WEB-8_cy7o3i.jpg",
    "telethon": "https://res.cloudinary.com/dkw8snibz/image/upload/v1753532035/Banni%C3%A8re-ACTIONS-WEB-9_nv3qrj.jpg"
  };
  return bannerMap[formatId] || "";
};

// Gallery images map
const getFormatImages = (formatId: string): Array<{ src: string; alt: string; caption: string }> => {
  const imageMap: Record<string, Array<{ src: string; alt: string; caption: string }>> = {
    "cosplay-garden": [
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258638/Cosplay-Garden-WEB-1_dp52g0.jpg", alt: "Cosplay Garden 1", caption: "Défilé cosplay en plein air" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258638/Cosplay-Garden-WEB-2_sm50ny.jpg", alt: "Cosplay Garden 2", caption: "Ambiance familiale et créative" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258639/Cosplay-Garden-WEB-3_iuzymn.jpg", alt: "Cosplay Garden 3", caption: "Une communauté passionnée" }
    ],
    "rave-party-cosplay": [
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258649/Rave-Party-Cosplay-WEB-1_yqfski.jpg", alt: "Rave Party Cosplay 1", caption: "Soirée électro cosplay" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258649/Rave-Party-Cosplay-WEB-2_uqa8h7.jpg", alt: "Rave Party Cosplay 2", caption: "Ambiance nocturne" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258649/Rave-Party-Cosplay-WEB-3_stxrkl.jpg", alt: "Rave Party Cosplay 3", caption: "Performances sur scène" }
    ],
    "concours-cosplay": [
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258637/Concours-Cosplay-WEB-1_veg485.jpg", alt: "Concours Cosplay 1", caption: "Compétition scénique" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258638/Concours-Cosplay-WEB-2_awnaav.jpg", alt: "Concours Cosplay 2", caption: "Performances sur scène" },
      { src: "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258638/Concours-Cosplay-WEB-3_mdhwgj.jpg", alt: "Concours Cosplay 3", caption: "Talents valorisés" }
    ]
  };
  return imageMap[formatId] || [];
};

// Format data
interface FormatItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon: typeof Calendar;
  summary: string;
  description: string;
  tags: string[];
  objectives: string[];
  venues: string[];
  benefits: string[];
  targetAudience: string;
}

const allFormats: FormatItem[] = [
  // Événements publics & culturels
  {
    id: "cosplay-garden",
    name: "Cosplay Garden",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Défilé cosplay dans un cadre verdoyant et familial",
    description: "Un événement cosplay en plein air qui transforme les espaces verts en scène pour les passionnés de déguisement. Ambiance conviviale et accessible à tous.",
    tags: ["cosplay", "extérieur", "familles", "visibilité", "créativité"],
    objectives: ["Créer du lien intergénérationnel", "Valoriser la créativité locale"],
    venues: ["Parcs", "Jardins publics", "Espaces verts d'entreprise"],
    benefits: ["Présence visuelle forte", "Animation originale", "Public familial engagé"],
    targetAudience: "Familles, cosplayers amateurs et confirmés"
  },
  {
    id: "rave-party-cosplay",
    name: "Rave Party Cosplay",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Soirée électro avec performances cosplay immersives",
    description: "Fusion entre musique électronique et univers manga/anime avec performances cosplay sur scène. Ambiance nocturne et énergique.",
    tags: ["cosplay", "musique", "jeunes", "engagement", "spectacle"],
    objectives: ["Toucher un public jeune", "Créer un événement mémorable"],
    venues: ["Boîtes de nuit", "Salles de concert", "Festivals électro"],
    benefits: ["Visibilité auprès des 18-35 ans", "Buzz sur réseaux sociaux", "Animation unique"],
    targetAudience: "Jeunes adultes 18-35 ans, amateurs de musique électro"
  },
  {
    id: "manga-horror-night",
    name: "Manga Horror Night",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Soirée thématique horror manga avec projections et animations",
    description: "Événement nocturne autour des mangas d'horreur avec projections d'anime, concours cosplay horrifiques et ambiance immersive.",
    tags: ["horror", "cinéma", "jeunes", "spectacle", "thématique"],
    objectives: ["Proposer du contenu original", "Fidéliser une communauté spécialisée"],
    venues: ["Cinémas", "Centres culturels", "Librairies spécialisées"],
    benefits: ["Événement de niche à forte valeur", "Communauté passionnée", "Originalité garantie"],
    targetAudience: "Adolescents et jeunes adultes fans de manga horror"
  },
  {
    id: "cine-club-otaku",
    name: "Ciné-Club de l'Otaku",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Projections d'anime avec débats et rencontres communautaires",
    description: "Club de cinéma spécialisé dans les anime avec projections, débats, rencontres avec des professionnels et découverte de nouveautés.",
    tags: ["cinéma", "débat", "communauté", "découverte", "culture"],
    objectives: ["Développer la culture anime", "Créer une communauté locale"],
    venues: ["Cinéma Variétés", "Cineum", "Pathé", "Médiathèques"],
    benefits: ["Partenariat culturel de qualité", "Public fidèle", "Programmation régulière"],
    targetAudience: "Amateurs d'anime tous âges, cinéphiles curieux"
  },
  {
    id: "club-manga",
    name: "Club Manga",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Espace de lecture et d'échange autour des manga",
    description: "Club de lecture manga dans des espaces dédiés avec discussions, recommandations et découverte de nouveautés. Ambiance conviviale et pédagogique.",
    tags: ["lecture", "échange", "communauté", "découverte", "éducatif"],
    objectives: ["Promouvoir la lecture", "Créer du lien social"],
    venues: ["Le Dojo", "Librairies", "Médiathèques", "Centres sociaux"],
    benefits: ["Public captif et régulier", "Valorisation culturelle", "Animation hebdomadaire"],
    targetAudience: "Lecteurs de manga tous âges, familles"
  },
  {
    id: "cap-manga",
    name: "Cap Manga",
    category: "evenements-publics",
    categoryLabel: "Événements publics",
    icon: Calendar,
    summary: "Événement signature annuel de Manga Paradise",
    description: "Convention annuelle majeure organisée par Manga Paradise réunissant tous les formats : cosplay, stands, ateliers, spectacles et rencontres.",
    tags: ["convention", "signature", "grand public", "visibilité", "fédérateur"],
    objectives: ["Événement phare de l'association", "Rassembler toute la communauté"],
    venues: ["Palais des congrès", "Centres d'exposition", "Grandes salles"],
    benefits: ["Visibilité maximale", "Partenariat majeur", "Retombées médiatiques importantes"],
    targetAudience: "Grand public, familles, passionnés de culture japonaise"
  },
  // Ateliers créatifs & immersifs
  {
    id: "pixel-art",
    name: "Pixel Art",
    category: "ateliers-creatifs",
    categoryLabel: "Ateliers créatifs",
    icon: Palette,
    summary: "Création de motifs manga en perles à repasser",
    description: "Atelier créatif permettant de reproduire des personnages manga iconiques grâce aux perles à repasser. Activité accessible dès 6 ans.",
    tags: ["atelier", "créativité", "intergénérationnel", "manuel", "accessible"],
    objectives: ["Développer la créativité", "Activité familiale"],
    venues: ["Centres commerciaux", "Écoles", "Centres de loisirs", "Événements"],
    benefits: ["Co-branding sur créations", "Animation accessible", "Public familial"],
    targetAudience: "Enfants et familles, tous âges"
  },
  {
    id: "dessin-manga",
    name: "Dessin Manga",
    category: "ateliers-creatifs",
    categoryLabel: "Ateliers créatifs",
    icon: Palette,
    summary: "Initiation aux techniques de dessin manga",
    description: "Cours d'initiation au dessin manga avec apprentissage des bases : proportions, expressions, techniques d'encrage et mise en couleur.",
    tags: ["dessin", "apprentissage", "technique", "créativité", "éducatif"],
    objectives: ["Transmettre un savoir-faire", "Développer les talents artistiques"],
    venues: ["Écoles d'art", "Centres culturels", "Librairies", "Médiathèques"],
    benefits: ["Valorisation de l'apprentissage", "Activité éducative", "Créations personnalisées"],
    targetAudience: "Adolescents et adultes passionnés de dessin"
  },
  {
    id: "cosplay-maquillage",
    name: "Cosplay & Maquillage",
    category: "ateliers-creatifs",
    categoryLabel: "Ateliers créatifs",
    icon: Palette,
    summary: "Techniques de maquillage et création d'accessoires cosplay",
    description: "Atelier pratique d'initiation au cosplay : techniques de maquillage, création d'accessoires simples et conseils pour réussir ses costumes.",
    tags: ["cosplay", "maquillage", "technique", "transformation", "spectacle"],
    objectives: ["Démocratiser le cosplay", "Développer l'expression artistique"],
    venues: ["Magasins de cosmétiques", "Écoles", "Centres sociaux"],
    benefits: ["Animation originale", "Public engagé", "Potentiel viral"],
    targetAudience: "Adolescents et jeunes adultes, débutants en cosplay"
  },
  {
    id: "masques-kitsune",
    name: "Masques Kitsune",
    category: "ateliers-creatifs",
    categoryLabel: "Ateliers créatifs",
    icon: Palette,
    summary: "Création de masques traditionnels japonais en papier plié",
    description: "Atelier d'origami et décoration pour créer des masques Kitsune traditionnels. Découverte de la culture japonaise par la pratique.",
    tags: ["origami", "tradition", "culture japonaise", "manuel", "découverte"],
    objectives: ["Transmettre la culture japonaise", "Activité méditative"],
    venues: ["Centres culturels", "Écoles", "Festivals culturels"],
    benefits: ["Dimension culturelle forte", "Activité zen", "Créations emportables"],
    targetAudience: "Tous publics, amateurs de culture japonaise"
  },
  {
    id: "shooting-cosplay",
    name: "Shooting Photo Cosplay",
    category: "ateliers-creatifs",
    categoryLabel: "Ateliers créatifs",
    icon: Palette,
    summary: "Studio photo professionnel avec décors manga immersifs",
    description: "Séance photo professionnelle en costume avec décors thématiques manga/anime. Coaching pose et retouche inclus.",
    tags: ["photo", "studio", "professionnel", "souvenir", "spectacle"],
    objectives: ["Offrir une expérience premium", "Créer des souvenirs mémorables"],
    venues: ["Studios photo", "Centres commerciaux", "Conventions"],
    benefits: ["Service haut de gamme", "Viralité sur réseaux", "Partenariat premium"],
    targetAudience: "Cosplayers confirmés, couples, groupes d'amis"
  },
  // Soirées internes & vie associative
  {
    id: "soirees-theme",
    name: "Soirées à Thème",
    category: "soirees-internes",
    categoryLabel: "Soirées internes",
    icon: Users,
    summary: "Événements communautaires réservés aux membres",
    description: "Soirées privées organisées pour renforcer les liens entre membres : thèmes cosplay, anime, jeux vidéo, avec activités et animations dédiées.",
    tags: ["communauté", "privé", "thématique", "cohésion", "membres"],
    objectives: ["Fidéliser les membres", "Renforcer la communauté"],
    venues: ["Locaux associatifs", "Espaces privatisés"],
    benefits: ["Engagement communautaire renforcé"],
    targetAudience: "Membres actifs de Manga Paradise"
  },
  {
    id: "sorties-groupe",
    name: "Sorties Groupe",
    category: "soirees-internes",
    categoryLabel: "Soirées internes",
    icon: Users,
    summary: "Activités externes pour resserrer les liens",
    description: "Sorties organisées entre membres : restaurants, bars, escape games, cinéma, pour créer des liens en dehors du cadre associatif.",
    tags: ["sortie", "détente", "lien social", "convivialité", "externe"],
    objectives: ["Créer des amitiés durables", "Détente collective"],
    venues: ["Restaurants", "Bars", "Escape games", "Cinémas"],
    benefits: ["Cohésion d'équipe renforcée"],
    targetAudience: "Membres et bénévoles de l'association"
  },
  // Concours & animations participatives
  {
    id: "concours-cosplay",
    name: "Concours Cosplay Scénique",
    category: "concours-animations",
    categoryLabel: "Concours & animations participatives",
    icon: Trophy,
    summary: "Compétition cosplay avec performances sur scène",
    description: "Concours de cosplay avec défilé, mise en scène et jugement professionnel. Catégories débutant à expert avec prix et lots attractifs.",
    tags: ["concours", "scène", "compétition", "spectacle", "prix"],
    objectives: ["Valoriser les talents", "Créer de l'émulation"],
    venues: ["Scènes de festivals", "Théâtres", "Conventions"],
    benefits: ["Mise en avant des lots", "Temps fort de l'événement", "Viralité"],
    targetAudience: "Cosplayers de tous niveaux, spectateurs"
  },
  {
    id: "karaoke-anime",
    name: "Karaoké d'Anime",
    category: "concours-animations",
    categoryLabel: "Concours & animations participatives",
    icon: Trophy,
    summary: "Karaoké sur génériques et musiques d'anime populaires",
    description: "Animation karaoké spécialisée dans les génériques d'anime et musiques japonaises avec écrans thématiques et classements.",
    tags: ["karaoké", "musique", "anime", "participation", "convivial"],
    objectives: ["Animation participative", "Créer de l'ambiance"],
    venues: ["Bars", "Centres de loisirs", "Conventions", "Événements"],
    benefits: ["Animation clé en main", "Public participatif", "Ambiance garantie"],
    targetAudience: "Amateurs d'anime et de karaoké, tous âges"
  },
  {
    id: "quiz-blindtest",
    name: "Quiz & Blindtest",
    category: "concours-animations",
    categoryLabel: "Concours & animations participatives",
    icon: Trophy,
    summary: "Jeux de connaissance sur l'univers manga/anime",
    description: "Quiz interactifs et blindtest musicaux sur la culture manga/anime avec système de points et classements en temps réel.",
    tags: ["quiz", "connaissances", "interactif", "compétition", "culture"],
    objectives: ["Tester les connaissances", "Animation dynamique"],
    venues: ["Bars", "Centres culturels", "Écoles", "Événements"],
    benefits: ["Animation interactive", "Engagement du public", "Facilité d'organisation"],
    targetAudience: "Connaisseurs de manga/anime, groupes d'amis"
  },
  {
    id: "vr-cosplay",
    name: "VR Cosplay",
    category: "concours-animations",
    categoryLabel: "Concours & animations participatives",
    icon: Trophy,
    summary: "Expérience de réalité virtuelle dans des décors manga",
    description: "Nouveauté technologique : expérience VR immersive permettant de se retrouver dans des décors d'anime populaires en costume.",
    tags: ["vr", "technologie", "immersion", "innovation", "futuriste"],
    objectives: ["Proposer une expérience unique", "Attirer par l'innovation"],
    venues: ["Centres commerciaux", "Salons tech", "Conventions"],
    benefits: ["Innovation technologique", "Expérience mémorable", "Buzz médiatique"],
    targetAudience: "Technophiles, curieux de nouvelles expériences"
  },
  // Actions citoyennes & solidaires
  {
    id: "telethon",
    name: "Téléthon & Pièces Jaunes",
    category: "actions-citoyennes",
    categoryLabel: "Actions citoyennes & solidaires",
    icon: Heart,
    summary: "Participation aux grandes causes nationales",
    description: "Animations cosplay et ateliers lors d'événements caritatifs nationaux pour collecter des fonds et sensibiliser le public.",
    tags: ["caritatif", "solidarité", "national", "sensibilisation", "don"],
    objectives: ["Soutenir de grandes causes", "Valoriser l'engagement associatif"],
    venues: ["Hôpitaux", "Centres de collecte", "Espaces publics"],
    benefits: ["Valorisation RSE forte", "Communication positive", "Impact social"],
    targetAudience: "Grand public solidaire, familles sensibilisées"
  },
  {
    id: "hospital-cosplay",
    name: "Hospital Cosplay Project",
    category: "actions-citoyennes",
    categoryLabel: "Actions citoyennes & solidaires",
    icon: Heart,
    summary: "Animations pour enfants hospitalisés au Lenval",
    description: "Visites régulières en costume dans le service pédiatrique de l'hôpital Lenval pour apporter joie et réconfort aux enfants hospitalisés.",
    tags: ["hôpital", "enfants", "bénévolat", "joie", "thérapeutique"],
    objectives: ["Apporter du réconfort", "Soutenir les soignants"],
    venues: ["Hôpital pédiatrique Lenval", "Services de pédiatrie"],
    benefits: ["Impact émotionnel fort", "Valorisation humaine", "Partenariat médical"],
    targetAudience: "Enfants hospitalisés, personnels soignants, familles"
  }
];

// Categories configuration with Neo-Akiba colors
const categories: Record<string, { label: string; emoji: string; color: string; bgColor: string; glowColor: string }> = {
  "tous": {
    label: "Tous",
    emoji: "🌟",
    color: "text-pink-400",
    bgColor: "bg-pink-500",
    glowColor: "shadow-pink-500/50"
  },
  "evenements-publics": {
    label: "Événements publics",
    emoji: "🗓️",
    color: "text-blue-400",
    bgColor: "bg-blue-500",
    glowColor: "shadow-blue-500/50"
  },
  "ateliers-creatifs": {
    label: "Ateliers créatifs",
    emoji: "🎨",
    color: "text-purple-400",
    bgColor: "bg-purple-500",
    glowColor: "shadow-purple-500/50"
  },
  "soirees-internes": {
    label: "Soirées internes",
    emoji: "👥",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500",
    glowColor: "shadow-emerald-500/50"
  },
  "concours-animations": {
    label: "Concours & animations",
    emoji: "🏆",
    color: "text-amber-400",
    bgColor: "bg-amber-500",
    glowColor: "shadow-amber-500/50"
  },
  "actions-citoyennes": {
    label: "Actions citoyennes",
    emoji: "🤍",
    color: "text-rose-400",
    bgColor: "bg-rose-500",
    glowColor: "shadow-rose-500/50"
  }
};

const PartnerActions = () => {
  const [selectedCategory, setSelectedCategory] = useState("tous");
  const [selectedAction, setSelectedAction] = useState<FormatItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredFormats = selectedCategory === "tous" 
    ? allFormats 
    : allFormats.filter(format => format.category === selectedCategory);

  const openActionDetail = (action: FormatItem) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-display text-3xl md:text-4xl text-white mb-4">
          Nos Actions & Événements
        </h1>
        <p className="text-mp-ink-muted max-w-2xl mx-auto">
          Découvrez nos formats d'animations et d'initiatives qui font vivre la culture manga, 
          créent du lien et valorisent les talents locaux.
        </p>
      </motion.div>

      {/* Category Filters - Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {Object.entries(categories).map(([key, category]) => {
          const isActive = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300
                ${isActive 
                  ? `${category.bgColor} text-white shadow-lg ${category.glowColor}` 
                  : "bg-white text-mp-ink-muted hover:bg-mp-cloud hover:text-white"
                }
              `}
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-mp-ink-muted text-sm">
          {filteredFormats.length} format{filteredFormats.length > 1 ? 's' : ''} affiché{filteredFormats.length > 1 ? 's' : ''}
          {selectedCategory !== "tous" && ` • ${allFormats.length} au total`}
        </p>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredFormats.map((format, index) => {
            const categoryConfig = categories[format.category];
            const bannerUrl = getFormatBanner(format.id);
            
            return (
              <motion.div
                key={format.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openActionDetail(format)}
                className="group cursor-pointer bg-white/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
              >
                {/* Banner Image */}
                {bannerUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={bannerUrl}
                      alt={format.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${categoryConfig?.bgColor} text-white border-0 text-xs`}>
                        {categoryConfig?.emoji} {format.categoryLabel}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="font-display text-lg text-white mb-2 group-hover:text-pink-100 transition-colors">
                    {format.name}
                  </h3>

                  {/* Summary */}
                  <p className="text-mp-ink-muted text-sm mb-4 line-clamp-2">
                    {format.summary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {format.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-mp-cloud/50 text-slate-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {format.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-mp-cloud/50 text-mp-ink-muted rounded-full">
                        +{format.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir plus
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredFormats.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-mp-ink-muted">Aucun format dans cette catégorie.</p>
          <Button
            variant="outline"
            onClick={() => setSelectedCategory("tous")}
            className="mt-4 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
          >
            Voir tous les formats
          </Button>
        </motion.div>
      )}

      {/* Action Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl bg-mp-paper border-mp-border text-white max-h-[90vh] overflow-y-auto">
          {selectedAction && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${categories[selectedAction.category]?.bgColor} flex items-center justify-center`}>
                    <selectedAction.icon className="w-5 h-5 text-white" />
                  </div>
                  {selectedAction.name}
                </DialogTitle>
              </DialogHeader>

              {/* Banner */}
              {getFormatBanner(selectedAction.id) && (
                <div className="relative h-48 rounded-xl overflow-hidden -mx-6 mt-4">
                  <img
                    src={getFormatBanner(selectedAction.id)}
                    alt={selectedAction.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="space-y-6 mt-6">
                {/* Category Badge */}
                <Badge className={`${categories[selectedAction.category]?.bgColor} text-white border-0`}>
                  {categories[selectedAction.category]?.emoji} {selectedAction.categoryLabel}
                </Badge>

                {/* Description */}
                <div>
                  <p className="text-slate-300 leading-relaxed">{selectedAction.description}</p>
                </div>

                {/* Benefits Section */}
                {selectedAction.benefits.length > 0 && (
                  <div className="p-4 bg-white/50 rounded-xl border border-mp-border">
                    <h4 className="font-display text-lg text-white mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400" />
                      Pourquoi nous soutenir ?
                    </h4>
                    <ul className="space-y-2">
                      {selectedAction.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Objectives Section */}
                {selectedAction.objectives.length > 0 && (
                  <div className="p-4 bg-white/50 rounded-xl border border-mp-border">
                    <h4 className="font-display text-lg text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-pink-400" />
                      Objectifs
                    </h4>
                    <ul className="space-y-2">
                      {selectedAction.objectives.map((objective, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Audience */}
                <div className="p-4 bg-white/50 rounded-xl border border-mp-border">
                  <h4 className="font-display text-lg text-white mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Public Cible
                  </h4>
                  <p className="text-slate-300 text-sm">{selectedAction.targetAudience}</p>
                </div>

                {/* Venues */}
                {selectedAction.venues.length > 0 && (
                  <div className="p-4 bg-white/50 rounded-xl border border-mp-border">
                    <h4 className="font-display text-lg text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      Lieux possibles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAction.venues.map((venue, i) => (
                        <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                          {venue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h4 className="text-sm text-mp-ink-muted mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAction.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1.5 bg-mp-cloud/50 text-slate-300 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerActions;
