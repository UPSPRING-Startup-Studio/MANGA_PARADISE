import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Loader2,
  Edit,
  CheckCircle,
  Ban,
  Coins,
  Filter,
  Users,
  Download,
  Trash2,
  Baby,
  Building2,
  Clock,
  XCircle,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { OTAKU_CLASSES } from "@/lib/constants";
import { differenceInYears, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minorFilter, setMinorFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  
  // Modal states
  const [editOtkModal, setEditOtkModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [editProfileModal, setEditProfileModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [adminConfirm, setAdminConfirm] = useState<{ open: boolean; user: any; promote: boolean }>({ open: false, user: null, promote: false });
  const [otkAmount, setOtkAmount] = useState<number>(0);
  const [otkReason, setOtkReason] = useState("");
  
  // Edit profile form
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    username: "",
    bio: "",
    city: "",
    phone: "",
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // NOTE: We don't rely on reading all rows from `user_roles` here because it is protected by access rules.
  // Partner requests are identified by `profiles.partner_status`.


  // Extended profile type
  type ExtendedProfile = typeof users[0] & {
    partner_status?: string;
    partner_company_name?: string;
    partner_contact_name?: string;
    partner_siret?: string;
  };

  // Get pending partner requests
  const pendingPartners = users.filter((user) => {
    const extUser = user as ExtendedProfile;
    return extUser.partner_status === "pending";
  }) as ExtendedProfile[];

  // Validate payment mutation
  const validatePaymentMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_pack, sponsor_id, username")
        .eq("id", userId)
        .single();

      let otkAmount = 500;
      if (profile?.selected_pack === "silver") otkAmount = 1000;
      if (profile?.selected_pack === "gold") otkAmount = 2000;

      const { error } = await supabase.rpc("activate_membership", {
        _user_id: userId,
        _pack_id: profile?.selected_pack || "bronze",
        _otk_amount: otkAmount,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paiement validé ! Membre activé.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la validation");
      console.error(error);
    },
  });

  // Validate partner mutation
  const validatePartnerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          partner_status: 'active',
          partner_validated_at: new Date().toISOString(),
          partner_validated_by: currentUser?.id
        })
        .eq("id", userId);
      if (error) throw error;

      // Create notification for the partner
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "partner_validated",
        content: "🎉 Félicitations ! Votre demande de partenariat a été validée. Bienvenue dans l'Alliance Manga Paradise !",
        related_link: "/partner-portal"
      });
    },
    onSuccess: () => {
      toast.success("Partenaire validé ! Accès activé.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la validation");
      console.error(error);
    },
  });

  // Reject partner mutation
  const rejectPartnerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ partner_status: 'rejected' })
        .eq("id", userId);
      if (error) throw error;

      // Create notification for the partner
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "partner_rejected",
        content: "Votre demande de partenariat n'a pas été retenue. Contactez-nous pour plus d'informations.",
        related_link: "/contact"
      });
    },
    onSuccess: () => {
      toast.success("Demande rejetée");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error("Erreur lors du rejet");
      console.error(error);
    },
  });

  // Update OTK coins mutation
  const updateOtkMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("otk_coins, total_otk_earned")
        .eq("id", userId)
        .single();

      const newAmount = Math.max(0, (currentProfile?.otk_coins || 0) + amount);
      const newTotal = amount > 0 
        ? (currentProfile?.total_otk_earned || 0) + amount 
        : currentProfile?.total_otk_earned || 0;

      // Insert transaction
      await supabase.from("otk_transactions").insert({
        user_id: userId,
        amount: amount,
        transaction_type: amount > 0 ? "admin_credit" : "admin_debit",
        description: reason,
      });
      
      const { error } = await supabase
        .from("profiles")
        .update({ otk_coins: newAmount, total_otk_earned: newTotal })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solde OTK mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditOtkModal({ open: false, user: null });
      setOtkAmount(0);
      setOtkReason("");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Ban/Unban user mutation
  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_status: ban ? "banned" : "active" })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { ban }) => {
      toast.success(ban ? "Utilisateur banni" : "Utilisateur débanni");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: typeof editForm }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditProfileModal({ open: false, user: null });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Soft delete mutation (set status to deleted)
  const softDeleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_status: "deleted", is_subscription_active: false })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Utilisateur supprimé (soft delete)");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteConfirm({ open: false, user: null });
    },
  });

  // Toggle admin role mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, promote }: { userId: string; promote: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: promote ? "admin" : "member" })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { promote }) => {
      toast.success(promote ? "Utilisateur promu Admin" : "Droits Admin retirés");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setAdminConfirm({ open: false, user: null, promote: false });
    },
    onError: (error) => {
      toast.error("Erreur lors du changement de rôle");
      console.error(error);
    },
  });

  // Calculate age
  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    try {
      return differenceInYears(new Date(), parseISO(birthDate));
    } catch {
      return null;
    }
  };

  // Filter users (excluding partners)
  const filteredUsers = users.filter((user) => {
    const extUser = user as ExtendedProfile;

    // Exclude partners from the main list
    const isPartner = extUser.partner_status != null || (user as any).role_function === "partner";
    if (isPartner) return false;

    const matchesSearch = 
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.membership_status === statusFilter;
    
    const age = getAge(user.birth_date);
    const matchesMinor = !minorFilter || (age !== null && age < 18);
    
    // Exclude soft-deleted users unless specifically filtered
    const notDeleted = statusFilter === "deleted" || user.membership_status !== "deleted";
    
    return matchesSearch && matchesStatus && matchesMinor && notDeleted;
  });

  const openEditProfileModal = (user: any) => {
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      display_name: user.display_name || "",
      username: user.username || "",
      bio: user.bio || "",
      city: user.city || "",
      phone: user.phone || "",
    });
    setEditProfileModal({ open: true, user });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Actif</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">En attente</Badge>;
      case "pending_payment":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">💶 Espèces</Badge>;
      case "banned":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Banni</Badge>;
      case "deleted":
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Supprimé</Badge>;
      default:
        return <Badge variant="secondary">{status || "Inconnu"}</Badge>;
    }
  };

  const getClassLabel = (classId: string | null) => {
    if (!classId) return "-";
    const cls = OTAKU_CLASSES[classId as keyof typeof OTAKU_CLASSES];
    return cls ? `${cls.icon} ${cls.label}` : classId;
  };

  // Stats
  const activeCount = users.filter((u) => u.membership_status === "active" && (u as any).partner_status == null).length;
  const pendingPaymentCount = users.filter(u => u.membership_status === "pending_payment").length;
  const minorCount = users.filter(u => {
    const age = getAge(u.birth_date);
    return age !== null && age < 18;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">L'Annuaire des membres de la communauté</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1e1e1e] border border-border/50">
          <TabsTrigger value="members" className="data-[state=active]:bg-sakura/20 data-[state=active]:text-sakura">
            <Users className="w-4 h-4 mr-2" />
            Membres
          </TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-partner-gold/20 data-[state=active]:text-partner-gold">
            <Building2 className="w-4 h-4 mr-2" />
            Demandes Partenaires
            {pendingPartners.length > 0 && (
              <Badge className="ml-2 bg-amber-500/20 text-amber-500 border-amber-500/30">
                {pendingPartners.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-sakura" />
                <div>
                  <p className="text-2xl font-display">{filteredUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-display">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-display">{pendingPaymentCount}</p>
                  <p className="text-sm text-muted-foreground">Paiement espèces</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <Baby className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-display">{minorCount}</p>
                  <p className="text-sm text-muted-foreground">Mineurs</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[#1e1e1e] rounded-lg border border-border/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="pending_payment">Paiement espèces</SelectItem>
                <SelectItem value="banned">Bannis</SelectItem>
                <SelectItem value="deleted">Supprimés</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="minor-filter"
                checked={minorFilter}
                onCheckedChange={setMinorFilter}
              />
              <Label htmlFor="minor-filter" className="text-sm cursor-pointer">
                <Baby className="w-4 h-4 inline mr-1" />
                Mineurs uniquement
              </Label>
            </div>

            <div className="text-sm text-muted-foreground ml-auto">
              {filteredUsers.length} résultat{filteredUsers.length > 1 ? "s" : ""}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
            </div>
          ) : (
            <div className="border border-border/50 rounded-lg overflow-hidden bg-[#1e1e1e]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/30 border-border/50 hover:bg-background/30">
                    <TableHead className="text-muted-foreground">Membre</TableHead>
                    <TableHead className="text-muted-foreground">Âge</TableHead>
                    <TableHead className="text-muted-foreground">Classe</TableHead>
                    <TableHead className="text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-right text-muted-foreground">OTK</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const age = getAge(user.birth_date);
                    const isMinor = age !== null && age < 18;
                    
                    return (
                      <TableRow key={user.id} className="border-border/30 hover:bg-white/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-sakura/20 text-sakura">
                                {user.display_name?.charAt(0) || user.username?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium">{user.display_name || user.username || "Sans nom"}</p>
                                {(user.role === "admin" || user.role_function === "admin") && (
                                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0">
                                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">@{user.username || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {age !== null ? (
                              <>
                                <span className={isMinor ? "text-blue-400 font-medium" : ""}>
                                  {age} ans
                                </span>
                                {isMinor && user.parental_authorization_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => window.open(user.parental_authorization_url, "_blank")}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getClassLabel(user.otaku_class)}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.membership_status)}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-accent">{user.otk_coins || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditProfileModal(user)}
                              title="Modifier le profil"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditOtkModal({ open: true, user });
                                setOtkAmount(0);
                              }}
                              title="Modifier OTK"
                            >
                              <Coins className="w-4 h-4" />
                            </Button>
                            
                            {user.membership_status === "pending_payment" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => validatePaymentMutation.mutate(user.id)}
                                disabled={validatePaymentMutation.isPending}
                                className="text-green-500 hover:text-green-400"
                                title="Valider paiement"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {user.id !== currentUser?.id && (
                              <div className="flex items-center">
                                <Switch
                                  checked={user.role === "admin" || user.role_function === "admin"}
                                  onCheckedChange={(promote) =>
                                    setAdminConfirm({ open: true, user, promote })
                                  }
                                  className="scale-75"
                                />
                                <ShieldCheck className={`w-3 h-3 ml-1 ${user.role === "admin" || user.role_function === "admin" ? "text-purple-400" : "text-muted-foreground"}`} />
                              </div>
                            )}

                            <div className="flex items-center">
                              <Switch
                                checked={user.membership_status === "banned"}
                                onCheckedChange={(banned) =>
                                  toggleBanMutation.mutate({ userId: user.id, ban: banned })
                                }
                                className="scale-75"
                              />
                              <Ban className={`w-3 h-3 ml-1 ${user.membership_status === "banned" ? "text-red-500" : "text-muted-foreground"}`} />
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, user })}
                              className="text-destructive hover:text-destructive"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-6">
          {/* Partner Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-display">{pendingPartners.length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-display">
                    {users.filter((u) => (u as any).partner_status === "active").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Validés</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-[#1e1e1e] border-border/50">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-partner-gold" />
                <div>
                  <p className="text-2xl font-display">
                    {users.filter((u) => (u as any).partner_status != null).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Partenaires</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Pending Partners Table */}
          {pendingPartners.length === 0 ? (
            <Card className="p-8 bg-[#1e1e1e] border-border/50 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune demande en attente</h3>
              <p className="text-muted-foreground text-sm">
                Les nouvelles demandes de partenariat apparaîtront ici.
              </p>
            </Card>
          ) : (
            <div className="border border-border/50 rounded-lg overflow-hidden bg-[#1e1e1e]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/30 border-border/50 hover:bg-background/30">
                    <TableHead className="text-muted-foreground">Structure</TableHead>
                    <TableHead className="text-muted-foreground">Contact</TableHead>
                    <TableHead className="text-muted-foreground">SIRET</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPartners.map((partner) => (
                    <TableRow key={partner.id} className="border-border/30 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-partner-gold/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-partner-gold" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.partner_company_name || "Non renseigné"}</p>
                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              En attente
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.partner_contact_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{partner.username || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {partner.partner_siret || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {partner.created_at ? format(new Date(partner.created_at), "dd MMM yyyy", { locale: fr }) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => validatePartnerMutation.mutate(partner.id)}
                            disabled={validatePartnerMutation.isPending}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30"
                          >
                            {validatePartnerMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Valider
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectPartnerMutation.mutate(partner.id)}
                            disabled={rejectPartnerMutation.isPending}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {rejectPartnerMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit OTK Modal */}
      <Dialog open={editOtkModal.open} onOpenChange={(open) => setEditOtkModal({ open, user: editOtkModal.user })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50">
          <DialogHeader>
            <DialogTitle>Modifier le solde OTK</DialogTitle>
            <DialogDescription>
              Ajuster le solde de {editOtkModal.user?.display_name || editOtkModal.user?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Solde actuel</span>
              <span className="font-mono text-xl text-accent">{editOtkModal.user?.otk_coins || 0} OTK</span>
            </div>
            
            <div className="space-y-2">
              <Label>Montant (+/-)</Label>
              <Input
                type="number"
                value={otkAmount}
                onChange={(e) => setOtkAmount(parseInt(e.target.value) || 0)}
                placeholder="ex: 500 ou -100"
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Nouveau solde : {Math.max(0, (editOtkModal.user?.otk_coins || 0) + otkAmount)} OTK
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Raison</Label>
              <Input
                value={otkReason}
                onChange={(e) => setOtkReason(e.target.value)}
                placeholder="ex: Bonus événement, correction..."
                className="bg-background/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOtkModal({ open: false, user: null })}>
              Annuler
            </Button>
            <Button
              onClick={() => updateOtkMutation.mutate({
                userId: editOtkModal.user?.id,
                amount: otkAmount,
                reason: otkReason,
              })}
              disabled={updateOtkMutation.isPending || otkAmount === 0}
            >
              {updateOtkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={editProfileModal.open} onOpenChange={(open) => setEditProfileModal({ open, user: editProfileModal.user })}>
        <DialogContent className="bg-[#1e1e1e] border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              {editProfileModal.user?.display_name || editProfileModal.user?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pseudo</Label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom affiché</Label>
                <Input
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="bg-background/50"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileModal({ open: false, user: null })}>
              Annuler
            </Button>
            <Button
              onClick={() => updateProfileMutation.mutate({
                userId: editProfileModal.user?.id,
                data: editForm,
              })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Role Confirmation */}
      <AlertDialog open={adminConfirm.open} onOpenChange={(open) => setAdminConfirm({ open, user: adminConfirm.user, promote: adminConfirm.promote })}>
        <AlertDialogContent className="bg-[#1e1e1e] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {adminConfirm.promote ? "Promouvoir en Admin" : "Retirer les droits Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminConfirm.promote ? (
                <>
                  Voulez-vous donner les droits administrateur à{" "}
                  <strong>{adminConfirm.user?.display_name || adminConfirm.user?.username}</strong> ?
                  <br />
                  Cette personne aura accès au panel d'administration complet.
                </>
              ) : (
                <>
                  Voulez-vous retirer les droits administrateur de{" "}
                  <strong>{adminConfirm.user?.display_name || adminConfirm.user?.username}</strong> ?
                  <br />
                  Cette personne n'aura plus accès au panel d'administration.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleAdminMutation.mutate({
                userId: adminConfirm.user?.id,
                promote: adminConfirm.promote,
              })}
              className={adminConfirm.promote
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {toggleAdminMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {adminConfirm.promote ? "Promouvoir Admin" : "Retirer Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, user: deleteConfirm.user })}>
        <AlertDialogContent className="bg-[#1e1e1e] border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte de{" "}
              <strong>{deleteConfirm.user?.display_name || deleteConfirm.user?.username}</strong> ?
              <br />
              Cette action marque le compte comme supprimé (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => softDeleteMutation.mutate(deleteConfirm.user?.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
