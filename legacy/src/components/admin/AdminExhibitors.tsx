/**
 * AdminExhibitors - Dashboard global pour gérer toutes les demandes d'exposants
 * Affiche les demandes en attente de tous les événements
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Store,
  Clock,
  Check,
  X,
  Loader2,
  Search,
  Calendar,
  MapPin,
  Zap,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useUpdateExhibitorStatus, useAllPendingExhibitors } from "@/hooks/useEventExhibitors";
import { EXHIBITOR_STATUS_CONFIG } from "@/types/exhibitor";

const AdminExhibitors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  
  const updateStatus = useUpdateExhibitorStatus();

  // Fetch all exhibitors with event and profile data
  const { data: exhibitors = [], isLoading } = useQuery({
    queryKey: ["admin-all-exhibitors", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("event_exhibitors")
        .select(`
          *,
          profile:user_id(id, username, display_name, avatar_url, role_function),
          event:event_id(id, title, date, city)
        `)
        .order("created_at", { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Filter by search query
  const filteredExhibitors = exhibitors.filter(exhibitor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exhibitor.stand_name?.toLowerCase().includes(query) ||
      exhibitor.profile?.display_name?.toLowerCase().includes(query) ||
      exhibitor.profile?.username?.toLowerCase().includes(query) ||
      exhibitor.event?.title?.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: exhibitors.length,
    pending: exhibitors.filter(e => e.status === "pending").length,
    approved: exhibitors.filter(e => e.status === "approved").length,
    rejected: exhibitors.filter(e => e.status === "rejected").length,
  };

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
            <h2 className="font-display text-2xl">Quartier des Créateurs</h2>
            <p className="text-sm text-muted-foreground">
              Gestion des demandes de stands
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total" 
          value={stats.total} 
          icon={<Store className="w-4 h-4" />}
          color="text-white"
        />
        <StatCard 
          label="En attente" 
          value={stats.pending} 
          icon={<Clock className="w-4 h-4" />}
          color="text-amber-400"
          highlight={stats.pending > 0}
        />
        <StatCard 
          label="Validés" 
          value={stats.approved} 
          icon={<Check className="w-4 h-4" />}
          color="text-green-400"
        />
        <StatCard 
          label="Refusés" 
          value={stats.rejected} 
          icon={<X className="w-4 h-4" />}
          color="text-red-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par stand, créateur, événement..."
            className="pl-10 bg-black/40 border-white/10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "gap-2",
                statusFilter === status 
                  ? "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] text-white" 
                  : "border-white/10 hover:border-[hsl(var(--mp-primary))]/50"
              )}
            >
              {status === "all" && "Tous"}
              {status === "pending" && (
                <>
                  <Clock className="w-3 h-3" />
                  En attente
                </>
              )}
              {status === "approved" && (
                <>
                  <Check className="w-3 h-3" />
                  Validés
                </>
              )}
              {status === "rejected" && (
                <>
                  <X className="w-3 h-3" />
                  Refusés
                </>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Exhibitors List */}
      {filteredExhibitors.length === 0 ? (
        <Card className="p-8 text-center bg-black/40 backdrop-blur-md border-white/10">
          <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-display text-lg text-muted-foreground">
            {searchQuery ? "Aucun résultat" : "Aucune demande"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery 
              ? "Essayez avec d'autres termes de recherche"
              : statusFilter === "pending" 
                ? "Toutes les demandes ont été traitées ! 🎉"
                : "Changez les filtres pour voir d'autres demandes"
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExhibitors.map((exhibitor, index) => (
            <ExhibitorRow
              key={exhibitor.id}
              exhibitor={exhibitor}
              index={index}
              onApprove={() => updateStatus.mutate({ requestId: exhibitor.id, status: "approved" })}
              onReject={() => updateStatus.mutate({ requestId: exhibitor.id, status: "rejected" })}
              isPending={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}

const StatCard = ({ label, value, icon, color, highlight }: StatCardProps) => (
  <Card className={cn(
    "p-4 transition-all",
    "bg-black/40 backdrop-blur-md border-white/10",
    highlight && "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
  )}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-display", color)}>{value}</p>
      </div>
      <div className={cn("p-2 rounded-lg bg-white/5", color)}>
        {icon}
      </div>
    </div>
  </Card>
);

interface ExhibitorRowProps {
  exhibitor: any;
  index: number;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

const ExhibitorRow = ({ exhibitor, index, onApprove, onReject, isPending }: ExhibitorRowProps) => {
  const profile = exhibitor.profile;
  const event = exhibitor.event;
  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();
  const [showRequirements, setShowRequirements] = useState(false);

  const statusConfig = EXHIBITOR_STATUS_CONFIG[exhibitor.status as keyof typeof EXHIBITOR_STATUS_CONFIG];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={cn(
        "p-4 transition-all",
        "bg-black/40 backdrop-blur-md border border-white/10",
        "hover:border-[hsl(var(--mp-primary))]/30"
      )}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-12 h-12 border-2 border-[hsl(var(--mp-primary))]/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 text-white font-display">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-lg">{exhibitor.stand_name}</span>
              <Badge className={cn(
                "text-xs",
                statusConfig?.bgColor,
                statusConfig?.color,
                statusConfig?.borderColor
              )}>
                {statusConfig?.icon} {statusConfig?.label}
              </Badge>
              {profile?.role_function && (
                <Badge variant="outline" className="text-xs border-[hsl(var(--mp-primary))]/30 text-[hsl(var(--mp-primary))]">
                  {profile.role_function}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{profile?.display_name || profile?.username || "Anonyme"}</span>
              <span>•</span>
              <span>{format(parseISO(exhibitor.created_at), "d MMM yyyy", { locale: fr })}</span>
            </div>

            {/* Event info */}
            {event && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-[hsl(var(--mp-info))]">
                  <Calendar className="w-3 h-3" />
                  {event.title}
                </span>
                {event.city && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {event.city}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {exhibitor.stand_description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {exhibitor.stand_description}
              </p>
            )}

            {/* Requirements (admin only) */}
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

          {/* Actions */}
          {exhibitor.status === "pending" && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onApprove}
                disabled={isPending}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 gap-1"
              >
                <Check className="w-4 h-4" />
                Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isPending}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
              >
                <X className="w-4 h-4" />
                Refuser
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default AdminExhibitors;
