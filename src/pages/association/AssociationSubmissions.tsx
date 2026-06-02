import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  Loader2,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { useAssociationMembershipSubmissions } from "@/hooks/useMembershipWorkflow";
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type MembershipSubmissionStatus,
} from "@/types/membershipWorkflow";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tous les statuts" },
  { value: "submitted", label: "Soumis" },
  { value: "under_review", label: "En examen" },
  { value: "needs_more_info", label: "Complement demande" },
  { value: "approved", label: "Approuve" },
  { value: "awaiting_payment", label: "Attente paiement" },
  { value: "activated", label: "Active" },
  { value: "rejected", label: "Refuse" },
];

const AssociationSubmissions = () => {
  const { association } = useOutletContext<AssociationContext>();

  const [statusFilter, setStatusFilter] = useState("all");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: submissions,
    isLoading,
  } = useAssociationMembershipSubmissions(association?.id, {
    status: statusFilter,
    pathway: pathwayFilter,
    search: searchQuery,
  });

  if (!association) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Demandes d'adhesion
          </h1>
          <p className="text-muted-foreground mt-1">
            File de validation des bulletins d'adhesion
          </p>
        </div>
        {association.slug && (
          <Link to={`/asso/${association.slug}/adhesion`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Voir le formulaire
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email, reference..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pathwayFilter} onValueChange={setPathwayFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Parcours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="major">Majeur</SelectItem>
                <SelectItem value="minor">Mineur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-display text-foreground mb-2">
              Aucune demande
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {statusFilter !== "all"
                ? "Aucune demande ne correspond aux filtres selectionnes."
                : "Aucun bulletin d'adhesion n'a encore ete soumis."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Candidat
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Parcours
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Paiement
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Soumis le
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">
                    Ref.
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {submissions.map((sub) => {
                  const status = sub.status as MembershipSubmissionStatus;
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {sub.applicant_name || "Sans nom"}
                          </p>
                          {sub.applicant_email && (
                            <p className="text-xs text-muted-foreground">
                              {sub.applicant_email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {sub.pathway === "minor" ? "Mineur" : "Majeur"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-xs ${SUBMISSION_STATUS_COLORS[status] || ""}`}
                        >
                          {SUBMISSION_STATUS_LABELS[status] || status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground">
                          {PAYMENT_STATUS_LABELS[sub.payment_status] || sub.payment_status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          {sub.public_slug || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link to={`/association/adhesions/${sub.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Voir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AssociationSubmissions;
