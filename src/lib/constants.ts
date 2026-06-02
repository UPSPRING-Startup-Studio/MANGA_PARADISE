// ========================
// RÈGLEMENT INTÉRIEUR - CLASSES OFFICIELLES (Art. 3-7)
// ========================

export const OTAKU_CLASSES = {
  gardien: {
    id: "gardien",
    label: "Gardien",
    name: "Gardien",
    icon: "🛡️",
    emoji: "🛡️",
    color: "from-turquoise/20 to-turquoise/10",
    borderColor: "border-turquoise",
    description: "Le protecteur. Tu aimes écouter, aider les autres et résoudre les conflits.",
  },
  stratege: {
    id: "stratege",
    label: "Stratège",
    name: "Stratège",
    icon: "⚔️",
    emoji: "⚔️",
    color: "from-sakura/20 to-sakura/10",
    borderColor: "border-sakura",
    description: "L'organisateur. Tu aimes planifier, gérer les projets et maintenir l'ordre.",
  },
  barde: {
    id: "barde",
    label: "Barde",
    name: "Barde",
    icon: "🎵",
    emoji: "🎵",
    color: "from-accent/20 to-accent/10",
    borderColor: "border-accent",
    description: "L'animateur. Tu aimes mettre l'ambiance, le karaoké et l'énergie collective.",
  },
  artisan: {
    id: "artisan",
    label: "Artisan",
    name: "Artisan",
    icon: "🎨",
    emoji: "🎨",
    color: "from-purple-500/20 to-purple-500/10",
    borderColor: "border-purple-500",
    description: "Le créatif. Tu aimes le cosplay, le dessin et fabriquer des choses.",
  },
  chroniqueur: {
    id: "chroniqueur",
    label: "Chroniqueur",
    name: "Chroniqueur",
    icon: "📜",
    emoji: "📜",
    color: "from-blue-400/20 to-blue-400/10",
    borderColor: "border-blue-400",
    description: "Le savoir. Tu aimes écrire, documenter et partager la culture.",
  },
  invocateur: {
    id: "invocateur",
    label: "Invocateur",
    name: "Invocateur",
    icon: "🔮",
    emoji: "🔮",
    color: "from-violet-500/20 to-violet-500/10",
    borderColor: "border-violet-500",
    description: "Le recruteur. Tu aimes le networking, convaincre et trouver des partenaires.",
  },
  citoyen: {
    id: "citoyen",
    label: "Citoyen",
    name: "Citoyen",
    icon: "🌱",
    emoji: "🌱",
    color: "from-green-400/20 to-green-400/10",
    borderColor: "border-green-400",
    description: "Le flexible. Tu veux aider ponctuellement sans te prendre la tête.",
  },
} as const;

export type OtakuClassId = keyof typeof OTAKU_CLASSES;
export type OtakuClassKey = OtakuClassId; // Alias for backward compatibility

export const OTAKU_CLASS_LIST = Object.values(OTAKU_CLASSES);

// ========================
// RÈGLEMENT INTÉRIEUR - SYSTÈME DE LIGUES (Art. 8.6)
// ========================

export const LEAGUES = {
  bronze: {
    id: "bronze",
    label: "Bronze",
    emoji: "🥉",
    minXp: 0,
    maxXp: 50,
    monthlyRent: 50,
    discount: 0,
    perks: [],
    color: "from-amber-600/20 to-amber-700/10",
    borderColor: "border-amber-600",
    textColor: "text-amber-600",
    bgColor: "bg-amber-600",
  },
  argent: {
    id: "argent",
    label: "Argent",
    emoji: "🥈",
    minXp: 51,
    maxXp: 100,
    monthlyRent: 100,
    discount: 10,
    perks: ["10% réduction boutique"],
    color: "from-gray-400/20 to-gray-500/10",
    borderColor: "border-gray-400",
    textColor: "text-gray-400",
    bgColor: "bg-gray-400",
  },
  or: {
    id: "or",
    label: "Or",
    emoji: "🥇",
    minXp: 101,
    maxXp: 200,
    monthlyRent: 200,
    discount: 15,
    perks: ["Accès prioritaire événements"],
    color: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-500",
    bgColor: "bg-yellow-500",
  },
  platine: {
    id: "platine",
    label: "Platine",
    emoji: "💎",
    minXp: 201,
    maxXp: 300,
    monthlyRent: 400,
    discount: 20,
    perks: ["Goodie mensuel", "Accès prioritaire"],
    color: "from-cyan-400/20 to-cyan-500/10",
    borderColor: "border-cyan-400",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-400",
  },
  diamant: {
    id: "diamant",
    label: "Diamant",
    emoji: "👑",
    minXp: 301,
    maxXp: Infinity,
    monthlyRent: 800,
    discount: 25,
    perks: ["Invitation VIP", "Goodie exclusif", "Accès coulisses"],
    color: "from-violet-500/20 to-violet-600/10",
    borderColor: "border-violet-500",
    textColor: "text-violet-500",
    bgColor: "bg-violet-500",
  },
} as const;

export type LeagueId = keyof typeof LEAGUES;

export const LEAGUE_LIST = Object.values(LEAGUES);

export const getLeagueFromXp = (monthlyXp: number): typeof LEAGUES[LeagueId] => {
  if (monthlyXp >= 301) return LEAGUES.diamant;
  if (monthlyXp >= 201) return LEAGUES.platine;
  if (monthlyXp >= 101) return LEAGUES.or;
  if (monthlyXp >= 51) return LEAGUES.argent;
  return LEAGUES.bronze;
};

// ========================
// PACKS COTISATION (Art. 3-6.3)
// ========================

export const SUBSCRIPTION_PACKS = {
  bronze: {
    id: "bronze",
    label: "Pack Bronze",
    price: 20,
    otkBonus: 3000,
    goodies: ["Tour de cou exclusif"],
    color: "from-amber-600 to-amber-700",
    description: "Cotisation de base + 3 000 OTK Coins offerts",
  },
  silver: {
    id: "silver",
    label: "Pack Silver",
    price: 30,
    otkBonus: 5000,
    goodies: ["T-shirt exclusif"],
    color: "from-gray-400 to-gray-500",
    description: "Pack Bronze + T-shirt exclusif + 2 000 OTK supplémentaires",
  },
  gold: {
    id: "gold",
    label: "Pack Gold",
    price: 40,
    otkBonus: 8000,
    goodies: ["Pochette Surprise", "Rôle VIP Discord"],
    color: "from-yellow-500 to-amber-500",
    description: "Pack ultime avec pochette mystère + statut VIP Discord",
  },
} as const;

export type SubscriptionPackId = keyof typeof SUBSCRIPTION_PACKS;

// ========================
// RÔLES ÉVÉNEMENTS (Art. 5.4.1)
// ========================

export const EVENT_ROLES = {
  visitor: {
    value: "visitor",
    label: "Membre Visiteur",
    emoji: "👤",
    description: "Je viens en touriste (pas d'obligation)",
    requiresValidation: false,
  },
  volunteer: {
    value: "volunteer",
    label: "Bénévole",
    emoji: "🛡️",
    description: "Je viens aider l'équipe",
    requiresValidation: false,
  },
  exhibitor: {
    value: "exhibitor",
    label: "Membre Exposant",
    emoji: "🎪",
    description: "Je tiens le stand (missions, planning, repas pris en charge si > 6h). Soumis à validation.",
    requiresValidation: true,
  },
  cosplayer: {
    value: "cosplayer",
    label: "Cosplayeur",
    emoji: "🎭",
    description: "Je viens costumé(e)",
    requiresValidation: false,
  },
} as const;

// ========================
// ÉCONOMIE OTK (Art. 8.6)
// ========================

export const OTK_RATE = 1000; // 1000 OTK = 1€

export const formatOtkToEuro = (otk: number): string => {
  return `${(otk / OTK_RATE).toFixed(2).replace(".", ",")} €`;
};

export const formatEuroToOtk = (euro: number): number => {
  return euro * OTK_RATE;
};

// ========================
// RÔLES ASSO (Fonction membre)
// ========================

export const MEMBER_ROLES = {
  president: "Président",
  vice_president: "Vice-Président",
  treasurer: "Trésorier",
  secretary: "Secrétaire",
  staff: "Staff",
  volunteer: "Bénévole",
  member: "Membre",
} as const;
