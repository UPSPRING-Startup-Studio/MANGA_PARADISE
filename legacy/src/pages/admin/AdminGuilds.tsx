import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Users,
  Filter,
  Shield,
  MapPin,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface GuildWithCategory {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  access_type: string;
  city: string | null;
  category_id: string | null;
  created_by: string | null;
  status: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
  member_count?: number;
}

export default function AdminGuilds() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all guilds (including pending)
  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ["admin-guilds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guilds")
        .select(`
          *,
          category:guild_categories(id, name, icon)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const guildsWithCounts = await Promise.all(
        (data || []).map(async (guild) => {
          const { count } = await supabase
            .from("guild_members")
            .select("*", { count: "exact", head: true })
            .eq("guild_id", guild.id);

          return {
            ...guild,
            member_count: count || 0,
          } as GuildWithCategory;
        })
      );

      return guildsWithCounts;
    },
  });

  // Approve guild mutation
  const approveMutation = useMutation({
    mutationFn: async (guildId: string) => {
      const { error } = await supabase
        .from("guilds")
        .update({ status: "approved" })
        .eq("id", guildId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guilde approuvée !");
      queryClient.invalidateQueries({ queryKey: ["admin-guilds"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de l'approbation");
      console.error(error);
    },
  });

  // Reject/Suspend guild mutation
  const rejectMutation = useMutation({
    mutationFn: async (guildId: string) => {
      const { error } = await supabase
        .from("guilds")
        .update({ status: "rejected" })
        .eq("id", guildId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guilde suspendue");
      queryClient.invalidateQueries({ queryKey: ["admin-guilds"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la suspension");
      console.error(error);
    },
  });

  // Filter guilds
  const filteredGuilds = guilds.filter((guild) => {
    const matchesSearch = 
      guild.name.toLowerCase().includes(search.toLowerCase()) ||
      guild.description?.toLowerCase().includes(search.toLowerCase()) ||
      guild.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || guild.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Approuvée</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">En attente</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Suspendue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats
  const approvedCount = guilds.filter(g => g.status === "approved").length;
  const pendingCount = guilds.filter(g => g.status === "pending").length;
  const totalMembers = guilds.reduce((sum, g) => sum + (g.member_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Modération des Guildes</h1>
        <p className="text-muted-foreground">Gérez et modérez les guildes de la communauté</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#1e1e1e] border-border/50">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-sakura" />
            <div>
              <p className="text-2xl font-display">{guilds.length}</p>
              <p className="text-sm text-muted-foreground">Total Guildes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[#1e1e1e] border-border/50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-display">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approuvées</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[#1e1e1e] border-border/50">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-display">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[#1e1e1e] border-border/50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-display">{totalMembers}</p>
              <p className="text-sm text-muted-foreground">Membres total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[#1e1e1e] rounded-lg border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une guilde..."
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
            <SelectItem value="approved">Approuvées</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="rejected">Suspendues</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground ml-auto">
          {filteredGuilds.length} guilde{filteredGuilds.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Guilds Table */}
      <Card className="bg-[#1e1e1e] border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sakura" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Catégorie</TableHead>
                <TableHead>Guilde</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuilds.map((guild) => (
                <TableRow key={guild.id} className="border-border/50">
                  <TableCell>
                    <span className="text-2xl" title={guild.category?.name}>
                      {guild.category?.icon || "📦"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{guild.name}</p>
                      {guild.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {guild.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {guild.city ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {guild.city}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{guild.member_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(guild.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(guild.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/guilds/${guild.id}`)}
                        title="Voir la guilde"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {guild.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500 hover:bg-green-500/10"
                          onClick={() => approveMutation.mutate(guild.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                      )}

                      {guild.status !== "rejected" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Suspendre
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Suspendre cette guilde ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La guilde "{guild.name}" sera suspendue et ne sera plus visible publiquement.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => rejectMutation.mutate(guild.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Suspendre
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {guild.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500 hover:bg-green-500/10"
                          onClick={() => approveMutation.mutate(guild.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Réactiver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
