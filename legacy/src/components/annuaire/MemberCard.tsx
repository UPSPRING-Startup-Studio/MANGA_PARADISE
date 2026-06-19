import { Clock, User, Drama, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { OTAKU_CLASSES, MEMBER_ROLES, type OtakuClassId } from "@/lib/constants";
import MemberBadge from "./MemberBadge";
import FriendButton from "@/components/friends/FriendButton";

export interface MemberProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  avatar_url: string | null;
  membership_tier: string | null;
  role_function: string | null;
  otaku_class: string | null;
  favorite_activities: string[] | null;
  favorite_manga: string | null;
  is_creator_profile_active: boolean | null;
}

interface MemberCardProps {
  member: MemberProfile;
  onClick: () => void;
  cosplayCount?: number;
  libraryCount?: number;
}

const tierColors = {
  gold: "border-accent ring-accent/30",
  silver: "border-gray-400 ring-gray-400/30",
  bronze: "border-amber-600 ring-amber-600/30",
};

// Helper pour récupérer le label de classe depuis les constantes RI
const getClassLabel = (classId: string | null): string | null => {
  if (!classId) return null;
  const classInfo = OTAKU_CLASSES[classId as OtakuClassId];
  return classInfo ? `${classInfo.emoji} ${classInfo.label}` : classId;
};

// Helper pour récupérer le label de rôle
const getRoleLabel = (roleId: string | null): string | null => {
  if (!roleId) return null;
  return MEMBER_ROLES[roleId as keyof typeof MEMBER_ROLES] || roleId;
};

const MemberCard = ({ member, onClick, cosplayCount = 0, libraryCount = 0 }: MemberCardProps) => {
  const tier = (member.membership_tier || "bronze") as keyof typeof tierColors;
  const anciennete = 0; // Removed member_since dependency

  const displayName = member.display_name || member.username || "Membre";
  const roleLabel = getRoleLabel(member.role_function);
  const classLabel = getClassLabel(member.otaku_class);
  const activities = member.favorite_activities?.slice(0, 2) || [];

  const hasCosplays = cosplayCount > 0;
  const hasBigLibrary = libraryCount > 10;
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer",
        "bg-tokyo-night/60 backdrop-blur-md rounded-2xl",
        "border border-white/10 hover:border-sakura/40",
        "p-5 transition-all duration-300",
        "hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-sakura/10"
      )}
    >
      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-2xl",
            "bg-gradient-hero border-2 ring-2",
            tierColors[tier],
            "overflow-hidden flex-shrink-0"
          )}
        >
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-display text-lg tracking-wide truncate group-hover:text-sakura transition-colors">
            {displayName}
          </h3>
          {member.first_name && (
            <p className="text-white/50 text-sm truncate">{member.first_name}</p>
          )}
          {/* Ancienneté */}
          <div className="flex items-center gap-1 mt-1 text-white/40 text-xs">
            <Clock className="w-3 h-3" />
            <span>{anciennete} mois</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {roleLabel && roleLabel !== "Membre" && (
          <MemberBadge type="role">{roleLabel}</MemberBadge>
        )}
        {classLabel && (
          <MemberBadge type="class">{classLabel}</MemberBadge>
        )}
        {member.is_creator_profile_active && (
          <MemberBadge type="status">Créateur</MemberBadge>
        )}
      </div>

      {/* Activities Preview */}
      {activities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activities.map((activity, i) => (
            <MemberBadge key={i} type="activity">
              {activity}
            </MemberBadge>
          ))}
        </div>
      )}

      {/* Friend Button - stop propagation to prevent card click */}
      <div 
        className="mt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <FriendButton 
          targetUserId={member.id} 
          size="sm" 
          variant="outline"
          className="w-full"
        />
      </div>

      {/* Collection indicators */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {hasCosplays && (
          <div className="flex items-center gap-1 bg-sakura/20 px-2 py-1 rounded-full">
            <Drama className="w-3 h-3 text-sakura" />
            <span className="text-sakura text-[10px] font-medium">{cosplayCount}</span>
          </div>
        )}
        {hasBigLibrary && (
          <div className="flex items-center gap-1 bg-turquoise/20 px-2 py-1 rounded-full">
            <BookOpen className="w-3 h-3 text-turquoise" />
            <span className="text-turquoise text-[10px] font-medium">{libraryCount}</span>
          </div>
        )}
        <span className="text-sakura text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Voir le profil →
        </span>
      </div>
    </div>
  );
};

export default MemberCard;
