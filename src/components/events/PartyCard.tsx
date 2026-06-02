import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Camera, 
  Trophy, 
  Lock, 
  UserPlus,
  Car,
  Utensils,
  Home,
  Music,
  Shirt,
  Heart,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EventParty, PartyMode, PartySlot } from "@/hooks/useEventParties";

interface PartyCardProps {
  party: EventParty;
  onView: (party: EventParty) => void;
  onJoin?: (party: EventParty) => void;
  isMember?: boolean;
  isCreator?: boolean;
  hasPendingRequest?: boolean;
}

const TAG_ICONS: Record<string, React.ElementType> = {
  covoit: Car,
  food: Utensils,
  logement: Home,
  playlist: Music,
  cosplay: Shirt,
  afterparty: Heart,
};

const MODE_CONFIG: Record<PartyMode, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  squad: { 
    icon: Users, 
    color: 'text-turquoise', 
    bgColor: 'bg-turquoise/20',
    label: 'SQUAD'
  },
  shooting: { 
    icon: Camera, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/20',
    label: 'SHOOTING'
  },
  concours: { 
    icon: Trophy, 
    color: 'text-sakura', 
    bgColor: 'bg-sakura/20',
    label: 'CONCOURS'
  },
};

export default function PartyCard({ party, onView, onJoin, isMember, isCreator, hasPendingRequest }: PartyCardProps) {
  const modeConfig = MODE_CONFIG[party.mode];
  const ModeIcon = modeConfig.icon;
  
  const memberCount = party.member_count || 0;
  const maxMembers = party.max_members;
  const isFull = maxMembers ? memberCount >= maxMembers : false;
  const isPrivate = party.visibility === 'private';

  const handleCardClick = () => {
    onView(party);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(party);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "p-4 cursor-pointer transition-all",
          "border-2 hover:shadow-lg",
          party.mode === 'squad' && "hover:border-turquoise/50",
          party.mode === 'shooting' && "hover:border-blue-500/50",
          party.mode === 'concours' && "hover:border-sakura/50",
          isPrivate && "border-dashed"
        )}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={cn(modeConfig.bgColor, modeConfig.color, "gap-1")}>
              <ModeIcon className="w-3 h-3" />
              {modeConfig.label}
            </Badge>
            {isPrivate && (
              <Badge variant="outline" className="gap-1">
                <Lock className="w-3 h-3" />
                Secret
              </Badge>
            )}
          </div>
          
          {/* Member count */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {memberCount}
              {maxMembers && `/${maxMembers}`}
            </span>
          </div>
        </div>

        {/* Title & Creator */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-lg line-clamp-1">{party.name}</h3>
          {isCreator && (
            <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)] flex-shrink-0" />
          )}
        </div>
        
        {party.creator && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-5 h-5">
              <AvatarImage src={party.creator.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {(party.creator.display_name || party.creator.username || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              par {party.creator.display_name || party.creator.username}
            </span>
            {party.creator_event_role && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs py-0 px-1.5",
                  party.creator_event_role === 'cosplayer' && "border-sakura/50 text-sakura",
                  party.creator_event_role === 'staff' && "border-yellow-500/50 text-yellow-500",
                  party.creator_event_role === 'volunteer' && "border-yellow-500/50 text-yellow-500",
                  (!party.creator_event_role || party.creator_event_role === 'visitor') && "border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {party.creator_event_role === 'cosplayer' && "🎭 Cosplayer"}
                {party.creator_event_role === 'staff' && "🛡️ Staff"}
                {party.creator_event_role === 'volunteer' && "🛡️ Bénévole"}
                {(!party.creator_event_role || party.creator_event_role === 'visitor') && "🎫 Visiteur"}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {party.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {party.description}
          </p>
        )}

        {/* Tags */}
        {party.tags && party.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {party.tags.slice(0, 4).map((tag) => {
              const TagIcon = TAG_ICONS[tag] || Users;
              return (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs gap-1 py-0.5"
                >
                  <TagIcon className="w-3 h-3" />
                  {tag}
                </Badge>
              );
            })}
            {party.tags.length > 4 && (
              <Badge variant="outline" className="text-xs py-0.5">
                +{party.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Slots preview for shooting/concours - Show character avatars/icons */}
        {(party.mode === 'shooting' || party.mode === 'concours') && party.slots && party.slots.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {party.slots.slice(0, 4).map((slot, idx) => {
              // Check if slot has extended metadata (from CharacterSlotSearch)
              const slotData = slot as PartySlot & { 
                image_url?: string; 
                universe_name?: string;
                character_id?: string;
              };
              return (
                <Badge 
                  key={idx} 
                  variant={slot.filled_by ? "default" : "outline"}
                  className={cn(
                    "text-xs py-0.5 gap-1.5 flex items-center",
                    !slot.filled_by && "border-dashed border-muted-foreground/50"
                  )}
                >
                  {slotData.image_url ? (
                    <img 
                      src={slotData.image_url} 
                      alt={slot.label}
                      className="w-4 h-4 rounded-sm object-cover -ml-0.5"
                    />
                  ) : (
                    <span className="text-muted-foreground">?</span>
                  )}
                  <span className={cn(
                    "truncate max-w-20",
                    slot.filled_by && "font-medium"
                  )}>
                    {slot.label}
                  </span>
                  {slot.filled_by && <span className="text-xs">✓</span>}
                </Badge>
              );
            })}
            {party.slots.length > 4 && (
              <Badge variant="outline" className="text-xs py-0.5 border-dashed">
                +{party.slots.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {(isCreator || isMember) ? (
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "flex-1 gap-2 cursor-default",
                isCreator
                  ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15"
                  : "bg-success/15 text-success border border-success/30 hover:bg-success/15"
              )}
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              {isCreator ? (
                <>
                  <Crown className="w-4 h-4" />
                  👑 Créateur
                </>
              ) : (
                <>
                  <span>✅</span>
                  Vous êtes dans le groupe
                </>
              )}
            </Button>
          ) : hasPendingRequest ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-2 bg-muted text-muted-foreground cursor-not-allowed"
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              <span className="animate-pulse">⏳</span>
              Demande envoyée
            </Button>
          ) : isFull ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 cursor-not-allowed opacity-70"
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              Complet
            </Button>
          ) : (
            onJoin && (
              <Button
                size="sm"
                className={cn(
                  "flex-1 gap-2",
                  party.mode === "squad" && "bg-turquoise hover:bg-turquoise/90 text-tokyo-night",
                  party.mode === "shooting" && "bg-blue-500 hover:bg-blue-600",
                  party.mode === "concours" && "bg-sakura hover:bg-sakura/90"
                )}
                onClick={handleActionClick}
              >
                <UserPlus className="w-4 h-4" />
                Demander à rejoindre
              </Button>
            )
          )}
        </div>
      </Card>
    </motion.div>
  );
}
