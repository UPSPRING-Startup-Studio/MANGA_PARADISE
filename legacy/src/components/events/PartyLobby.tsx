import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Users, 
  Camera, 
  Trophy, 
  Search,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEventParties, useJoinParty, EventParty, PartyMode } from "@/hooks/useEventParties";
import { useIsRegistered } from "@/hooks/useEventParticipants";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import PartyWizard from "./PartyWizard";
import PartyCard from "./PartyCard";
import PartyDetailModal from "./PartyDetailModal";
import PartyLockedState from "./PartyLockedState";
import PendingInvitationsSection from "./PendingInvitationsSection";

interface PartyLobbyProps {
  eventId: string;
  onRegisterClick?: () => void;
}

type ModeFilter = 'all' | PartyMode;

const MODE_FILTERS: { id: ModeFilter; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all', label: 'Tous', icon: Users, color: 'text-foreground' },
  { id: 'squad', label: 'Squad', icon: Users, color: 'text-turquoise' },
  { id: 'shooting', label: 'Shooting', icon: Camera, color: 'text-blue-500' },
  { id: 'concours', label: 'Concours', icon: Trophy, color: 'text-sakura' },
];

export default function PartyLobby({ eventId, onRegisterClick }: PartyLobbyProps) {
  const { user } = useAuth();
  const { data: parties = [], isLoading } = useEventParties(eventId);
  const { data: registration, isLoading: registrationLoading } = useIsRegistered(eventId, user?.id);
  const joinParty = useJoinParty();
  
  // Fetch all user's pending requests for parties in this event
  const { data: userPendingRequests = [] } = useQuery({
    queryKey: ["user-pending-requests", eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const partyIds = parties.map(p => p.id);
      if (partyIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("event_party_members")
        .select("party_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .in("party_id", partyIds);
      
      if (error) throw error;
      return data.map(d => d.party_id);
    },
    enabled: !!user?.id && parties.length > 0,
  });

  // Fetch all user's approved memberships for parties in this event
  const { data: userApprovedParties = [] } = useQuery({
    queryKey: ["user-approved-parties", eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const partyIds = parties.map(p => p.id);
      if (partyIds.length === 0) return [];

      const { data, error } = await supabase
        .from("event_party_members")
        .select("party_id, status, role")
        .eq("user_id", user.id)
        .in("party_id", partyIds)
        .or("status.eq.approved,role.eq.leader");

      if (error) throw error;
      return Array.from(new Set((data || []).map(d => d.party_id)));
    },
    enabled: !!user?.id && parties.length > 0,
  });

  const approvedPartyIdSet = useMemo(() => new Set(userApprovedParties), [userApprovedParties]);
  
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<EventParty | null>(null);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is registered to the event
  const isRegistered = !!registration;
  const isLoggedIn = !!user;

  // Filter parties
  const filteredParties = parties.filter(party => {
    // Mode filter
    if (modeFilter !== 'all' && party.mode !== modeFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = party.name.toLowerCase().includes(query);
      const matchesDesc = party.description?.toLowerCase().includes(query);
      const matchesTags = party.tags?.some(t => t.toLowerCase().includes(query));
      if (!matchesName && !matchesDesc && !matchesTags) return false;
    }
    
    return true;
  });

  const handleJoin = async (party: EventParty) => {
    if (!user?.id) return;
    await joinParty.mutateAsync({ partyId: party.id, userId: user.id, status: 'pending' });
  };

  const isUserMember = (party: EventParty) => {
    if (party.creator_id === user?.id) return true;
    return approvedPartyIdSet.has(party.id);
  };

  const hasPendingRequestForParty = (partyId: string) => {
    return userPendingRequests.includes(partyId);
  };

  const isUserCreator = (party: EventParty) => {
    return party.creator_id === user?.id;
  };

  const handleRegisterClick = () => {
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      // Scroll to top where the registration button is
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Stats
  const squadCount = parties.filter(p => p.mode === 'squad').length;
  const shootingCount = parties.filter(p => p.mode === 'shooting').length;
  const concoursCount = parties.filter(p => p.mode === 'concours').length;

  // Show locked state if user is not registered (and logged in)
  if (isLoggedIn && !registrationLoading && !isRegistered) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sakura" />
              Party Finder
            </h3>
            <p className="text-sm text-muted-foreground">
              Trouve ou crée ton groupe pour cet événement
            </p>
          </div>
        </div>

        {/* Stats preview (blurred effect) */}
        <div className="flex flex-wrap gap-2 opacity-50">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-turquoise" />
            {squadCount} Squads
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Camera className="w-3.5 h-3.5 text-blue-500" />
            {shootingCount} Shootings
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Trophy className="w-3.5 h-3.5 text-sakura" />
            {concoursCount} Concours
          </Badge>
        </div>

        {/* Locked State */}
        <PartyLockedState onRegister={handleRegisterClick} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura" />
            Party Finder
          </h3>
          <p className="text-sm text-muted-foreground">
            Trouve ou crée ton groupe pour cet événement
          </p>
        </div>
        
        {isLoggedIn && isRegistered && (
          <Button 
            onClick={() => setWizardOpen(true)}
            className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Créer un groupe
          </Button>
        )}
      </div>

      {/* Pending invitations */}
      {isLoggedIn && (
        <PendingInvitationsSection eventId={eventId} />
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5 py-1.5">
          <Users className="w-3.5 h-3.5 text-turquoise" />
          {squadCount} Squads
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-500" />
          {shootingCount} Shootings
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5">
          <Trophy className="w-3.5 h-3.5 text-sakura" />
          {concoursCount} Concours
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mode filter pills */}
        <div className="flex gap-2 flex-wrap">
          {MODE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={modeFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5",
                  modeFilter === filter.id && filter.id === 'squad' && "bg-turquoise hover:bg-turquoise/90 text-tokyo-night",
                  modeFilter === filter.id && filter.id === 'shooting' && "bg-blue-500 hover:bg-blue-600",
                  modeFilter === filter.id && filter.id === 'concours' && "bg-sakura hover:bg-sakura/90",
                )}
                onClick={() => setModeFilter(filter.id)}
              >
                <Icon className={cn("w-4 h-4", modeFilter !== filter.id && filter.color)} />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredParties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-display text-lg mb-2">Aucun groupe trouvé</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || modeFilter !== 'all' 
              ? "Essaie d'ajuster tes filtres"
              : "Sois le premier à créer un groupe !"}
          </p>
          {isLoggedIn && isRegistered && (
            <Button 
              onClick={() => setWizardOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer un groupe
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              onView={setSelectedParty}
              onJoin={isRegistered ? handleJoin : undefined}
              isMember={isUserMember(party)}
              isCreator={isUserCreator(party)}
              hasPendingRequest={hasPendingRequestForParty(party.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PartyWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen} 
        eventId={eventId}
      />

      <PartyDetailModal
        party={selectedParty}
        open={!!selectedParty}
        onOpenChange={(open) => !open && setSelectedParty(null)}
        onJoin={isRegistered ? handleJoin : undefined}
      />
    </div>
  );
}
