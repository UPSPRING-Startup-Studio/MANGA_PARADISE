import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Zap, Sword, BookOpen, Film, Music, Star, Coins, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Event, EventType } from "@/hooks/useEvents";

// ============================================================
// HELPERS
// ============================================================

/** Formate une date courte "12 Avr. 2025" */
const formatEventDateShort = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/** Config visuelle par type d'événement (charte Pop Sanctuary) */
const EVENT_TYPE_CONFIG: Record<
  EventType | string,
  { label: string; tint: string; iconColor: string; icon: React.ReactNode; emoji: string }
> = {
  convention: {
    label: "Convention",
    tint: "bg-mp-primary/10 text-mp-primary border-mp-primary/30",
    iconColor: "text-mp-primary",
    icon: <Star className="w-3 h-3" />,
    emoji: "🎌",
  },
  tournoi: {
    label: "Tournoi",
    tint: "bg-mp-coral/10 text-mp-coral border-mp-coral/30",
    iconColor: "text-mp-coral",
    icon: <Sword className="w-3 h-3" />,
    emoji: "⚔️",
  },
  atelier: {
    label: "Atelier",
    tint: "bg-mp-saffron/15 text-mp-orange border-mp-saffron/40",
    iconColor: "text-mp-orange",
    icon: <BookOpen className="w-3 h-3" />,
    emoji: "🎨",
  },
  meetup: {
    label: "Meetup",
    tint: "bg-mp-primary/10 text-mp-primary border-mp-primary/30",
    iconColor: "text-mp-primary",
    icon: <Star className="w-3 h-3" />,
    emoji: "🤝",
  },
  concert: {
    label: "Concert",
    tint: "bg-mp-orange/10 text-mp-orange border-mp-orange/30",
    iconColor: "text-mp-orange",
    icon: <Music className="w-3 h-3" />,
    emoji: "🎵",
  },
  exposition: {
    label: "Exposition",
    tint: "bg-mp-coral/10 text-mp-coral border-mp-coral/30",
    iconColor: "text-mp-coral",
    icon: <Zap className="w-3 h-3" />,
    emoji: "🖼️",
  },
  projection: {
    label: "Projection",
    tint: "bg-mp-primary/10 text-mp-primary border-mp-primary/30",
    iconColor: "text-mp-primary",
    icon: <Film className="w-3 h-3" />,
    emoji: "🎬",
  },
  autre: {
    label: "Événement",
    tint: "bg-mp-cloud text-mp-ink-soft border-mp-border",
    iconColor: "text-mp-ink-soft",
    icon: <Star className="w-3 h-3" />,
    emoji: "✨",
  },
};

const getTypeConfig = (type: string | null) =>
  EVENT_TYPE_CONFIG[type ?? "autre"] ?? EVENT_TYPE_CONFIG["autre"];

// ============================================================
// MOCK AVATARS — Preuve sociale (Mission 1)
// ============================================================
const MOCK_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Yuki&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Hana&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Kaito&backgroundColor=c0aede",
];

// ============================================================
// PLACEHOLDER IMAGE — Style charte
// ============================================================
const EventPlaceholder = ({ type }: { type: string | null }) => {
  const config = getTypeConfig(type);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-mp-cloud via-mp-sand to-white">
      {/* Décor losange discret */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--mp-primary) / 0.08) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--mp-primary) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Icône centrale */}
      <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${config.tint} border`}>
        <span className="text-3xl">{config.emoji}</span>
      </div>
      <span className="relative z-10 text-xs text-mp-ink-muted font-mono uppercase tracking-widest">
        {config.label}
      </span>
    </div>
  );
};

// ============================================================
// COMPOSANT : Pile d'avatars (Mission 1 — Preuve Sociale)
// ============================================================
interface AvatarStackProps {
  count: number;
}

const AvatarStack = ({ count }: AvatarStackProps) => {
  if (count <= 0) return null;
  const displayAvatars = MOCK_AVATARS.slice(0, Math.min(3, count));
  const remaining = count - displayAvatars.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayAvatars.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Avatar className="w-6 h-6 border-2 border-white ring-0">
              <AvatarImage src={src} alt={`Nakama ${i + 1}`} />
              <AvatarFallback className="text-[8px] font-bold bg-mp-primary/20 text-mp-primary">
                N
              </AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white bg-mp-primary/15 text-mp-primary">
            +{remaining}
          </div>
        )}
      </div>
      <span className="text-mp-ink-muted text-xs">
        <span className="text-mp-ink font-semibold">{count}</span> Nakama{count > 1 ? "s" : ""} y vont
      </span>
    </div>
  );
};

// ============================================================
// PROPS
// ============================================================
export interface EventCardProps {
  event: Event;
  participantCount?: number;
  /** Récompense OTK disponible pour cet événement (Mission 2 — Badge OTK) */
  otkReward?: number | null;
  onClick?: (event: Event) => void;
  index?: number;
}

// ============================================================
// COMPONENT
// ============================================================
export const EventCard = ({
  event,
  participantCount,
  otkReward,
  onClick,
  index = 0,
}: EventCardProps) => {
  const navigate = useNavigate();
  const typeConfig = getTypeConfig(event.type_evenement ?? event.category);
  const coverImage = event.cover_image ?? event.image_url;
  const displayDate = event.date_debut ?? event.date;
  const displayCity = event.city ?? "Lieu à confirmer";

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    } else {
      navigate(`/agenda/${event.id}`);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-mp-border shadow-card hover:shadow-card-lg hover:border-mp-primary/40 transition-all"
    >
      {/* Cover Image */}
      <div className="relative h-44 overflow-hidden">
        {coverImage ? (
          <motion.img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <EventPlaceholder type={event.type_evenement ?? event.category} />
        )}

        {/* Gradient overlay subtil pour lisibilité du badge */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badge type en haut à gauche */}
        <div className="absolute top-3 left-3 z-20">
          <Badge
            className={`flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 backdrop-blur-sm ${typeConfig.tint}`}
          >
            {typeConfig.icon}
            {typeConfig.label}
          </Badge>
        </div>

        {/* ── MISSION 2 : Badge OTK (saffron) ── */}
        {otkReward && otkReward > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.07 + 0.2 }}
            className="absolute top-3 right-3 z-20"
          >
            <div className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold bg-mp-saffron/90 text-mp-night border border-mp-orange/40 shadow-card">
              <Coins className="w-3 h-3" />
              Quête : {otkReward} OTK
            </div>
          </motion.div>
        )}

        {/* has_contest indicator */}
        {event.has_contest && !otkReward && (
          <div className="absolute bottom-3 right-3 z-20">
            <div className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold bg-mp-saffron/90 text-mp-night border border-mp-orange/40">
              <Sword className="w-3 h-3" />
              Concours
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Titre */}
        <h3 className="font-display italic font-extrabold text-mp-ink text-lg leading-tight line-clamp-2 group-hover:text-mp-primary transition-colors duration-200">
          {event.title}
        </h3>

        {/* Badge association */}
        {event.association_name && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-mp-coral shrink-0" />
            <span className="text-xs text-mp-coral">
              Proposé par {event.association_name}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-mp-ink-soft text-sm">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-mp-primary" />
          <span className="capitalize">{formatEventDateShort(displayDate)}</span>
          {event.date_fin && event.date_debut !== event.date_fin && (
            <>
              <span className="text-mp-ink-muted">→</span>
              <span className="capitalize">{formatEventDateShort(event.date_fin)}</span>
            </>
          )}
        </div>

        {/* Ville */}
        <div className="flex items-center gap-2 text-mp-ink-soft text-sm">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-mp-primary" />
          <span className="truncate">{displayCity}</span>
          {event.venue_name && (
            <span className="text-mp-ink-muted truncate text-xs">· {event.venue_name}</span>
          )}
        </div>

        {/* Description courte */}
        {event.description && (
          <p className="text-mp-ink-muted text-xs line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Footer: Preuve sociale + Prix */}
        <div className="flex items-center justify-between pt-2 border-t border-mp-border">
          {participantCount !== undefined && participantCount > 0 ? (
            <AvatarStack count={participantCount} />
          ) : (
            <span className="text-xs text-mp-ink-muted italic">Sois le premier.</span>
          )}

          <span className="text-xs flex-shrink-0 ml-2">
            {event.price ? (
              <span className="text-mp-orange font-semibold">{event.price}</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Gratuit</span>
            )}
          </span>
        </div>

        {/* CTA hover */}
        <motion.div
          className="text-xs font-semibold text-mp-primary opacity-0 group-hover:opacity-100 transition-opacity text-right"
          initial={{ x: 4 }}
          whileHover={{ x: 0 }}
        >
          Voir l'événement →
        </motion.div>
      </div>
    </motion.article>
  );
};

export default EventCard;
