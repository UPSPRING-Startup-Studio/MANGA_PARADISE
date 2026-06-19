import { useState } from "react";
import { Clock, User, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagPinData {
  id: string;
  pin_x: number;
  pin_y: number;
  status: string;
  tagged_user_id?: string | null;
  tagged_name?: string | null;
  tagged_character?: string | null;
  tagged_social_link?: string | null;
  linked_cosplay_id?: string | null;
  profiles?: { username: string | null; avatar_url: string | null } | null;
  cosplay_plan?: { id: string; character_name: string; universe: string } | null;
}

interface PhotoTagPinProps {
  tag: TagPinData;
  isOwner: boolean;
  size: "sm" | "md" | "lg";
  onClick?: () => void;
}

// ─── Tailles ─────────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm:  { circle: "w-6 h-6",   icon: "w-2.5 h-2.5", fallbackText: "text-[8px]",  ring: "ring-2",      showLabel: false },
  md:  { circle: "w-10 h-10", icon: "w-5 h-5",     fallbackText: "text-xs",     ring: "ring-[3px]",  showLabel: true  },
  lg:  { circle: "w-14 h-14", icon: "w-7 h-7",     fallbackText: "text-base",   ring: "ring-[3px]",  showLabel: true  },
} as const;

// ─── Composant ────────────────────────────────────────────────────────────────

export function PhotoTagPin({ tag, isOwner, size, onClick }: PhotoTagPinProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  if (tag.status === "declined") return null;

  const isMember    = !!tag.tagged_user_id;
  const isPending   = tag.status === "pending";
  const isAccepted  = tag.status === "accepted";
  const isNonMember = !isMember && isAccepted;

  const username  = tag.profiles?.username;
  const avatarUrl = tag.profiles?.avatar_url;

  const cfg = SIZE_CONFIG[size];
  const interactive = size === "md" || size === "lg";

  // ── Styles de cercle selon statut ────────────────────────────────────────

  const circleClass = cn(
    cfg.circle,
    "rounded-full flex items-center justify-center overflow-hidden relative",
    isPending   && cn(cfg.ring, "ring-orange-300/50 bg-orange-500/90"),
    isAccepted && isMember  && cn(cfg.ring, "ring-green-400 bg-green-500/20"),
    isNonMember             && cn(cfg.ring, "ring-gray-400/30 bg-gray-500/60")
  );

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    if (onClick) { onClick(); return; }
    setShowTooltip((v) => !v);
  };

  // ── Contenu du cercle ────────────────────────────────────────────────────

  const circleContent = (() => {
    if (isPending && isMember) {
      return (
        <>
          {avatarUrl && (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-orange-500/50" />
          {!avatarUrl && <Clock className={cn("text-white", cfg.icon)} />}
        </>
      );
    }
    if (isAccepted && isMember) {
      return avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        : (
          <AvatarFallback className={cn("w-full h-full rounded-full bg-white/20 text-white", cfg.fallbackText)}>
            {(username ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        );
    }
    if (isNonMember) {
      return <User className={cn("text-white/50", cfg.icon)} />;
    }
    return null;
  })();

  // ── Tooltip (md / lg seulement, au tap) ─────────────────────────────────

  const tooltip = (() => {
    if (!interactive || !showTooltip) return null;

    if (isPending) {
      return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none whitespace-nowrap bg-[#1A1A2E] border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-center">
          <p className="text-xs text-white/70">
            En attente d&apos;approbation{username ? ` de @${username}` : ""}
          </p>
          {isOwner && (
            <p className="text-[10px] text-orange-300 mt-0.5">· Tap pour annuler</p>
          )}
        </div>
      );
    }

    if (isAccepted && isMember) {
      return (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-[#1A1A2E] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
            onClick={() => {
              if (tag.tagged_user_id) navigate(`/profile/${tag.tagged_user_id}`);
            }}
          >
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-[9px] bg-white/20 text-white">
                {(username ?? "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-medium truncate">
              @{username ?? "?"}
            </span>
          </button>

          {tag.linked_cosplay_id && tag.cosplay_plan ? (
            <button
              className="mt-1.5 text-left hover:opacity-80 transition-opacity w-full"
              onClick={() => {
                if (tag.linked_cosplay_id) navigate(`/cosplay/${tag.linked_cosplay_id}`);
              }}
            >
              <p className="text-xs text-white/50 truncate">
                en {tag.cosplay_plan.character_name}{" "}
                <span className="text-white/30">— {tag.cosplay_plan.universe}</span>
              </p>
            </button>
          ) : (
            <p className="mt-1 text-xs text-white/30">Cosplay non renseigné</p>
          )}
        </div>
      );
    }

    if (isNonMember) {
      return (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-[#1A1A2E] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-sm font-medium">{tag.tagged_name ?? "?"}</p>
          {tag.tagged_character && (
            <p className="text-xs text-white/50 mt-0.5">{tag.tagged_character}</p>
          )}
          {tag.tagged_social_link && (
            <a
              href={tag.tagged_social_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sakura hover:underline mt-1 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Voir le profil →
            </a>
          )}
        </div>
      );
    }

    return null;
  })();

  // ── Label permanent (md / lg) ───────────────────────────────────────────

  const displayName = username ? `@${username}` : (tag.tagged_name ?? null);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="absolute"
      style={{
        left: `${tag.pin_x * 100}%`,
        top:  `${tag.pin_y * 100}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radar ping pour les pending en md/lg */}
      {isPending && (size === "md" || size === "lg") && (
        <div
          className={cn("absolute rounded-full bg-orange-400 pointer-events-none", cfg.circle)}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ping-orange 2s infinite",
          }}
        />
      )}

      {/* Pin */}
      <motion.button
        className={cn(circleClass, interactive ? "cursor-pointer" : "pointer-events-none", "relative")}
        onClick={handleTap}
        animate={isPending && size === "sm" ? { scale: [1, 1.08, 1] } : {}}
        transition={isPending && size === "sm" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
        aria-label={username ?? tag.tagged_name ?? "Tag"}
      >
        {circleContent}
      </motion.button>

      {/* Badge check vert pour les accepted members en md/lg */}
      {isAccepted && isMember && (size === "md" || size === "lg") && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-black">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Label permanent sous le pin (md / lg) */}
      {cfg.showLabel && displayName && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <span className="text-[10px] text-white bg-black/60 rounded-full px-1.5 py-px">
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
}

export default PhotoTagPin;
