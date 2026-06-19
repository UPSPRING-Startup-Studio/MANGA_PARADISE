import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Sparkles,
  Swords,
  Crown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Check,
  X,
  LogOut,
  Trash2,
  Shield,
  UserCheck,
  Hourglass,
  Calendar,
  Shirt,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { CreateSquadWizard } from "@/components/cosplay/CreateSquadWizard";
import { PartyFinderHub } from "@/components/cosplay/PartyFinderHub";
import { cn } from "@/lib/utils";
import { CosplayPlan } from "@/hooks/useCosplans";
import {
  useSquadsByEvent,
  useSquadMembers,
  useUserSquadForEvent,
  useJoinSquad,
  useAcceptMember,
  useDeclineMember,
  useLeaveSquad,
  Squad,
  SquadMember,
} from "@/hooks/useSquads";
import { useAuth } from "@/contexts/AuthContext";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";

// =====================================================
// PROPS
// =====================================================

/**
 * PartyFinderModal — Agnostic version.
 *
 * Can be opened from 3 contexts:
 *   1. From a cosplay plan (cosplayPlanId + cosplayName provided, eventId optional)
 *   2. From an event page (eventId provided, cosplayPlanId optional)
 *   3. Legacy: plan prop (CosplayPlan) — kept for backward compatibility
 *
 * If both eventId and cosplayPlanId are provided, the modal opens directly on the main view.
 * If one is missing, an "Étape 0" selection screen is shown first.
 */
interface PartyFinderModalProps {
  open: boolean;
  onClose: () => void;
  /** Legacy: full CosplayPlan object (backward compat) */
  plan?: CosplayPlan | null;
  /** Direct: cosplay plan ID (agnostic mode) */
  cosplayPlanId?: string | null;
  /** Direct: cosplay name for display (agnostic mode) */
  cosplayName?: string | null;
  /** Direct: event ID (agnostic mode) */
  eventId?: string | null;
}

// =====================================================
// SUB-COMPONENT: Squad Card (for "Rejoindre" tab)
// =====================================================

interface SquadCardProps {
  squad: Squad;
  onApply: (squadId: string) => void;
  isApplying: boolean;
  currentUserId: string;
}

const SquadCard = ({
  squad,
  onApply,
  isApplying,
  currentUserId,
}: SquadCardProps) => {
  const isOwner = squad.created_by === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-black/40 backdrop-blur-md",
        "border border-white/10",
        "hover:border-[hsl(var(--mp-info))]/40",
        "transition-all duration-300",
        "group"
      )}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[hsl(var(--mp-info))]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Swords className="w-4 h-4 text-[hsl(var(--mp-info))] flex-shrink-0" />
            <h4 className="font-display text-base text-white truncate">
              {squad.name}
            </h4>
            {isOwner && (
              <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30 text-xs flex-shrink-0">
                <Crown className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            )}
          </div>

          {squad.description && (
            <p className="text-sm text-mp-ink-muted line-clamp-2 mb-3">
              {squad.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarImage src={squad.creator_avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))]">
                  {squad.creator_username?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-mp-ink-muted">
                {squad.creator_username}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-mp-ink-muted">
              <Users className="w-3.5 h-3.5" />
              <span>
                {squad.member_count ?? 0} membre
                {(squad.member_count ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {!isOwner && (
          <Button
            size="sm"
            onClick={() => onApply(squad.id)}
            disabled={isApplying}
            className={cn(
              "flex-shrink-0",
              "bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10",
              "border border-[hsl(var(--mp-info))]/40",
              "text-[hsl(var(--mp-info))]",
              "hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20",
              "hover:border-[hsl(var(--mp-info))]/60",
              "hover:shadow-[0_0_12px_rgba(0,240,255,0.3)]",
              "transition-all duration-200"
            )}
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Postuler
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================
// SUB-COMPONENT: Member Row (shared between leader/member views)
// =====================================================

interface MemberRowProps {
  member: SquadMember;
  isLeader?: boolean;
  onAccept?: (userId: string) => void;
  onDecline?: (userId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

const MemberRow = ({
  member,
  isLeader = false,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: MemberRowProps) => {
  const isPending = member.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-xl",
        "bg-black/30 backdrop-blur-sm",
        "border",
        isPending
          ? "border-[hsl(var(--mp-saffron))]/20 bg-[hsl(var(--mp-saffron))]/5"
          : "border-white/10"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={member.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm bg-gradient-to-br from-[hsl(var(--mp-primary))]/30 to-[hsl(var(--mp-info))]/30 text-white">
            {member.username?.charAt(0).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">
              {member.username}
            </p>
            {isPending ? (
              <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30 text-xs">
                <Hourglass className="w-3 h-3 mr-1" />
                En attente
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                <UserCheck className="w-3 h-3 mr-1" />
                Membre
              </Badge>
            )}
          </div>
          {member.character_name && (
            <p className="text-xs text-mp-ink-muted truncate">
              🎭 {member.character_name}
            </p>
          )}
        </div>
      </div>

      {/* Leader actions for pending members */}
      {isLeader && isPending && onAccept && onDecline && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => onAccept(member.user_id)}
            disabled={isAccepting || isDeclining}
            className={cn(
              "h-8 w-8 p-0",
              "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
              "hover:bg-emerald-500/30 hover:border-emerald-500/60",
              "hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]",
              "transition-all duration-200"
            )}
          >
            {isAccepting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => onDecline(member.user_id)}
            disabled={isAccepting || isDeclining}
            className={cn(
              "h-8 w-8 p-0",
              "bg-red-500/20 border border-red-500/40 text-red-400",
              "hover:bg-red-500/30 hover:border-red-500/60",
              "hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]",
              "transition-all duration-200"
            )}
          >
            {isDeclining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// =====================================================
// SUB-COMPONENT: My Squad View (Leader)
// =====================================================

interface LeaderViewProps {
  squadId: string;
  squadName: string;
  squadDescription: string | null;
  userId: string;
  targetEventId: string | null;
  onClose: () => void;
}

const LeaderView = ({
  squadId,
  squadName,
  squadDescription,
  userId,
  targetEventId,
  onClose,
}: LeaderViewProps) => {
  const { data: members, isLoading } = useSquadMembers(squadId);
  const acceptMutation = useAcceptMember();
  const declineMutation = useDeclineMember();
  const leaveSquadMutation = useLeaveSquad();

  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(null);

  const pendingMembers = members?.filter((m) => m.status === "pending") ?? [];
  const acceptedMembers = members?.filter((m) => m.status === "accepted") ?? [];

  const handleAccept = async (memberId: string) => {
    setActionUserId(memberId);
    setActionType("accept");
    try {
      await acceptMutation.mutateAsync({ squadId, userId: memberId });
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleDecline = async (memberId: string) => {
    setActionUserId(memberId);
    setActionType("decline");
    try {
      await declineMutation.mutateAsync({ squadId, userId: memberId });
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleDissolve = async () => {
    await leaveSquadMutation.mutateAsync({
      squadId,
      userId,
      isLeader: true,
      targetEventId,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Squad Header */}
      <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-[hsl(var(--mp-saffron))]/10 via-black/40 to-[hsl(var(--mp-primary))]/10 border border-[hsl(var(--mp-saffron))]/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--mp-saffron))]/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--mp-saffron))] to-[hsl(var(--mp-primary))] flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display text-base text-white truncate">
                {squadName}
              </h4>
              <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30 text-xs flex-shrink-0">
                <Shield className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            </div>
            {squadDescription && (
              <p className="text-xs text-mp-ink-muted">{squadDescription}</p>
            )}
            <p className="text-xs text-mp-ink-muted mt-1">
              {acceptedMembers.length} membre
              {acceptedMembers.length !== 1 ? "s" : ""} accepté
              {acceptedMembers.length !== 1 ? "s" : ""}
              {pendingMembers.length > 0 && (
                <span className="text-[hsl(var(--mp-saffron))] ml-2">
                  · {pendingMembers.length} candidature
                  {pendingMembers.length !== 1 ? "s" : ""} en attente
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[hsl(var(--mp-info))] animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending Applications */}
          {pendingMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                <h5 className="text-sm font-medium text-[hsl(var(--mp-saffron))]">
                  Candidatures en attente ({pendingMembers.length})
                </h5>
              </div>
              <div className="space-y-2">
                {pendingMembers.map((member) => (
                  <MemberRow
                    key={member.user_id}
                    member={member}
                    isLeader
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    isAccepting={
                      actionUserId === member.user_id && actionType === "accept"
                    }
                    isDeclining={
                      actionUserId === member.user_id && actionType === "decline"
                    }
                  />
                ))}
              </div>
              <Separator className="bg-white/10" />
            </div>
          )}

          {/* Accepted Members */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[hsl(var(--mp-info))]" />
              <h5 className="text-sm font-medium text-[hsl(var(--mp-info))]">
                Membres de l'escouade ({acceptedMembers.length})
              </h5>
            </div>
            {acceptedMembers.length === 0 ? (
              <p className="text-xs text-mp-ink-muted text-center py-4">
                Aucun membre accepté pour l'instant.
              </p>
            ) : (
              <div className="space-y-2">
                {acceptedMembers.map((member) => (
                  <MemberRow key={member.user_id} member={member} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dissolve Squad */}
      <Separator className="bg-white/10" />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleDissolve}
          disabled={leaveSquadMutation.isPending}
          className={cn(
            "border-red-500/40 text-red-400",
            "hover:bg-red-500/10 hover:border-red-500/60",
            "hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]",
            "transition-all duration-200"
          )}
        >
          {leaveSquadMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Dissoudre l'escouade
        </Button>
      </div>
    </motion.div>
  );
};

// =====================================================
// SUB-COMPONENT: My Squad View (Regular Member)
// =====================================================

interface MemberViewProps {
  squadId: string;
  squadName: string;
  squadDescription: string | null;
  userId: string;
  targetEventId: string | null;
  memberStatus: "pending" | "accepted";
  onClose: () => void;
}

const MemberView = ({
  squadId,
  squadName,
  squadDescription,
  userId,
  targetEventId,
  memberStatus,
  onClose,
}: MemberViewProps) => {
  const { data: members, isLoading } = useSquadMembers(squadId);
  const leaveSquadMutation = useLeaveSquad();

  const acceptedMembers = members?.filter((m) => m.status === "accepted") ?? [];

  const handleLeave = async () => {
    await leaveSquadMutation.mutateAsync({
      squadId,
      userId,
      isLeader: false,
      targetEventId,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Squad Header */}
      <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-[hsl(var(--mp-info))]/10 via-black/40 to-[hsl(var(--mp-saffron))]/10 border border-[hsl(var(--mp-info))]/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--mp-info))]/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--mp-info))] to-[hsl(var(--mp-saffron))] flex items-center justify-center flex-shrink-0">
            <Swords className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-base text-white truncate mb-1">
              {squadName}
            </h4>
            {squadDescription && (
              <p className="text-xs text-mp-ink-muted">{squadDescription}</p>
            )}
            {memberStatus === "pending" && (
              <div className="mt-2 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))]" />
                <span className="text-xs text-[hsl(var(--mp-saffron))]">
                  Ta candidature est en attente d'approbation du leader.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members List */}
      {memberStatus === "accepted" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[hsl(var(--mp-info))]" />
            <h5 className="text-sm font-medium text-[hsl(var(--mp-info))]">
              Membres de l'escouade
            </h5>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-[hsl(var(--mp-info))] animate-spin" />
            </div>
          ) : acceptedMembers.length === 0 ? (
            <p className="text-xs text-mp-ink-muted text-center py-4">
              Aucun membre pour l'instant.
            </p>
          ) : (
            <div className="space-y-2">
              {acceptedMembers.map((member) => (
                <MemberRow key={member.user_id} member={member} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Squad */}
      <Separator className="bg-white/10" />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleLeave}
          disabled={leaveSquadMutation.isPending}
          className={cn(
            "border-red-500/40 text-red-400",
            "hover:bg-red-500/10 hover:border-red-500/60",
            "hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]",
            "transition-all duration-200"
          )}
        >
          {leaveSquadMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Quitter l'escouade
        </Button>
      </div>
    </motion.div>
  );
};

// =====================================================
// SUB-COMPONENT: Empty State
// =====================================================

const EmptySquadsState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--mp-saffron))]/20 to-[hsl(var(--mp-primary))]/20 border border-[hsl(var(--mp-saffron))]/30 flex items-center justify-center mb-4">
      <Swords className="w-8 h-8 text-[hsl(var(--mp-saffron))]" />
    </div>
    <h4 className="font-display text-lg text-white mb-2">
      Aucune escouade pour cet événement
    </h4>
    <p className="text-sm text-mp-ink-muted max-w-xs">
      Sois le premier à créer une escouade et recrute tes nakamas !
    </p>
  </motion.div>
);

// =====================================================
// SUB-COMPONENT: Step 0 — Select missing info
// =====================================================

interface Step0SelectionProps {
  /** Which info is missing */
  missingInfo: "event" | "cosplay";
  /** Current user ID */
  userId: string;
  /** Pre-filled cosplay plan ID (when event is missing) */
  cosplayPlanId?: string | null;
  /** Pre-filled cosplay name (when event is missing) */
  cosplayName?: string | null;
  /** Pre-filled event ID (when cosplay is missing) */
  eventId?: string | null;
  onConfirm: (resolvedEventId: string, resolvedCosplayPlanId: string, resolvedCosplayName: string) => void;
  onClose: () => void;
}

function Step0Selection({
  missingInfo,
  userId,
  cosplayPlanId,
  cosplayName,
  eventId,
  onConfirm,
  onClose,
}: Step0SelectionProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedCosplayId, setSelectedCosplayId] = useState<string>("");

  const { data: upcomingEvents = [], isLoading: isLoadingEvents } = useUpcomingEvents();
  const { data: wardrobeItems = [], isLoading: isLoadingCosplays } = useWardrobeItems(userId);

  const handleConfirm = () => {
    if (missingInfo === "event") {
      if (!selectedEventId || !cosplayPlanId || !cosplayName) return;
      onConfirm(selectedEventId, cosplayPlanId, cosplayName);
    } else {
      if (!selectedCosplayId || !eventId) return;
      const selectedCosplay = wardrobeItems.find((c) => c.id === selectedCosplayId);
      onConfirm(eventId, selectedCosplayId, selectedCosplay?.character_name ?? "");
    }
  };

  const canConfirm =
    missingInfo === "event" ? !!selectedEventId : !!selectedCosplayId;

  return (
    <motion.div
      key="step0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 py-2"
    >
      {/* Context banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/20">
        {missingInfo === "event" ? (
          <Calendar className="w-5 h-5 text-[hsl(var(--mp-info))] flex-shrink-0 mt-0.5" />
        ) : (
          <Shirt className="w-5 h-5 text-[hsl(var(--mp-primary))] flex-shrink-0 mt-0.5" />
        )}
        <p className="text-sm text-slate-300">
          {missingInfo === "event" ? (
            <>
              Pour quel événement souhaites-tu trouver une escouade avec{" "}
              <span className="text-white font-semibold">{cosplayName}</span> ?
            </>
          ) : (
            <>
              Avec quel cosplay souhaites-tu rejoindre une escouade pour cet événement ?
            </>
          )}
        </p>
      </div>

      {/* Selector */}
      {missingInfo === "event" ? (
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
            Choisir un événement
          </Label>
          {isLoadingEvents ? (
            <div className="flex items-center gap-2 text-mp-ink-muted text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-mp-ink-muted py-3">Aucun événement futur disponible.</p>
          ) : (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white focus:border-[hsl(var(--mp-info))]/50 h-12">
                <SelectValue placeholder="Sélectionner un événement…" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                {upcomingEvents.map((event) => {
                  const dateStr = new Date(event.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <SelectItem key={event.id} value={event.id} className="focus:bg-white/10 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-mp-ink-muted">
                          {dateStr}{event.city ? ` · ${event.city}` : ""}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-[hsl(var(--mp-primary))]" />
            Choisir un cosplay
          </Label>
          {isLoadingCosplays ? (
            <div className="flex items-center gap-2 text-mp-ink-muted text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : wardrobeItems.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Shirt className="w-10 h-10 text-mp-ink-muted mx-auto" />
              <p className="text-sm text-mp-ink-muted">Aucun cosplay dans ton vestiaire.</p>
              <p className="text-xs text-mp-ink-muted">
                Crée d'abord un projet cosplay pour pouvoir rejoindre une escouade.
              </p>
            </div>
          ) : (
            <Select value={selectedCosplayId} onValueChange={setSelectedCosplayId}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white focus:border-[hsl(var(--mp-primary))]/50 h-12">
                <SelectValue placeholder="Sélectionner un cosplay…" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                {wardrobeItems.map((cosplay) => (
                  <SelectItem key={cosplay.id} value={cosplay.id} className="focus:bg-white/10 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{cosplay.character_name}</span>
                      <span className="text-xs text-mp-ink-muted">{cosplay.universe}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
        >
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={cn(
            "flex-1 font-bold",
            "bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10",
            "border border-[hsl(var(--mp-info))]/50 text-[hsl(var(--mp-info))]",
            "hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20",
            "hover:border-[hsl(var(--mp-info))]/80",
            "hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// =====================================================
// MAIN COMPONENT: PartyFinderModal
// =====================================================

export const PartyFinderModal = ({
  open,
  onClose,
  plan,
  cosplayPlanId: propCosplayPlanId,
  cosplayName: propCosplayName,
  eventId: propEventId,
}: PartyFinderModalProps) => {
  const { user } = useAuth();

  // View state: "hub" = browse squads, "wizard" = create squad
  const [view, setView] = useState<"hub" | "wizard">("hub");

  // ── Resolve IDs from props (legacy plan OR agnostic mode) ──────────────────
  const [resolvedEventId, setResolvedEventId] = useState<string | null>(null);
  const [resolvedCosplayPlanId, setResolvedCosplayPlanId] = useState<string | null>(null);
  const [resolvedCosplayName, setResolvedCosplayName] = useState<string | null>(null);

  // Effective IDs: prefer resolved (from Step 0) > direct props > legacy plan
  const effectiveEventId =
    resolvedEventId ??
    propEventId ??
    plan?.target_event_id ??
    null;

  const effectiveCosplayPlanId =
    resolvedCosplayPlanId ??
    propCosplayPlanId ??
    plan?.id ??
    null;

  const effectiveCosplayName =
    resolvedCosplayName ??
    propCosplayName ??
    plan?.character_name ??
    null;

  // ── Determine if Step 0 is needed ─────────────────────────────────────────
  // Step 0 only requires an event — cosplay is now optional in the new flow
  const needsEventSelection = !effectiveEventId;
  const showStep0 = needsEventSelection;
  const step0MissingInfo: "event" | "cosplay" = "event";

  // Handle Step 0 confirmation
  const handleStep0Confirm = (
    resolvedEvId: string,
    resolvedCpId: string,
    resolvedCpName: string
  ) => {
    setResolvedEventId(resolvedEvId);
    setResolvedCosplayPlanId(resolvedCpId);
    setResolvedCosplayName(resolvedCpName);
  };

  // Reset state when modal closes
  const handleClose = () => {
    setResolvedEventId(null);
    setResolvedCosplayPlanId(null);
    setResolvedCosplayName(null);
    setView("hub");
    onClose();
  };

  // Check if user is already in a squad for this event
  const { data: userMembership, isLoading: membershipLoading } =
    useUserSquadForEvent(user?.id, effectiveEventId);

  // =====================================================
  // DETERMINE VIEW MODE
  // =====================================================

  const isInSquad = !!userMembership;
  const isLeader =
    isInSquad && userMembership?.squad?.created_by === user?.id;

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-[hsl(var(--mp-info))]/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-display">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--mp-info))] to-[hsl(var(--mp-saffron))] flex items-center justify-center">
              <Swords className="w-4 h-4 text-black" />
            </div>
            <span className="bg-gradient-to-r from-[hsl(var(--mp-info))] to-[hsl(var(--mp-saffron))] bg-clip-text text-transparent">
              Party Finder
            </span>
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            {showStep0 ? (
              <>Choisis l'événement pour lequel tu cherches une escouade.</>
            ) : isInSquad ? (
              <>
                Tu es{" "}
                {isLeader ? (
                  <span className="text-[hsl(var(--mp-saffron))] font-medium">leader</span>
                ) : (
                  <span className="text-[hsl(var(--mp-info))] font-medium">membre</span>
                )}{" "}
                de l'escouade{" "}
                <span className="text-white font-medium">
                  "{userMembership?.squad?.name}"
                </span>
              </>
            ) : view === "wizard" ? (
              <>Crée ton escouade en 3 étapes et définis les places disponibles.</>
            ) : (
              <>
                Parcours les escouades disponibles · Postule à une place · Cosplay avec des nakamas !
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ==================== STEP 0: SELECT EVENT ==================== */}
          {showStep0 ? (
            <Step0Selection
              key="step0"
              missingInfo={step0MissingInfo}
              userId={user?.id ?? ""}
              cosplayPlanId={effectiveCosplayPlanId}
              cosplayName={effectiveCosplayName}
              eventId={effectiveEventId}
              onConfirm={handleStep0Confirm}
              onClose={handleClose}
            />
          ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
          {/* Loading membership check */}
          {membershipLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[hsl(var(--mp-info))] animate-spin" />
            </div>
          ) : isInSquad && userMembership ? (
            // ==================== MY SQUAD VIEW ====================
            <AnimatePresence mode="wait">
              {isLeader ? (
                <LeaderView
                  key="leader-view"
                  squadId={userMembership.squad_id}
                  squadName={userMembership.squad.name}
                  squadDescription={userMembership.squad.description}
                  userId={user!.id}
                  targetEventId={effectiveEventId}
                  onClose={handleClose}
                />
              ) : (
                <MemberView
                  key="member-view"
                  squadId={userMembership.squad_id}
                  squadName={userMembership.squad.name}
                  squadDescription={userMembership.squad.description}
                  userId={user!.id}
                  targetEventId={effectiveEventId}
                  memberStatus={userMembership.status}
                  onClose={handleClose}
                />
              )}
            </AnimatePresence>
          ) : (
            // ==================== HUB / WIZARD VIEW ====================
            <AnimatePresence mode="wait">
              {view === "wizard" ? (
                <motion.div
                  key="wizard-view"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Back to hub button */}
                  <button
                    type="button"
                    onClick={() => setView("hub")}
                    className="flex items-center gap-1.5 text-xs text-mp-ink-muted hover:text-white mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Retour au Party Finder
                  </button>

                  {effectiveEventId && user && (
                    <CreateSquadWizard
                      targetEventId={effectiveEventId}
                      userId={user.id}
                      cosplayName={effectiveCosplayName}
                      onSuccess={() => setView("hub")}
                      onCancel={() => setView("hub")}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="hub-view"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                >
                  {effectiveEventId && user && (
                    <PartyFinderHub
                      eventId={effectiveEventId}
                      userId={user.id}
                      onCreateSquad={() => setView("wizard")}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-mp-ink-muted hover:text-white hover:bg-white/5"
            >
              Fermer
            </Button>
          </div>
          </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
