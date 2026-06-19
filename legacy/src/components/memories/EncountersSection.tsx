import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Plus, X, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAddEncounter, useDeleteEncounter, EventEncounter } from "@/hooks/useEventMemories";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

interface EncountersSectionProps {
  encounters: EventEncounter[];
  eventId: string;
  userId: string;
  isLoading: boolean;
}

const EncountersSection = ({ encounters, eventId, userId, isLoading }: EncountersSectionProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const addEncounter = useAddEncounter();
  const deleteEncounter = useDeleteEncounter();

  // Search users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["search-users-encounter", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .neq("id", userId)
        .or(`username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const handleAddEncounter = async (encounteredUserId: string) => {
    try {
      await addEncounter.mutateAsync({ eventId, userId, encounteredUserId });
      toast.success("Nakama ajouté aux souvenirs !");
      setShowAddModal(false);
      setSearchQuery("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Ce Nakama est déjà dans tes rencontres");
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    }
  };

  const handleDeleteEncounter = async (encounterId: string) => {
    try {
      await deleteEncounter.mutateAsync({ encounterId, eventId, userId });
      toast.success("Nakama retiré des souvenirs");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const existingEncounterIds = encounters.map(e => e.encountered_user_id);

  return (
    <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 border-amber-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg text-white">Nakamas Rencontrés</h3>
            <p className="text-amber-400/60 text-sm">{encounters.length} rencontre{encounters.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Button 
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-amber-500/30 mb-3" />
          <p className="text-white/50 text-sm">Aucun Nakama enregistré pour cet événement</p>
          <p className="text-white/30 text-xs mt-1">Ajoute les amis que tu as rencontrés !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {encounters.map((encounter) => (
              <motion.div
                key={encounter.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <Link to={`/profil/${encounter.encountered_user_id}`}>
                  <Card className="bg-white/5 border-amber-500/10 hover:border-amber-500/30 p-4 text-center transition-all">
                    <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-amber-500/30">
                      <AvatarImage src={encounter.encountered_user?.avatar_url || ""} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-400">
                        {(encounter.encountered_user?.display_name || encounter.encountered_user?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white text-sm font-medium truncate">
                      {encounter.encountered_user?.display_name || encounter.encountered_user?.username || "Utilisateur"}
                    </p>
                    {encounter.encountered_user?.username && (
                      <p className="text-amber-400/50 text-xs">@{encounter.encountered_user.username}</p>
                    )}
                  </Card>
                </Link>
                
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteEncounter(encounter.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Encounter Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-mp-paper border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Ajouter un Nakama
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            
            {searchLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user: any) => {
                  const alreadyAdded = existingEncounterIds.includes(user.id);
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        alreadyAdded 
                          ? "bg-white/5 opacity-50" 
                          : "bg-white/5 hover:bg-amber-500/10 cursor-pointer"
                      }`}
                      onClick={() => !alreadyAdded && handleAddEncounter(user.id)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-400">
                          {(user.display_name || user.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {user.display_name || user.username || "Utilisateur"}
                        </p>
                        {user.username && (
                          <p className="text-white/50 text-sm">@{user.username}</p>
                        )}
                      </div>
                      {alreadyAdded && (
                        <span className="text-amber-400/50 text-xs">Déjà ajouté</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {debouncedSearch.length >= 2 && searchResults.length === 0 && !searchLoading && (
              <p className="text-center text-white/50 py-4">Aucun utilisateur trouvé</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EncountersSection;
