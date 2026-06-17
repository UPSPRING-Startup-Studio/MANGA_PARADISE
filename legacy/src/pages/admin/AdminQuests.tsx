import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Loader2, 
  Edit,
  Trash2,
  Zap,
  Star,
  Target,
  Camera,
  Check,
  X,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import { OTAKU_CLASSES } from "@/lib/constants";

const AdminQuests = () => {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState<{ open: boolean; quest: any }>({ open: false, quest: null });
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xp_reward: "",
    otk_reward: "",
    icon: "⭐",
    quest_type: "daily",
    validation_type: "MANUAL_ADMIN",
    class_requirement: "ALL",
    target_count: "1",
    is_active: true,
  });

  // Fetch quests
  const { data: quests = [], isLoading } = useQuery({
    queryKey: ["admin-quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title: data.title,
        description: data.description || null,
        xp_reward: parseInt(data.xp_reward) || 0,
        otk_reward: parseInt(data.otk_reward) || 0,
        icon: data.icon,
        quest_type: data.quest_type,
        validation_type: data.validation_type,
        class_requirement: data.class_requirement,
        target_count: parseInt(data.target_count) || 1,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase
          .from("quests")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quests")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editModal.quest ? "Quête mise à jour !" : "Quête créée !");
      queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      setEditModal({ open: false, quest: null });
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("quests")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (questId: string) => {
      const { error } = await supabase
        .from("quests")
        .delete()
        .eq("id", questId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quête supprimée");
      queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
    },
  });

  // Fetch pending photo proofs
  const { data: pendingProofs = [], isLoading: loadingProofs } = useQuery({
    queryKey: ["admin-pending-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_quests")
        .select(`
          *,
          quest:quests(*),
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("status", "pending")
        .not("proof_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Validate proof mutation
  const validateProofMutation = useMutation({
    mutationFn: async ({ userQuestId, approved }: { userQuestId: string; approved: boolean }) => {
      if (approved) {
        // Get user quest details
        const { data: userQuest, error: fetchError } = await supabase
          .from("user_quests")
          .select("user_id, quest_id")
          .eq("id", userQuestId)
          .single();
        
        if (fetchError) throw fetchError;

        // Call complete_quest function
        const { error } = await supabase.rpc("complete_quest", {
          _user_id: userQuest.user_id,
          _quest_id: userQuest.quest_id,
        });
        if (error) throw error;
      } else {
        // Reject - update status
        const { error } = await supabase
          .from("user_quests")
          .update({ status: "rejected" })
          .eq("id", userQuestId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? "Preuve validée !" : "Preuve refusée");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-proofs"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la validation");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      xp_reward: "",
      otk_reward: "",
      icon: "⭐",
      quest_type: "daily",
      validation_type: "MANUAL_ADMIN",
      class_requirement: "ALL",
      target_count: "1",
      is_active: true,
    });
  };

  const openEditModal = (quest?: any) => {
    if (quest) {
      setFormData({
        title: quest.title,
        description: quest.description || "",
        xp_reward: quest.xp_reward?.toString() || "0",
        otk_reward: quest.otk_reward?.toString() || "0",
        icon: quest.icon || "⭐",
        quest_type: quest.quest_type || "daily",
        validation_type: quest.validation_type || "MANUAL_ADMIN",
        class_requirement: quest.class_requirement || "ALL",
        target_count: quest.target_count?.toString() || "1",
        is_active: quest.is_active ?? true,
      });
    } else {
      resetForm();
    }
    setEditModal({ open: true, quest });
  };

  const questTypes = [
    { value: "daily", label: "Quotidienne" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "event", label: "Événement" },
    { value: "achievement", label: "Accomplissement" },
    { value: "special", label: "Spéciale" },
  ];

  const validationTypes = [
    { value: "MANUAL_ADMIN", label: "Validation Admin" },
    { value: "QR_SCAN", label: "Scan QR Code" },
    { value: "PHOTO_UPLOAD", label: "Upload Photo" },
    { value: "AUTO_ATTENDANCE", label: "Présence Auto" },
  ];

  const iconOptions = ["⭐", "🎯", "📍", "📸", "🎮", "🎭", "🏆", "💫", "🔥", "⚔️", "🛡️", "🎪"];

  const getClassLabel = (classId: string) => {
    if (classId === "ALL") return "Toutes les classes";
    const cls = OTAKU_CLASSES[classId as keyof typeof OTAKU_CLASSES];
    return cls ? `${cls.icon} ${cls.label}` : classId;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "weekly": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "event": return "bg-sakura/20 text-sakura border-sakura/30";
      case "achievement": return "bg-accent/20 text-accent border-accent/30";
      case "special": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-2">Gestion des Quêtes</h1>
          <p className="text-muted-foreground">Game Master - Système de gamification</p>
        </div>
        <Button onClick={() => openEditModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Créer une quête
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-sakura" />
            <div>
              <p className="text-2xl font-display">{quests.length}</p>
              <p className="text-sm text-muted-foreground">Quêtes totales</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-display">
                {quests.filter((q) => q.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-display">
                {quests.filter((q) => q.quest_type === "event").length}
              </p>
              <p className="text-sm text-muted-foreground">Événements</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Inbox className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-display">{pendingProofs.length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for Quests and Photo Validation */}
      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quests" className="gap-2">
            <Target className="w-4 h-4" />
            Quêtes
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <Camera className="w-4 h-4" />
            Validation Photos
            {pendingProofs.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {pendingProofs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quests">
          {/* Quests Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quests.map((quest) => (
            <Card 
              key={quest.id} 
              className={`p-4 hover:border-sakura/50 transition-colors ${!quest.is_active && "opacity-50"}`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{quest.icon || "⭐"}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium leading-tight">{quest.title}</h3>
                    {quest.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {quest.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getTypeColor(quest.quest_type || "daily")}>
                    {questTypes.find((t) => t.value === quest.quest_type)?.label || quest.quest_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getClassLabel(quest.class_requirement || "ALL")}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-turquoise font-medium">+{quest.xp_reward || 0} XP</span>
                  <span className="text-accent font-medium">+{quest.otk_reward || 0} OTK</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Switch
                    checked={quest.is_active ?? true}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: quest.id, is_active: v })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {quest.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(quest)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(quest.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation">
          {/* Photo Proof Validation Inbox */}
          {loadingProofs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
            </div>
          ) : pendingProofs.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl mb-2">Aucune preuve en attente</h3>
              <p className="text-muted-foreground">
                Toutes les soumissions de preuves photo ont été traitées.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProofs.map((proof: any) => (
                <Card key={proof.id} className="overflow-hidden">
                  {/* Proof Image */}
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={proof.proof_url}
                      alt="Preuve"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Quest Info */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{proof.quest?.icon || "⭐"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{proof.quest?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          +{proof.quest?.xp_reward || 0} XP • +{proof.quest?.otk_reward || 0} OTK
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={proof.profile?.avatar_url} />
                        <AvatarFallback>
                          {proof.profile?.username?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {proof.profile?.display_name || proof.profile?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(proof.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => validateProofMutation.mutate({ userQuestId: proof.id, approved: false })}
                        disabled={validateProofMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Refuser
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => validateProofMutation.mutate({ userQuestId: proof.id, approved: true })}
                        disabled={validateProofMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Valider
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editModal.open} onOpenChange={(open) => setEditModal({ open, quest: editModal.quest })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editModal.quest ? "Modifier la quête" : "Créer une quête"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData({ ...formData, icon: v })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nom de la quête"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la quête..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Récompense XP</Label>
                <Input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Récompense OTK</Label>
                <Input
                  type="number"
                  value={formData.otk_reward}
                  onChange={(e) => setFormData({ ...formData, otk_reward: e.target.value })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de quête</Label>
                <Select
                  value={formData.quest_type}
                  onValueChange={(v) => setFormData({ ...formData, quest_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validation</Label>
                <Select
                  value={formData.validation_type}
                  onValueChange={(v) => setFormData({ ...formData, validation_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validationTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classe requise</Label>
                <Select
                  value={formData.class_requirement}
                  onValueChange={(v) => setFormData({ ...formData, class_requirement: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les classes</SelectItem>
                    {Object.values(OTAKU_CLASSES).map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toUpperCase()}>
                        {cls.icon} {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objectif (count)</Label>
                <Input
                  type="number"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Quête active</p>
                <p className="text-xs text-muted-foreground">Visible et réalisable par les membres</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ open: false, quest: null })}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate({ ...formData, id: editModal.quest?.id })}
              disabled={saveMutation.isPending || !formData.title}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editModal.quest ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuests;
