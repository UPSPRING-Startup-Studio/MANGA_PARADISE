import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Settings,
  Users,
  UserPlus,
  Search,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";
import {
  useProPartnerMembers,
  useDeactivateProPartnerMember,
  useUpdateProPartnerMemberRole,
  ADMIN_ROLES,
  PRO_PARTNER_ROLE_LABELS,
} from "@/hooks/useProPartner";
import {
  useAddProPartnerMember,
  useSearchUsersForPartner,
} from "@/hooks/useAdminProPartners";

interface ProPartnerContext {
  partner: ProPartner | undefined;
  role: ProPartnerRole | undefined;
}

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/40";

const ROLE_COLOR_MAP: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  admin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  member: "bg-slate-500/10 text-mp-ink-muted border-slate-500/30",
};

const ProSettings = () => {
  const { partner, role } = useOutletContext<ProPartnerContext>();
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const partnerId = partner?.id;

  const { data: members, isLoading: membersLoading } = useProPartnerMembers(partnerId);
  const deactivateMember = useDeactivateProPartnerMember();
  const updateRole = useUpdateProPartnerMemberRole();

  const [addMemberOpen, setAddMemberOpen] = useState(false);

  if (!partner) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
          <Settings className="h-7 w-7 text-cyan-400" />
          Paramètres
        </h1>
        <p className="text-mp-ink-muted mt-1">
          Gérez l'équipe et les paramètres de votre espace partenaire
        </p>
      </div>

      {/* Membres de l'équipe */}
      <Card className="bg-mp-paper/80 border-mp-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-50 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Équipe ({members?.length || 0})
          </CardTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMemberOpen(true)}
              className="gap-1.5 text-xs border-slate-600 text-slate-200 hover:bg-white"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-white/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-mp-border/50"
                >
                  <Avatar className="h-9 w-9 border border-slate-600">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-cyan-500/10 text-cyan-400 text-xs">
                      {(member.profile?.display_name || member.profile?.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {member.profile?.display_name || member.profile?.username || "Utilisateur"}
                    </p>
                    {member.profile?.username && (
                      <p className="text-xs text-mp-ink-muted truncate">@{member.profile.username}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${ROLE_COLOR_MAP[member.role]}`}>
                    {PRO_PARTNER_ROLE_LABELS[member.role]}
                  </Badge>
                  {isAdmin && member.role !== "owner" && (
                    <div className="flex gap-1">
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          updateRole.mutate({
                            membershipId: member.id,
                            newRole: v as ProPartnerRole,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-24 text-[10px] bg-white border-slate-600 text-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["admin", "manager", "member"] as ProPartnerRole[]).map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {PRO_PARTNER_ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          if (window.confirm("Retirer ce membre ?")) {
                            deactivateMember.mutate(member.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mp-ink-muted text-center py-6">
              Aucun membre dans l'équipe
            </p>
          )}
        </CardContent>
      </Card>

      {/* Infos compte */}
      <Card className="bg-mp-paper/80 border-mp-border/50">
        <CardHeader>
          <CardTitle className="text-slate-50 text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-mp-ink-muted">Statut</span>
            <Badge
              variant="outline"
              className={
                partner.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : partner.status === "suspended"
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-slate-500/10 text-mp-ink-muted border-slate-500/30"
              }
            >
              {partner.status === "active" ? "Actif" : partner.status === "suspended" ? "Suspendu" : partner.status}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mp-ink-muted">Slug</span>
            <span className="text-slate-200 font-mono text-xs">/{partner.slug}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mp-ink-muted">Créé le</span>
            <span className="text-slate-200 text-xs">
              {new Date(partner.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog
        partnerId={partnerId}
        existingMembers={members || []}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
    </div>
  );
};

// ──────────────────────────────────────────────
// Sub-component : Add Member Dialog
// ──────────────────────────────────────────────

function AddMemberDialog({
  partnerId,
  existingMembers,
  open,
  onOpenChange,
}: {
  partnerId: string | undefined;
  existingMembers: any[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProPartnerRole>("member");
  const { data: searchResults, isLoading: isSearching } = useSearchUsersForPartner(searchQuery);
  const addMember = useAddProPartnerMember();

  const existingUserIds = new Set(existingMembers.map((m: any) => m.user_id));

  const handleAdd = (userId: string) => {
    if (!partnerId) return;
    addMember.mutate(
      { partnerId, userId, role: selectedRole },
      { onSuccess: () => setSearchQuery("") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Ajouter un membre</DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            Rattacher un utilisateur à votre structure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rôle</label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProPartnerRole)}>
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["admin", "manager", "member"] as ProPartnerRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {PRO_PARTNER_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rechercher un utilisateur</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
              <Input
                placeholder="Pseudo ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 ${INPUT_CLASS}`}
              />
            </div>
          </div>

          {searchQuery.length >= 2 && (
            <ScrollArea className="max-h-52 rounded-lg border border-mp-border bg-white/60">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-mp-ink-muted" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="p-1">
                  {searchResults.map((user) => {
                    const alreadyMember = existingUserIds.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-md p-2.5 hover:bg-mp-cloud/50 transition-colors"
                      >
                        <Avatar className="h-9 w-9 border border-slate-600">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-400 text-xs">
                            {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {user.display_name || user.username}
                          </p>
                          {user.username && (
                            <p className="text-xs text-mp-ink-muted truncate">@{user.username}</p>
                          )}
                        </div>
                        {alreadyMember ? (
                          <Badge variant="outline" className="text-[10px] text-mp-ink-muted border-slate-600">
                            Déjà membre
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAdd(user.id)}
                            disabled={addMember.isPending}
                            className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 text-xs h-7"
                          >
                            {addMember.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ajouter"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-mp-ink-muted py-6">Aucun utilisateur trouvé</p>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProSettings;
