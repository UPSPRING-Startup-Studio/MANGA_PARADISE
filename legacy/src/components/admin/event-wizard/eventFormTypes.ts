/**
 * Event Form Wizard — Types, Presets & Configuration
 * 
 * Architecture du formulaire multi-étapes Manga Paradise.
 * Chaque preset préconfigure les champs visibles et les valeurs par défaut.
 */

import type { ScheduleDay } from "../EventScheduleForm";
import type { ProgramItem, ContestConfig } from "../EventProgramForm";

// ─── Event Presets ────────────────────────────────────────────────

export type EventPreset =
  | "meetup"
  | "convention"
  | "tournoi"
  | "cosplay-contest"
  | "atelier"
  | "projection"
  | "soiree"
  | "custom";

export interface PresetConfig {
  id: EventPreset;
  label: string;
  description: string;
  icon: string;
  gradient: string;
  defaultCategory: string;
  defaultFormat: EventFormat;
  suggestedTags: string[];
  enabledModules: PopCultureModule[];
  defaultRegistration: RegistrationType;
  defaultTicketing: "free" | "paid";
}

export const EVENT_PRESETS: PresetConfig[] = [
  {
    id: "meetup",
    label: "Meetup / Rencontre",
    description: "Rencontre communautaire, afterwork, pique-nique otaku",
    icon: "🤝",
    gradient: "from-turquoise/20 to-turquoise/5",
    defaultCategory: "Rencontre",
    defaultFormat: "presentiel",
    suggestedTags: ["communauté", "rencontre", "otaku", "nakama"],
    enabledModules: ["community"],
    defaultRegistration: "libre",
    defaultTicketing: "free",
  },
  {
    id: "convention",
    label: "Convention / Festival",
    description: "Festival manga, Japan Expo, salon multi-activités",
    icon: "🏯",
    gradient: "from-sakura/20 to-purple-500/10",
    defaultCategory: "Convention",
    defaultFormat: "presentiel",
    suggestedTags: ["convention", "festival", "manga", "anime", "japan"],
    enabledModules: ["cosplay-contest", "gaming-tournament", "guests", "exhibitors", "volunteers", "gamification"],
    defaultRegistration: "libre",
    defaultTicketing: "paid",
  },
  {
    id: "tournoi",
    label: "Tournoi Gaming",
    description: "Tournoi esports, LAN party, compétition de jeux vidéo",
    icon: "🎮",
    gradient: "from-green-500/20 to-emerald-500/10",
    defaultCategory: "Tournoi",
    defaultFormat: "presentiel",
    suggestedTags: ["gaming", "esports", "tournoi", "compétition"],
    enabledModules: ["gaming-tournament", "gamification"],
    defaultRegistration: "validation",
    defaultTicketing: "free",
  },
  {
    id: "cosplay-contest",
    label: "Concours Cosplay",
    description: "Concours de cosplay, défilé, performance scénique",
    icon: "🎭",
    gradient: "from-pink-500/20 to-sakura/10",
    defaultCategory: "Cosplay",
    defaultFormat: "presentiel",
    suggestedTags: ["cosplay", "concours", "costume", "performance"],
    enabledModules: ["cosplay-contest", "guests"],
    defaultRegistration: "validation",
    defaultTicketing: "free",
  },
  {
    id: "atelier",
    label: "Atelier / Workshop",
    description: "Atelier dessin manga, cosplay making, calligraphie",
    icon: "🎨",
    gradient: "from-amber-500/20 to-yellow-500/10",
    defaultCategory: "Atelier",
    defaultFormat: "presentiel",
    suggestedTags: ["atelier", "workshop", "apprentissage", "créatif"],
    enabledModules: [],
    defaultRegistration: "libre",
    defaultTicketing: "free",
  },
  {
    id: "projection",
    label: "Projection / Conférence",
    description: "Projection anime, ciné-débat, conférence thématique",
    icon: "🎬",
    gradient: "from-indigo-500/20 to-blue-500/10",
    defaultCategory: "Projection",
    defaultFormat: "presentiel",
    suggestedTags: ["projection", "anime", "film", "conférence"],
    enabledModules: [],
    defaultRegistration: "libre",
    defaultTicketing: "free",
  },
  {
    id: "soiree",
    label: "Soirée / Concert",
    description: "Soirée manga, J-Music live, karaoké, DJ set",
    icon: "🎵",
    gradient: "from-purple-500/20 to-pink-500/10",
    defaultCategory: "general",
    defaultFormat: "presentiel",
    suggestedTags: ["soirée", "concert", "musique", "j-music", "karaoké"],
    enabledModules: ["guests"],
    defaultRegistration: "libre",
    defaultTicketing: "paid",
  },
  {
    id: "custom",
    label: "Personnalisé",
    description: "Configurer manuellement tous les paramètres",
    icon: "⚙️",
    gradient: "from-slate-500/20 to-slate-500/5",
    defaultCategory: "general",
    defaultFormat: "presentiel",
    suggestedTags: [],
    enabledModules: [],
    defaultRegistration: "libre",
    defaultTicketing: "free",
  },
];

// ─── Event Format ─────────────────────────────────────────────────

export type EventFormat = "presentiel" | "hybride" | "en-ligne";

export const EVENT_FORMATS: { value: EventFormat; label: string; icon: string; description: string }[] = [
  { value: "presentiel", label: "Présentiel", icon: "📍", description: "Événement physique en un lieu" },
  { value: "hybride", label: "Hybride", icon: "🔗", description: "Présentiel + retransmission en ligne" },
  { value: "en-ligne", label: "En ligne", icon: "🌐", description: "100% en ligne (Discord, Twitch, etc.)" },
];

// ─── Registration ─────────────────────────────────────────────────

export type RegistrationType = "libre" | "validation" | "externe";

export const REGISTRATION_TYPES: { value: RegistrationType; label: string; description: string; icon: string }[] = [
  { value: "libre", label: "Inscription libre", description: "Les participants s'inscrivent directement", icon: "🟢" },
  { value: "validation", label: "Sur validation", description: "L'organisateur approuve chaque inscription", icon: "🟡" },
  { value: "externe", label: "Inscription externe", description: "Redirection vers un site tiers", icon: "🔗" },
];

// ─── Pop Culture Modules ──────────────────────────────────────────

export type PopCultureModule =
  | "cosplay-contest"
  | "gaming-tournament"
  | "guests"
  | "exhibitors"
  | "volunteers"
  | "gamification"
  | "community"
  | "dress-code";

export interface ModuleConfig {
  id: PopCultureModule;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const POP_CULTURE_MODULES: ModuleConfig[] = [
  {
    id: "cosplay-contest",
    label: "Concours Cosplay",
    description: "Concours avec formats solo/duo/groupe, pré-judging, etc.",
    icon: "🎭",
    color: "sakura",
  },
  {
    id: "gaming-tournament",
    label: "Tournoi Gaming",
    description: "Tournoi esports avec jeu, plateforme, brackets",
    icon: "🎮",
    color: "green-500",
  },
  {
    id: "guests",
    label: "Invités / Artistes",
    description: "Invités d'honneur, artistes, mangakas, voice actors",
    icon: "⭐",
    color: "amber-500",
  },
  {
    id: "exhibitors",
    label: "Exposants / Stands",
    description: "Stands de vente, artist alley, partenaires",
    icon: "🏪",
    color: "blue-500",
  },
  {
    id: "volunteers",
    label: "Bénévoles / Staff",
    description: "Gestion des équipes bénévoles et du staff",
    icon: "🤲",
    color: "purple-500",
  },
  {
    id: "gamification",
    label: "Quêtes / Gamification",
    description: "Quêtes de présence, stamps rally, récompenses XP",
    icon: "🏆",
    color: "electric-yellow",
  },
  {
    id: "community",
    label: "Liens Communautaires",
    description: "Discord, partenaires, association organisatrice",
    icon: "💬",
    color: "turquoise",
  },
  {
    id: "dress-code",
    label: "Dress Code / Règlement",
    description: "Règlement spécifique, code vestimentaire, consignes",
    icon: "📋",
    color: "orange-500",
  },
];

// ─── Cosplay Contest Module ───────────────────────────────────────

export interface CosplayContestModuleData {
  enabled: boolean;
  contest_type: "individuel" | "groupe" | "mixte";
  has_backstage: boolean;
  allow_wip_photos: boolean;
  allow_reference_photos: boolean;
  allow_soundtrack: boolean;
  max_soundtrack_duration_sec: number;
}

// ─── Gaming Tournament Module ─────────────────────────────────────

export interface GamingTournamentModuleData {
  enabled: boolean;
  game_title: string;
  platform: string;
  team_format: "solo" | "duo" | "equipe";
  max_players: number;
  rules_url: string;
  check_in_required: boolean;
  bracket_type: "single-elimination" | "double-elimination" | "round-robin" | "swiss";
}

// ─── Guests Module ────────────────────────────────────────────────

export interface GuestEntry {
  id: string;
  name: string;
  type: "mangaka" | "voice-actor" | "cosplayer" | "artiste" | "youtuber" | "autre";
  time_slots: string;
  is_public: boolean;
  logistics_notes: string;
}

export interface GuestsModuleData {
  enabled: boolean;
  guests: GuestEntry[];
}

// ─── Exhibitors Module ────────────────────────────────────────────

export interface ExhibitorsModuleData {
  enabled: boolean;
  max_stands: number;
  stand_categories: string[];
  application_deadline: string;
}

// ─── Volunteers Module ────────────────────────────────────────────

export interface VolunteersModuleData {
  enabled: boolean;
  max_volunteers: number;
  roles_needed: string[];
  briefing_time: string;
}

// ─── Gamification Module ──────────────────────────────────────────

export interface GamificationModuleData {
  enabled: boolean;
  enable_presence_quest: boolean;
  enable_stamps_rally: boolean;
  xp_reward: number;
  otk_reward: number;
}

// ─── Community Module ─────────────────────────────────────────────

export interface CommunityModuleData {
  enabled: boolean;
  discord_url: string;
  partners: string[];
  organizing_association: string;
}

// ─── Dress Code Module ────────────────────────────────────────────

export interface DressCodeModuleData {
  enabled: boolean;
  dress_code_description: string;
  rules_text: string;
  rules_url: string;
}

// ─── Complete Form Data ───────────────────────────────────────────

export interface EventWizardFormData {
  // Metadata
  preset: EventPreset;

  // Step 0: Series (optional)
  series_id?: string;
  series_canonical_name?: string;
  edition_label?: string;

  // Step 0: Association (optional)
  association_id?: string | null;
  _association_name?: string;
  _association_city?: string;

  // Step 0: Pro Partner organizer (optional)
  organizer_type?: "association" | "pro_partner" | null;
  organizer_id?: string | null;
  _pro_partner_name?: string;
  _pro_partner_city?: string;

  // Step 1: Identity
  title: string;
  subtitle: string;
  category: string;
  theme_universe: string;
  image_url: string;
  description_short: string;
  description: string;
  tags: string[];

  // Step 2: Date & Location
  format: EventFormat;
  schedule: ScheduleDay[];
  venue_name: string;
  city: string;
  region: string;
  access_info: string;
  online_url: string;

  // Step 3: Registration & Capacity
  registration_type: RegistrationType;
  registration_open_date: string;
  registration_close_date: string;
  is_capacity_limited: boolean;
  max_attendees: string;
  enable_waitlist: boolean;
  enable_qr_checkin: boolean;
  allow_companions: boolean;

  // Step 4: Ticketing & Pricing
  ticketing_mode: "internal" | "external";
  external_link: string;
  is_free: boolean;
  price_amount: string;
  price_label: string;
  has_member_price: boolean;
  member_price_amount: string;
  has_multi_day_pass: boolean;
  multi_day_pass_price: string;
  refund_policy: string;
  payment_methods: string[];
  confirmation_message: string;

  // Step 5: Participant Experience
  required_fields: string[];
  accessibility_info: string;
  allergy_field_enabled: boolean;
  photo_consent_required: boolean;
  badge_pseudo_enabled: boolean;
  social_links_enabled: boolean;

  // Step 6: Pop Culture Modules
  enabled_modules: PopCultureModule[];
  cosplay_contest: CosplayContestModuleData;
  gaming_tournament: GamingTournamentModuleData;
  guests: GuestsModuleData;
  exhibitors: ExhibitorsModuleData;
  volunteers: VolunteersModuleData;
  gamification: GamificationModuleData;
  community: CommunityModuleData;
  dress_code: DressCodeModuleData;

  // Legacy — carried through for save compatibility
  status: string;
  programItems: ProgramItem[];
}

// ─── Default Form Data ────────────────────────────────────────────

export const DEFAULT_WIZARD_FORM_DATA: EventWizardFormData = {
  preset: "custom",

  // Step 1
  title: "",
  subtitle: "",
  category: "general",
  theme_universe: "",
  image_url: "",
  description_short: "",
  description: "",
  tags: [],

  // Step 2
  format: "presentiel",
  schedule: [{ date: "", start_time: "10:00", end_time: "18:00" }],
  venue_name: "",
  city: "",
  region: "",
  access_info: "",
  online_url: "",

  // Step 3
  registration_type: "libre",
  registration_open_date: "",
  registration_close_date: "",
  is_capacity_limited: false,
  max_attendees: "",
  enable_waitlist: false,
  enable_qr_checkin: false,
  allow_companions: false,

  // Step 4
  ticketing_mode: "internal",
  external_link: "",
  is_free: true,
  price_amount: "",
  price_label: "",
  has_member_price: false,
  member_price_amount: "",
  has_multi_day_pass: false,
  multi_day_pass_price: "",
  refund_policy: "",
  payment_methods: [],
  confirmation_message: "",

  // Step 5
  required_fields: [],
  accessibility_info: "",
  allergy_field_enabled: false,
  photo_consent_required: false,
  badge_pseudo_enabled: false,
  social_links_enabled: false,

  // Step 6
  enabled_modules: [],
  cosplay_contest: {
    enabled: false,
    contest_type: "mixte",
    has_backstage: false,
    allow_wip_photos: false,
    allow_reference_photos: true,
    allow_soundtrack: true,
    max_soundtrack_duration_sec: 120,
  },
  gaming_tournament: {
    enabled: false,
    game_title: "",
    platform: "",
    team_format: "solo",
    max_players: 32,
    rules_url: "",
    check_in_required: true,
    bracket_type: "single-elimination",
  },
  guests: {
    enabled: false,
    guests: [],
  },
  exhibitors: {
    enabled: false,
    max_stands: 0,
    stand_categories: [],
    application_deadline: "",
  },
  volunteers: {
    enabled: false,
    max_volunteers: 0,
    roles_needed: [],
    briefing_time: "",
  },
  gamification: {
    enabled: false,
    enable_presence_quest: false,
    enable_stamps_rally: false,
    xp_reward: 50,
    otk_reward: 25,
  },
  community: {
    enabled: false,
    discord_url: "",
    partners: [],
    organizing_association: "",
  },
  dress_code: {
    enabled: false,
    dress_code_description: "",
    rules_text: "",
    rules_url: "",
  },

  // Legacy
  status: "upcoming",
  programItems: [],
};

// ─── Wizard Steps ─────────────────────────────────────────────────

export interface WizardStep {
  id: number;
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 0, key: "identity", label: "Identité de l'événement", shortLabel: "Identité", icon: "✨", description: "Nom, catégorie, image, description, série" },
  { id: 1, key: "datetime", label: "Date & Lieu", shortLabel: "Date & Lieu", icon: "📍", description: "Format, planning, localisation" },
  { id: 2, key: "registration", label: "Inscriptions & Capacité", shortLabel: "Inscriptions", icon: "📝", description: "Type d'inscription, jauge, check-in" },
  { id: 3, key: "ticketing", label: "Billetterie & Tarifs", shortLabel: "Billetterie", icon: "🎫", description: "Gratuit/payant, tarifs, passes" },
  { id: 4, key: "experience", label: "Expérience Participant", shortLabel: "Expérience", icon: "🎌", description: "Accessibilité, badge, consentement" },
  { id: 5, key: "modules", label: "Modules Pop Culture", shortLabel: "Modules", icon: "🎮", description: "Cosplay, gaming, invités, staff..." },
];

// ─── Helper: Apply Preset ─────────────────────────────────────────

export function applyPreset(preset: PresetConfig): Partial<EventWizardFormData> {
  return {
    preset: preset.id,
    category: preset.defaultCategory,
    format: preset.defaultFormat,
    tags: [...preset.suggestedTags],
    enabled_modules: [...preset.enabledModules],
    registration_type: preset.defaultRegistration,
    is_free: preset.defaultTicketing === "free",
    // Enable module data for each enabled module
    cosplay_contest: {
      ...DEFAULT_WIZARD_FORM_DATA.cosplay_contest,
      enabled: preset.enabledModules.includes("cosplay-contest"),
    },
    gaming_tournament: {
      ...DEFAULT_WIZARD_FORM_DATA.gaming_tournament,
      enabled: preset.enabledModules.includes("gaming-tournament"),
    },
    guests: {
      ...DEFAULT_WIZARD_FORM_DATA.guests,
      enabled: preset.enabledModules.includes("guests"),
    },
    exhibitors: {
      ...DEFAULT_WIZARD_FORM_DATA.exhibitors,
      enabled: preset.enabledModules.includes("exhibitors"),
    },
    volunteers: {
      ...DEFAULT_WIZARD_FORM_DATA.volunteers,
      enabled: preset.enabledModules.includes("volunteers"),
    },
    gamification: {
      ...DEFAULT_WIZARD_FORM_DATA.gamification,
      enabled: preset.enabledModules.includes("gamification"),
      enable_presence_quest: preset.enabledModules.includes("gamification"),
    },
    community: {
      ...DEFAULT_WIZARD_FORM_DATA.community,
      enabled: preset.enabledModules.includes("community"),
    },
    dress_code: {
      ...DEFAULT_WIZARD_FORM_DATA.dress_code,
      enabled: preset.enabledModules.includes("dress-code"),
    },
  };
}

// ─── Helper: Convert WizardFormData to Legacy EventFormData for save ──

export interface LegacyEventFormData {
  title: string;
  description: string;
  category: string;
  status: string;
  schedule: ScheduleDay[];
  venue_name: string;
  city: string;
  region: string;
  ticketing_mode: "internal" | "external";
  external_link: string;
  is_free: boolean;
  price_amount: string;
  is_capacity_limited: boolean;
  max_attendees: string;
  image_url: string;
  enablePresenceQuest: boolean;
  programItems: ProgramItem[];
  id?: string;
  // Phase 2 — Series
  series_id?: string | null;
  edition_label?: string | null;
  // Phase 3 — Association
  association_id?: string | null;
  // Phase 4 — Multi-organisateur
  organizer_type?: string | null;
  organizer_id?: string | null;
}

export function wizardToLegacy(data: EventWizardFormData, eventId?: string): LegacyEventFormData {
  // Determine organizer fields from wizard state
  let organizer_type: string | null = null;
  let organizer_id: string | null = null;
  let association_id: string | null = data.association_id || null;

  if (data.organizer_type === "pro_partner" && data.organizer_id) {
    organizer_type = "pro_partner";
    organizer_id = data.organizer_id;
    association_id = null; // pro_partner overrides association
  } else if (data.association_id) {
    organizer_type = "association";
    organizer_id = data.association_id;
    association_id = data.association_id;
  }

  return {
    title: data.title,
    description: data.description || data.description_short,
    category: data.category,
    status: data.status,
    schedule: data.schedule,
    venue_name: data.venue_name,
    city: data.city,
    region: data.region,
    ticketing_mode: data.ticketing_mode,
    external_link: data.external_link,
    is_free: data.is_free,
    price_amount: data.price_amount,
    is_capacity_limited: data.is_capacity_limited,
    max_attendees: data.max_attendees,
    image_url: data.image_url,
    enablePresenceQuest: data.gamification.enable_presence_quest,
    programItems: data.programItems,
    id: eventId,
    // Phase 2 — Series
    series_id: data.series_id || null,
    edition_label: data.edition_label || null,
    // Phase 3 — Association (rétro-compat)
    association_id,
    // Phase 4 — Multi-organisateur
    organizer_type,
    organizer_id,
  };
}

// ─── Regions Data ─────────────────────────────────────────────────

export const REGIONS_DATA = [
  {
    label: "PROVENCE-ALPES-CÔTE D'AZUR",
    options: ["04 - Alpes-de-Haute-Provence", "05 - Hautes-Alpes", "06 - Alpes-Maritimes", "13 - Bouches-du-Rhône", "83 - Var", "84 - Vaucluse"],
  },
  {
    label: "AUVERGNE-RHÔNE-ALPES",
    options: ["01 - Ain", "07 - Ardèche", "26 - Drôme", "38 - Isère", "42 - Loire", "69 - Rhône", "73 - Savoie", "74 - Haute-Savoie"],
  },
  {
    label: "ÎLE-DE-FRANCE",
    options: ["75 - Paris", "77 - Seine-et-Marne", "78 - Yvelines", "91 - Essonne", "92 - Hauts-de-Seine", "93 - Seine-Saint-Denis", "94 - Val-de-Marne", "95 - Val-d'Oise"],
  },
  {
    label: "OCCITANIE",
    options: ["09 - Ariège", "11 - Aude", "12 - Aveyron", "30 - Gard", "31 - Haute-Garonne", "32 - Gers", "34 - Hérault", "46 - Lot", "48 - Lozère", "65 - Hautes-Pyrénées", "66 - Pyrénées-Orientales", "81 - Tarn", "82 - Tarn-et-Garonne"],
  },
  {
    label: "NOUVELLE-AQUITAINE",
    options: ["16 - Charente", "17 - Charente-Maritime", "19 - Corrèze", "23 - Creuse", "24 - Dordogne", "33 - Gironde", "40 - Landes", "47 - Lot-et-Garonne", "64 - Pyrénées-Atlantiques", "79 - Deux-Sèvres", "86 - Vienne", "87 - Haute-Vienne"],
  },
  {
    label: "BRETAGNE",
    options: ["22 - Côtes-d'Armor", "29 - Finistère", "35 - Ille-et-Vilaine", "56 - Morbihan"],
  },
  {
    label: "PAYS DE LA LOIRE",
    options: ["44 - Loire-Atlantique", "49 - Maine-et-Loire", "53 - Mayenne", "72 - Sarthe", "85 - Vendée"],
  },
  {
    label: "GRAND EST",
    options: ["08 - Ardennes", "10 - Aube", "51 - Marne", "52 - Haute-Marne", "54 - Meurthe-et-Moselle", "55 - Meuse", "57 - Moselle", "67 - Bas-Rhin", "68 - Haut-Rhin", "88 - Vosges"],
  },
  {
    label: "HAUTS-DE-FRANCE",
    options: ["02 - Aisne", "59 - Nord", "60 - Oise", "62 - Pas-de-Calais", "80 - Somme"],
  },
  {
    label: "NORMANDIE",
    options: ["14 - Calvados", "27 - Eure", "50 - Manche", "61 - Orne", "76 - Seine-Maritime"],
  },
  {
    label: "BOURGOGNE-FRANCHE-COMTÉ",
    options: ["21 - Côte-d'Or", "25 - Doubs", "39 - Jura", "58 - Nièvre", "70 - Haute-Saône", "71 - Saône-et-Loire", "89 - Yonne", "90 - Territoire de Belfort"],
  },
  {
    label: "CENTRE-VAL DE LOIRE",
    options: ["18 - Cher", "28 - Eure-et-Loir", "36 - Indre", "37 - Indre-et-Loire", "41 - Loir-et-Cher", "45 - Loiret"],
  },
  {
    label: "CORSE",
    options: ["2A - Corse-du-Sud", "2B - Haute-Corse"],
  },
];

// ─── Categories ───────────────────────────────────────────────────

export const CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "Atelier", label: "Atelier" },
  { value: "Projection", label: "Projection" },
  { value: "Gaming", label: "Gaming" },
  { value: "Cosplay", label: "Cosplay" },
  { value: "Rencontre", label: "Rencontre" },
  { value: "Convention", label: "Convention" },
  { value: "Festival", label: "Festival" },
  { value: "Tournoi", label: "Tournoi" },
  { value: "Concert", label: "Concert" },
  { value: "Soirée", label: "Soirée" },
];

// ─── Common Input Styles ──────────────────────────────────────────

export const INPUT_STYLES = "bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20";
export const SELECT_STYLES = "bg-white text-[#1a1a1a] border-slate-300 focus:border-sakura focus:ring-sakura/20";
