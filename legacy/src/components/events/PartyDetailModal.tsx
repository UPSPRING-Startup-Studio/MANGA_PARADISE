import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Camera, 
  Trophy, 
  Lock,
  UserPlus,
  LogOut,
  Trash2,
  Car,
  Utensils,
  Home,
  Music,
  Shirt,
  Heart,
  Crown,
  User,
  Send,
  Check,
  X,
  Edit3,
  Clock,
  UserMinus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  EventParty, 
  PartyMode, 
  useEventParty, 
  useLeaveParty, 
  useDeleteParty,
  useJoinParty,
  usePendingJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useKickMember,
  useUpdateParty,
  useHasPendingRequest
} from "@/hooks/useEventParties";
import InviteNakamaModal from "./InviteNakamaModal";

interface PartyDetailModalProps {
  party: EventParty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin?: (party: EventParty) => void;
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
  squad: { icon: Users, color: 'text-turquoise', bgColor: 'bg-turquoise/20', label: 'SQUAD' },
  shooting: { icon: Camera, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'SHOOTING' },
  concours: { icon: Trophy, color: 'text-sakura', bgColor: 'bg-sakura/20', label: 'CONCOURS' },
};

export default function PartyDetailModal({ party, open, onOpenChange, onJoin }: PartyDetailModalProps) {
  const { user } = useAuth();
  const { data: partyDetail } = useEventParty(party?.id);
  const { data: pendingRequests = [] } = usePendingJoinRequests(party?.id);
  const { data: hasPendingRequest } = useHasPendingRequest(party?.id, user?.id);
  const leaveParty = useLeaveParty();
  const deleteParty = useDeleteParty();
  const joinParty = useJoinParty();
  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();
  const kickMember = useKickMember();
  const updateParty = useUpdateParty();
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (!party) return null;

  const displayParty = partyDetail || party;
  const modeConfig = MODE_CONFIG[displayParty.mode];
  const ModeIcon = modeConfig.icon;
  
  const isCreator = displayParty.creator_id === user?.id;
  // Only count approved members
  const approvedMembers = displayParty.members?.filter(m => m.status === 'approved') || [];
  const isMember = approvedMembers.some(m => m.user_id === user?.id) || isCreator;
  const memberCount = approvedMembers.length;
  const maxMembers = displayParty.max_members;
  const isFull = maxMembers ? memberCount >= maxMembers : false;
  const isPrivate = displayParty.visibility === 'private';

  const handleLeave = async () => {
    if (!user?.id || !displayParty.id) return;
    await leaveParty.mutateAsync({ partyId: displayParty.id, userId: user.id });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!displayParty.id) return;
    await deleteParty.mutateAsync({ partyId: displayParty.id, eventId: displayParty.event_id });
    onOpenChange(false);
  };

  const handleJoin = async () => {
    if (!user?.id || !displayParty.id) return;
    // For public groups, create a pending request
    await joinParty.mutateAsync({ 
      partyId: displayParty.id, 
      userId: user.id,
      status: 'pending' 
    });
  };

  const handleApprove = async (memberId: string) => {
    if (!displayParty.id) return;
    await approveRequest.mutateAsync({ memberId, partyId: displayParty.id });
  };

  const handleReject = async (memberId: string) => {
    if (!displayParty.id) return;
    await rejectRequest.mutateAsync({ memberId, partyId: displayParty.id });
  };

  const handleKick = async (memberId: string) => {
    if (!displayParty.id) return;
    await kickMember.mutateAsync({ memberId, partyId: displayParty.id });
  };

  const startEditing = () => {
    setEditName(displayParty.name);
    setEditDescription(displayParty.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!displayParty.id) return;
    await updateParty.mutateAsync({
      partyId: displayParty.id,
      name: editName.trim(),
      description: editDescription.trim() || null,
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(modeConfig.bgColor, modeConfig.color, "gap-1")}>
              <ModeIcon className="w-3 h-3" />
              {modeConfig.label}
            </Badge>
            {isPrivate && (
              <Badge variant="outline" className="gap-1">
                <Lock className="w-3 h-3" />
                Privé
              </Badge>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-name" className="text-xs">Nom du groupe</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-desc" className="text-xs">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateParty.isPending}>
                  {updateParty.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Sauvegarder
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <DialogTitle className="font-display text-xl">
                {displayParty.name}
              </DialogTitle>
              {isCreator && (
                <Button size="icon" variant="ghost" onClick={startEditing} className="h-8 w-8">
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Creator info */}
        {displayParty.creator && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayParty.creator.avatar_url || undefined} />
              <AvatarFallback>
                {(displayParty.creator.display_name || displayParty.creator.username || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {displayParty.creator.display_name || displayParty.creator.username}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="w-3 h-3 text-accent" />
                Créateur du groupe
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {!isEditing && displayParty.description && (
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {displayParty.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {displayParty.tags && displayParty.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayParty.tags.map((tag) => {
              const TagIcon = TAG_ICONS[tag] || Users;
              return (
                <Badge key={tag} variant="secondary" className="gap-1.5">
                  <TagIcon className="w-3.5 h-3.5" />
                  {tag}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Slots for shooting/concours */}
        {(displayParty.mode === 'shooting' || displayParty.mode === 'concours') && 
         displayParty.slots && displayParty.slots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {displayParty.mode === 'shooting' ? 'Personnages' : 'Rôles'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {displayParty.slots.map((slot, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-2 rounded-lg border text-sm",
                    slot.filled_by ? "bg-primary/10 border-primary/30" : "bg-muted/50"
                  )}
                >
                  <p className="font-medium">{slot.label}</p>
                  {slot.filled_by ? (
                    <p className="text-xs text-muted-foreground">✓ Pris</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Disponible</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN SECTION: Pending Requests (Creator only) */}
        {isCreator && pendingRequests.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Candidatures en attente
                <Badge variant="secondary" className="text-xs">{pendingRequests.length}</Badge>
              </h4>
              <div className="space-y-2">
                {pendingRequests.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border border-accent/30">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.user?.display_name || member.user?.username || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {member.user?.display_name || member.user?.username}
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      onClick={() => handleApprove(member.id)}
                      disabled={approveRequest.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleReject(member.id)}
                      disabled={rejectRequest.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membres
            </h4>
            <Badge variant="outline">
              {memberCount}{maxMembers && `/${maxMembers}`}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {approvedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(member.user?.display_name || member.user?.username || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {member.user?.display_name || member.user?.username}
                  </p>
                </div>
                {member.role === 'leader' ? (
                  <Crown className="w-4 h-4 text-accent" />
                ) : (
                  <>
                    <User className="w-4 h-4 text-muted-foreground" />
                    {/* Kick button for creator (not for themselves) */}
                    {isCreator && member.user_id !== user?.id && (
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleKick(member.id)}
                        disabled={kickMember.isPending}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
            
            {approvedMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun membre pour le moment
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4">
          {/* Pending request badge */}
          {hasPendingRequest && !isMember && (
            <Badge variant="secondary" className="flex-1 justify-center py-2 gap-1">
              <Clock className="w-4 h-4" />
              Demande en attente
            </Badge>
          )}
          
          {/* Join button (non-member, not full, no pending request) */}
          {!isMember && !isFull && !hasPendingRequest && user && (
            <Button 
              onClick={handleJoin}
              disabled={joinParty.isPending}
              className={cn(
                "flex-1 gap-2",
                displayParty.mode === 'squad' && "bg-turquoise hover:bg-turquoise/90 text-tokyo-night",
                displayParty.mode === 'shooting' && "bg-blue-500 hover:bg-blue-600",
                displayParty.mode === 'concours' && "bg-sakura hover:bg-sakura/90",
              )}
            >
              <UserPlus className="w-4 h-4" />
              {joinParty.isPending ? "..." : "Demander à rejoindre"}
            </Button>
          )}
          
          {/* Invite button (members only) */}
          {isMember && (
            <Button 
              variant="outline"
              onClick={() => setInviteModalOpen(true)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Inviter un Nakama
            </Button>
          )}
          
          {/* Leave button (member but not creator) */}
          {isMember && !isCreator && (
            <Button 
              variant="outline"
              onClick={handleLeave}
              disabled={leaveParty.isPending}
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              {leaveParty.isPending ? "..." : "Quitter"}
            </Button>
          )}
          
          {/* Delete button (creator only) */}
          {isCreator && (
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteParty.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteParty.isPending ? "..." : "Supprimer"}
            </Button>
          )}
          
          {/* Full badge */}
          {isFull && !isMember && !hasPendingRequest && (
            <Badge variant="secondary" className="flex-1 justify-center py-2">
              Groupe complet
            </Badge>
          )}
        </div>
      </DialogContent>
      
      {/* Invite Modal */}
      {displayParty && (
        <InviteNakamaModal
          party={displayParty}
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
        />
      )}
    </Dialog>
  );
}