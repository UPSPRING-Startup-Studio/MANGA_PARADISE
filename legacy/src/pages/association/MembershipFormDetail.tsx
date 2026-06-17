import { useParams, useOutletContext, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Star,
  Eye,
  Send,
  Archive,
  Copy,
  Calendar,
  Hash,
  Layers,
  Settings2,
  ExternalLink,
  PenSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import {
  useMembershipFormDefinition,
  usePublishMembershipForm,
  useArchiveMembershipForm,
  useSetDefaultMembershipForm,
  useDuplicateMembershipForm,
} from "@/hooks/useMembershipFormDefinitions";
import {
  getStepSummaries,
  countFormFields,
} from "@/lib/membership-form/loadPublishedForm";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
  basePath?: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  published: { label: "Publie", className: "bg-emerald-500/20 text-emerald-400" },
  archived: { label: "Archive", className: "bg-amber-500/20 text-amber-400" },
};

const MembershipFormDetail = () => {
  const { formId } = useParams<{ formId: string }>();
  const { association, basePath } = useOutletContext<AssociationContext>();
  const resolvedBasePath = basePath || "/association";

  const { data: formDef, isLoading } = useMembershipFormDefinition(formId);
  const publishForm = usePublishMembershipForm();
  const archiveForm = useArchiveMembershipForm();
  const setDefault = useSetDefaultMembershipForm();
  const duplicateForm = useDuplicateMembershipForm();

  if (!association) return null;

  if (isLoading || !formDef) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[formDef.status] || STATUS_BADGE.draft;
  const stepSummaries = getStepSummaries(formDef);
  const totalFields = countFormFields(formDef);
  const def = formDef.definition as any;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        to={`${resolvedBasePath}/formulaires`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" />
        Retour aux formulaires
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display text-foreground">
              {formDef.name}
            </h1>
            <Badge className={`text-xs ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
            {formDef.is_default && (
              <Badge className="text-xs bg-sakura/20 text-sakura gap-1">
                <Star className="w-3 h-3" />
                Par defaut
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            v{formDef.version} — Saison {formDef.season || "non definie"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/association/formulaires/${formDef.id}/edit`}>
            <Button size="sm" className="gap-2 bg-sakura hover:bg-sakura/90">
              <PenSquare className="w-4 h-4" />
              Editer
            </Button>
          </Link>

          {formDef.status === "published" && association.slug && (
            <Link
              to={`/asso/${association.slug}/adhesion?preview=true`}
              target="_blank"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                Apercu
              </Button>
            </Link>
          )}

          {formDef.status === "published" && association.slug && (
            <Link
              to={`/asso/${association.slug}/adhesion`}
              target="_blank"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Formulaire public
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => duplicateForm.mutate({ sourceForm: formDef })}
            disabled={duplicateForm.isPending}
          >
            <Copy className="w-4 h-4" />
            Dupliquer
          </Button>

          {formDef.status === "draft" && (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => publishForm.mutate({ formId: formDef.id, associationId: association.id })}
              disabled={publishForm.isPending}
            >
              <Send className="w-4 h-4" />
              Publier
            </Button>
          )}

          {formDef.status === "published" && !formDef.is_default && (
            <Button
              size="sm"
              className="gap-2 bg-sakura hover:bg-sakura/90"
              onClick={() => setDefault.mutate({ formId: formDef.id, associationId: association.id })}
              disabled={setDefault.isPending}
            >
              <Star className="w-4 h-4" />
              Definir par defaut
            </Button>
          )}

          {formDef.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-amber-400 border-amber-400/30"
              onClick={() => archiveForm.mutate({ formId: formDef.id, associationId: association.id })}
              disabled={archiveForm.isPending}
            >
              <Archive className="w-4 h-4" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 text-sakura mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">{stepSummaries.length}</p>
            <p className="text-xs text-muted-foreground">Etapes</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Settings2 className="w-5 h-5 text-turquoise mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">{totalFields}</p>
            <p className="text-xs text-muted-foreground">Champs</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Hash className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">v{formDef.version}</p>
            <p className="text-xs text-muted-foreground">Version</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-display text-foreground mt-1">
              {new Date(formDef.updated_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">Derniere modification</p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {def?.description && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {def.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Steps overview */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Layers className="w-4 h-4 text-sakura" />
            Structure des etapes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stepSummaries.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.fieldCount} champ{step.fieldCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {step.hasCondition && (
                  <Badge variant="outline" className="text-[10px]">
                    Conditionnel
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-display">Metadonnees</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <span className="text-foreground font-mono">{formDef.slug}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID</span>
            <span className="text-foreground font-mono text-xs">{formDef.id}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cree le</span>
            <span className="text-foreground">
              {new Date(formDef.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipFormDetail;
