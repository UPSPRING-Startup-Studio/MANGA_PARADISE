import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Check, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchUsers, useSendInvitation, usePartyInvitations } from "@/hooks/usePartyInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { EventParty } from "@/hooks/useEventParties";

interface InviteNakamaModalProps {
  party: EventParty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteNakamaModal({ party, open, onOpenChange }: InviteNakamaModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Get already invited users (all sent invitations)
  const { data: sentInvitations } = usePartyInvitations(party.id, user?.id);
  
  // Filter only pending invitations for the "Déjà envoyé" check
  const pendingInvitedUserIds = useMemo(() => 
    sentInvitations?.filter(inv => inv.status === 'pending').map(inv => inv.receiver_id) || [],
    [sentInvitations]
  );
  
  // Get current members
  const memberIds = useMemo(() => 
    party.members?.map(m => m.user_id) || [],
    [party.members]
  );
  
  // Combine exclude list
  const excludeIds = useMemo(() => [
    ...(user?.id ? [user.id] : []),
    ...memberIds,
  ], [user?.id, memberIds]);
  
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedQuery, excludeIds);
  const sendInvitation = useSendInvitation();
  
  const handleInvite = async (receiverId: string) => {
    if (!user?.id || !party.id) return;
    
    await sendInvitation.mutateAsync({
      partyId: party.id,
      senderId: user.id,
      receiverId,
    });
  };
  
  const isInvited = (userId: string) => pendingInvitedUserIds.includes(userId);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Inviter un Nakama
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un pseudo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Search results */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!isSearching && debouncedQuery.length >= 2 && searchResults?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun utilisateur trouvé</p>
                <p className="text-sm">Essaie un autre pseudo</p>
              </div>
            )}
            
            {!isSearching && debouncedQuery.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Tape au moins 2 caractères pour rechercher</p>
              </div>
            )}
            
            {searchResults?.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {(profile.display_name || profile.username || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile.display_name || profile.username}
                  </p>
                  {profile.username && profile.display_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile.username}
                    </p>
                  )}
                </div>
                
                {isInvited(profile.id) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="gap-1 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Check className="w-3 h-3" />
                    Déjà envoyé
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleInvite(profile.id)}
                    disabled={sendInvitation.isPending}
                    className="gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Inviter
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {/* Already invited section */}
          {sentInvitations && sentInvitations.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2 text-muted-foreground">
                Invitations envoyées ({sentInvitations.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {sentInvitations.map((inv) => (
                  <Badge key={inv.id} variant="outline" className="gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={inv.receiver?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {(inv.receiver?.display_name || inv.receiver?.username || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    {inv.receiver?.display_name || inv.receiver?.username}
                    {inv.status === 'pending' && (
                      <span className="text-muted-foreground">⏳</span>
                    )}
                    {inv.status === 'accepted' && (
                      <span className="text-green-500">✓</span>
                    )}
                    {inv.status === 'rejected' && (
                      <span className="text-destructive">✗</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
