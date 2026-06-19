import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationMembership,
  type AssociationRole,
} from "@/hooks/useAssociation";

interface FicheTeamSectionProps {
  members: AssociationMembership[];
  visibleRoles: string[];
  showBureau: boolean;
  showStaff: boolean;
}

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
];

const STAFF_ROLES: AssociationRole[] = ["responsable", "benevole"];

const ROLE_COLORS: Record<string, string> = {
  president: "bg-sakura text-white",
  vice_president: "bg-sakura/80 text-white",
  tresorier: "bg-turquoise text-white",
  secretaire: "bg-accent text-white",
  responsable: "bg-purple-500 text-white",
  benevole: "bg-orange-500/80 text-white",
  membre: "bg-muted text-muted-foreground",
};

function MemberCard({ member }: { member: AssociationMembership }) {
  const displayName =
    member.profile?.display_name ||
    member.profile?.username ||
    "Membre";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Card className="bg-card/50 border-border/50 hover:border-sakura/30 transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
          <Avatar className="w-16 h-16 border-2 border-border group-hover:border-sakura/50 transition-colors">
            <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-muted text-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm leading-tight">
              {displayName}
            </p>
            {member.title && (
              <p className="text-xs text-muted-foreground">{member.title}</p>
            )}
            <Badge
              className={`text-xs ${
                ROLE_COLORS[member.role] || ROLE_COLORS.membre
              }`}
            >
              {ASSOCIATION_ROLE_LABELS[member.role] || member.role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const FicheTeamSection = ({
  members,
  visibleRoles,
  showBureau,
  showStaff,
}: FicheTeamSectionProps) => {
  // Filtrer les membres selon les rôles visibles dans la config
  const filteredMembers = members.filter((m) =>
    visibleRoles.includes(m.role)
  );

  const bureauMembers = filteredMembers.filter((m) =>
    BUREAU_ROLES.includes(m.role as AssociationRole)
  );
  const staffMembers = filteredMembers.filter((m) =>
    STAFF_ROLES.includes(m.role as AssociationRole)
  );

  const hasBureau = showBureau && bureauMembers.length > 0;
  const hasStaff = showStaff && staffMembers.length > 0;

  if (!hasBureau && !hasStaff) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-8"
    >
      <h2 className="text-2xl font-display text-foreground text-center flex items-center justify-center gap-2">
        <Users className="w-6 h-6 text-sakura" />
        L'Equipe
      </h2>

      {/* Bureau */}
      {hasBureau && (
        <div>
          <h3 className="text-lg font-display text-foreground mb-4 text-center">
            Bureau
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bureauMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Staff */}
      {hasStaff && (
        <div>
          <h3 className="text-lg font-display text-foreground mb-4 text-center">
            Staff
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {staffMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default FicheTeamSection;
