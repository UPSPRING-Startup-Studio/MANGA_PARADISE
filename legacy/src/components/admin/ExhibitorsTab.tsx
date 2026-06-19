import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  X, 
  Plus, 
  Loader2, 
  Store, 
  Clock,
  UserPlus,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  useAllExhibitors, 
  useUpdateExhibitorStatus, 
  useAddExhibitorManually 
} from "@/hooks/useEventExhibitors";
import { cn } from "@/lib/utils";

interface ExhibitorsTabProps {
  eventId: string;
}

const ExhibitorsTab = ({ eventId }: ExhibitorsTabProps) => {
  const { data: exhibitors = [], isLoading } = useAllExhibitors(eventId);
  const updateStatus = useUpdateExhibitorStatus();
  const addManually = useAddExhibitorManually();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newStandName, setNewStandName] = useState("");
  const [newStandDescription, setNewStandDescription] = useState("");
  const [newRequirements, setNewRequirements] = useState("");

  // Fetch creators for manual add (users with creator, pro, or admin role)
  const { data: creators = [] } = useQuery({
    queryKey: ["creators-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, role_function")
        .in("role_function", ["creator", "pro", "admin"])
        .order("display_name");
      
      if (error) throw error;
      return data;
    },
  });

  const pendingExhibitors = exhibitors.filter(e => e.status === "pending");
  const approvedExhibitors = exhibitors.filter(e => e.status === "approved");
  const rejectedExhibitors = exhibitors.filter(e => e.status === "rejected");

  const handleAddManually = async () => {
    if (!selectedUserId || !newStandName.trim()) return;

    await addManually.mutateAsync({
      eventId,
      userId: selectedUserId,
      standName: newStandName.trim(),
      standDescription: newStandDescription.trim() || undefined,
      requirements: newRequirements.trim() || undefined,
    });

    setShowAddForm(false);
    setSelectedUserId("");
    setNewStandName("");
    setNewStandDescription("");
    setNewRequirements("");
  };

  // Filter out creators who already have a request for this event
  const existingUserIds = exhibitors.map(e => e.user_id);
  const availableCreators = creators.filter(c => !existingUserIds.includes(c.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--mp-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,127,0.5)]">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-xl">Gestion des Exposants</h3>
            <p className="text-sm text-muted-foreground">
              {approvedExhibitors.length} validé(s) • {pendingExhibitors.length} en attente
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 border-[hsl(var(--mp-primary))]/30 hover:border-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/10"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter manuellement
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-4 border-[hsl(var(--mp-primary))]/30 bg-[hsl(var(--mp-primary))]/5 backdrop-blur-md">
            <h4 className="font-display text-lg mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
              Ajouter un exposant
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créateur</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Sélectionner un créateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCreators.map(creator => (
                      <SelectItem key={creator.id} value={creator.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-[hsl(var(--mp-primary))]/20">
                              {(creator.display_name || creator.username || "?").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {creator.display_name || creator.username}
                          {creator.role_function && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {creator.role_function}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Nom du stand</Label>
                <Input
                  value={newStandName}
                  onChange={(e) => setNewStandName(e.target.value)}
                  placeholder="Ex: L'Atelier de Luna"
                  className="bg-background/50 border-white/10"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>Description (optionnel)</Label>
              <Input
                value={newStandDescription}
                onChange={(e) => setNewStandDescription(e.target.value)}
                placeholder="Ex: Illustrations, prints..."
                className="bg-background/50 border-white/10"
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Besoins techniques (optionnel)
              </Label>
              <Textarea
                value={newRequirements}
                onChange={(e) => setNewRequirements(e.target.value)}
                placeholder="Ex: 1 table, 2 chaises, prise électrique..."
                className="bg-background/50 border-white/10 min-h-[60px]"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAddManually}
                disabled={!selectedUserId || !newStandName.trim() || addManually.isPending}
                className="bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] hover:opacity-90 text-white gap-2"
              >
                {addManually.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pending Requests */}
      {pendingExhibitors.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-display text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Demandes en attente ({pendingExhibitors.length})
          </h4>
          <div className="space-y-2">
            {pendingExhibitors.map(exhibitor => (
              <ExhibitorRow
                key={exhibitor.id}
                exhibitor={exhibitor}
                onApprove={() => updateStatus.mutate({ requestId: exhibitor.id, status: "approved" })}
                onReject={() => updateStatus.mutate({ requestId: exhibitor.id, status: "rejected" })}
                isPending={updateStatus.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Exhibitors */}
      <div className="space-y-3">
        <h4 className="font-display text-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          Artist Alley - Validés ({approvedExhibitors.length})
        </h4>
        {approvedExhibitors.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground bg-black/40 backdrop-blur-md border-white/10">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun exposant validé pour le moment</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {approvedExhibitors.map(exhibitor => (
              <ExhibitorRow
                key={exhibitor.id}
                exhibitor={exhibitor}
                onReject={() => updateStatus.mutate({ requestId: exhibitor.id, status: "rejected" })}
                isPending={updateStatus.isPending}
                showRejectOnly
              />
            ))}
          </div>
        )}
      </div>

      {/* Rejected (collapsed by default) */}
      {rejectedExhibitors.length > 0 && (
        <details className="space-y-3 group">
          <summary className="cursor-pointer font-display text-lg flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5 text-destructive" />
            Refusés ({rejectedExhibitors.length})
            <ChevronDown className="w-4 h-4 ml-auto group-open:hidden" />
            <ChevronUp className="w-4 h-4 ml-auto hidden group-open:block" />
          </summary>
          <div className="space-y-2 mt-3">
            {rejectedExhibitors.map(exhibitor => (
              <ExhibitorRow
                key={exhibitor.id}
                exhibitor={exhibitor}
                onApprove={() => updateStatus.mutate({ requestId: exhibitor.id, status: "approved" })}
                isPending={updateStatus.isPending}
                showApproveOnly
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

interface ExhibitorRowProps {
  exhibitor: any;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
  showRejectOnly?: boolean;
  showApproveOnly?: boolean;
}

const ExhibitorRow = ({ 
  exhibitor, 
  onApprove, 
  onReject, 
  isPending,
  showRejectOnly,
  showApproveOnly 
}: ExhibitorRowProps) => {
  const profile = exhibitor.profile;
  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();
  const [showRequirements, setShowRequirements] = useState(false);

  return (
    <Card className={cn(
      "p-4 flex items-center gap-4 transition-all",
      "bg-black/40 backdrop-blur-md border border-white/10",
      "hover:border-[hsl(var(--mp-primary))]/30"
    )}>
      <Avatar className="w-10 h-10 border-2 border-[hsl(var(--mp-primary))]/30">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 text-white font-display">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{exhibitor.stand_name}</span>
          {exhibitor.status === "approved" && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Validé
            </Badge>
          )}
          {exhibitor.status === "rejected" && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
              Refusé
            </Badge>
          )}
          {exhibitor.status === "pending" && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              En attente
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {profile?.display_name || profile?.username || "Anonyme"} • {format(parseISO(exhibitor.created_at), "d MMM yyyy", { locale: fr })}
        </p>
        {exhibitor.stand_description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {exhibitor.stand_description}
          </p>
        )}
        {/* Requirements (visible admin uniquement) */}
        {exhibitor.requirements && (
          <div className="mt-2">
            <button
              onClick={() => setShowRequirements(!showRequirements)}
              className="text-xs text-amber-500 flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <Zap className="w-3 h-3" />
              {showRequirements ? "Masquer les besoins" : "Voir les besoins techniques"}
              {showRequirements ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRequirements && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300"
              >
                {exhibitor.requirements}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!showRejectOnly && onApprove && (
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            disabled={isPending}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        {!showApproveOnly && onReject && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={isPending}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ExhibitorsTab;
