import { useOutletContext, Link } from "react-router-dom";
import {
  FileText,
  Star,
  Copy,
  Eye,
  Archive,
  Send,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import {
  useAssociationMembershipForms,
  usePublishMembershipForm,
  useArchiveMembershipForm,
  useSetDefaultMembershipForm,
  useDuplicateMembershipForm,
} from "@/hooks/useMembershipFormDefinitions";
import { countFormSteps, countFormFields } from "@/lib/membership-form/loadPublishedForm";
import type { MembershipFormDefinitionRecord } from "@/types/membershipWorkflow";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  published: { label: "Publie", className: "bg-emerald-500/20 text-emerald-400" },
  archived: { label: "Archive", className: "bg-amber-500/20 text-amber-400" },
};

const AssociationMembershipForms = () => {
  const { association } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();

  const { data: forms, isLoading } = useAssociationMembershipForms(association?.id);
  const publishForm = usePublishMembershipForm();
  const archiveForm = useArchiveMembershipForm();
  const setDefault = useSetDefaultMembershipForm();
  const duplicateForm = useDuplicateMembershipForm();

  if (!association) return null;

  const handleDuplicate = (form: MembershipFormDefinitionRecord) => {
    if (!gov.canManageForms) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    duplicateForm.mutate({ sourceForm: form });
  };

  const handlePublish = (formId: string) => {
    if (!gov.canManageForms) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    publishForm.mutate({ formId, associationId: association.id });
  };

  const handleArchive = (formId: string) => {
    if (!gov.canManageForms) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    archiveForm.mutate({ formId, associationId: association.id });
  };

  const handleSetDefault = (formId: string) => {
    if (!gov.canManageForms) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    setDefault.mutate({ formId, associationId: association.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Formulaires d'adhesion
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des bulletins d'adhesion de {association.name}
          </p>
        </div>
        {forms && forms.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleDuplicate(forms[0])}
            disabled={duplicateForm.isPending || !gov.canManageForms}
          >
            <Plus className="w-4 h-4" />
            Nouvelle version
          </Button>
        )}
      </div>

      {!forms || forms.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-display text-foreground mb-2">
              Aucun formulaire
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Aucun formulaire d'adhesion n'a encore ete cree pour cette association.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => {
            const statusBadge = STATUS_BADGE[form.status] || STATUS_BADGE.draft;
            const stepsCount = countFormSteps(form);
            const fieldsCount = countFormFields(form);

            return (
              <Card
                key={form.id}
                className="bg-card/50 border-border/50 hover:border-border transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/association/formulaires/${form.id}`}
                          className="text-foreground font-semibold hover:text-sakura transition-colors"
                        >
                          {form.name}
                        </Link>
                        <Badge className={`text-xs ${statusBadge.className}`}>
                          {statusBadge.label}
                        </Badge>
                        {form.is_default && (
                          <Badge className="text-xs bg-sakura/20 text-sakura gap-1">
                            <Star className="w-3 h-3" />
                            Par defaut
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span>Saison : {form.season || "-"}</span>
                        <span>v{form.version}</span>
                        <span>{stepsCount} etapes</span>
                        <span>{fieldsCount} champs</span>
                        <span>
                          Modifie le{" "}
                          {new Date(form.updated_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      <Link to={`/association/formulaires/${form.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Button>
                      </Link>

                      {form.status === "published" && association.slug && (
                        <Link
                          to={`/asso/${association.slug}/adhesion?preview=true`}
                          target="_blank"
                        >
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye className="w-3.5 h-3.5" />
                            Apercu
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleDuplicate(form)}
                        disabled={duplicateForm.isPending || !gov.canManageForms}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Dupliquer
                      </Button>

                      {form.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-emerald-400"
                          onClick={() => handlePublish(form.id)}
                          disabled={publishForm.isPending || !gov.canManageForms}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Publier
                        </Button>
                      )}

                      {form.status === "published" && !form.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-sakura"
                          onClick={() => handleSetDefault(form.id)}
                          disabled={setDefault.isPending || !gov.canManageForms}
                        >
                          <Star className="w-3.5 h-3.5" />
                          Par defaut
                        </Button>
                      )}

                      {form.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-amber-400"
                          onClick={() => handleArchive(form.id)}
                          disabled={archiveForm.isPending || !gov.canManageForms}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archiver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssociationMembershipForms;
