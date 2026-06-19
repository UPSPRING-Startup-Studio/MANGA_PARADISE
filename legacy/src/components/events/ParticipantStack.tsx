import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ActivityParticipant } from "@/hooks/useActivityParticipation";

interface ParticipantStackProps {
  participants: ActivityParticipant[];
  totalCount: number;
  maxAvatars?: number;
  className?: string;
}

/**
 * ParticipantStack - Displays a stack of participant avatars with a count
 * Shows the first N avatars in a facepile with a tooltip showing all names
 */
export default function ParticipantStack({
  participants,
  totalCount,
  maxAvatars = 3,
  className,
}: ParticipantStackProps) {
  // Safety check: ensure participants is a valid array
  if (!Array.isArray(participants)) {
    participants = [];
  }

  // If no participants, show fallback counter
  if (totalCount === 0) {
    return null;
  }

  // If totalCount > 0 but no participants array, show counter only
  if (participants.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mt-1.5">
        <Users className="w-3.5 h-3.5" />
        <span className="tabular-nums">{totalCount}</span>
      </div>
    );
  }

  // Filter out invalid participants - only require id and username
  const validParticipants = participants.filter((p) => p && p.id && p.username);
  
  if (validParticipants.length === 0) {
    console.warn("DEBUG ParticipantStack - No valid participants after filtering");
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mt-1.5">
        <Users className="w-3.5 h-3.5" />
        <span className="tabular-nums">{totalCount}</span>
      </div>
    );
  }

  const displayedParticipants = validParticipants.slice(0, maxAvatars);
  const remainingCount = totalCount - maxAvatars;

  // Generate tooltip text with participant names - use username as fallback
  const getTooltipText = () => {
    if (validParticipants.length === 0) return "";
    
    if (validParticipants.length <= 3) {
      // Show all names
      return validParticipants.map((p) => p.display_name || p.username).join(", ");
    } else {
      // Show first 3 names + "et X autres..."
      const firstThree = validParticipants.slice(0, 3).map((p) => p.display_name || p.username).join(", ");
      const others = validParticipants.length - 3;
      return `${firstThree} et ${others} autre${others > 1 ? "s" : ""}...`;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={cn("flex items-center gap-2", className)}
        >
           {/* Avatar Stack */}
           <div className="flex -space-x-2">
             {displayedParticipants.map((participant, idx) => (
               <motion.div
                 key={participant.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
               >
                 <Link to={`/profile/${participant?.username || '?'}`}>
                   <Avatar className="w-6 h-6 border-2 border-background ring-1 ring-[hsl(var(--mp-primary))]/30 hover:ring-[hsl(var(--mp-primary))] transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer">
                     <AvatarImage
                       src={participant?.avatar_url || undefined}
                       alt={participant?.display_name || 'Participant'}
                     />
                     <AvatarFallback className="text-[10px] bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-purple-500/20 text-white">
                       {(participant?.display_name || '?').charAt(0).toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                 </Link>
               </motion.div>
             ))}
           </div>

          {/* Count Badge */}
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-[hsl(var(--mp-primary))] transition-colors">
            <Users className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {totalCount}
            </span>
          </div>
        </motion.div>
      </TooltipTrigger>

       <TooltipContent
         side="top"
         className="max-w-xs bg-black/90 backdrop-blur-md border-[hsl(var(--mp-primary))]/30 text-white"
       >
         <div className="space-y-1">
           <p className="text-xs font-semibold text-[hsl(var(--mp-primary))]">
             {totalCount} participant{totalCount > 1 ? "s" : ""}
           </p>
           <p className="text-xs text-slate-300 leading-relaxed">
             {getTooltipText()}
           </p>
           <p className="text-xs text-[hsl(var(--mp-info))] mt-2 pt-1 border-t border-white/10">
             Clique pour découvrir ce cosplayeur
           </p>
         </div>
       </TooltipContent>
    </Tooltip>
  );
}
