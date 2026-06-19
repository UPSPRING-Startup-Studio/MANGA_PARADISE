import { Link } from "react-router-dom";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MembershipFormDefinitionRecord } from "@/types/membershipWorkflow";

interface ToolbarProps {
  formRecord: MembershipFormDefinitionRecord | null | undefined;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  previewUrl: string;
  readOnly?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  published: { label: "Publie", className: "bg-emerald-500/20 text-emerald-400" },
  archived: { label: "Archive", className: "bg-amber-500/20 text-amber-400" },
};

const Toolbar = ({ formRecord, isDirty, isSaving, onSave, previewUrl, readOnly }: ToolbarProps) => {
  const statusBadge = STATUS_BADGE[formRecord?.status || "draft"] || STATUS_BADGE.draft;

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-border/30 bg-[#1a1a1a]">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={formRecord ? `/association/formulaires/${formRecord.id}` : "/association/formulaires"}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-sm font-display text-foreground truncate">
            {formRecord?.name || "Formulaire"}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              v{formRecord?.version || 1}
            </span>
            {isDirty && (
              <span className="text-[10px] text-amber-400">
                Modifications non enregistrees
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to={previewUrl} target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Apercu
          </Button>
        </Link>
        <Button
          size="sm"
          className="gap-1.5 bg-sakura hover:bg-sakura/90"
          onClick={onSave}
          disabled={isSaving || !isDirty || readOnly}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
