import { useState } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Clock,
  MessageSquarePlus,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
  CreditCard,
  AlertCircle,
  PenLine,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import {
  useMembershipSubmissionDetail,
  useUpdateMembershipSubmissionStatus,
  useRequestMoreMembershipInfo,
  useActivateMembershipSubmission,
} from "@/hooks/useMembershipWorkflow";
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type MembershipSubmissionStatus,
} from "@/types/membershipWorkflow";
import {
  getStatusActions,
  canTransition,
} from "@/lib/membership-form/statusMachine";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
  basePath?: string;
}

const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { association, basePath } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();
  const resolvedBasePath = basePath || "/association";

  const { data: detail, isLoading } = useMembershipSubmissionDetail(submissionId);
  const updateStatus = useUpdateMembershipSubmissionStatus();
  const requestInfo = useRequestMoreMembershipInfo();
  const activateMember = useActivateMembershipSubmission();

  const [actionDialog, setActionDialog] = useState<{
    targetStatus: MembershipSubmissionStatus;
    label: string;
    requiresReason: boolean;
    requiresMessage: boolean;
  } | null>(null);
  const [actionText, setActionText] = useState("");

  if (!association) return null;

  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  const status = detail.status as MembershipSubmissionStatus;
  const actions = getStatusActions(status);

  // Parse answer values
  const answersMap: Record<string, string> = {};
  for (const a of detail.answers) {
    try {
      answersMap[a.field_id] = typeof a.value === "string" ? JSON.parse(a.value) : String(a.value);
    } catch {
      answersMap[a.field_id] = String(a.value);
    }
  }

  // Group answers by step
  const stepGroups: Record<string, Array<{ field_id: string; field_type: string; value: string }>> = {};
  for (const a of detail.answers) {
    if (!stepGroups[a.step_id]) stepGroups[a.step_id] = [];
    let val: string;
    try { val = typeof a.value === "string" ? JSON.parse(a.value) : String(a.value); }
    catch { val = String(a.value); }
    stepGroups[a.step_id].push({ field_id: a.field_id, field_type: a.field_type, value: val });
  }

  const handleAction = async () => {
    if (!actionDialog || !submissionId) return;

    if (actionDialog.targetStatus === "needs_more_info") {
      if (!actionText.trim()) {
        toast.error("Un message est obligatoire");
        return;
      }
      await requestInfo.mutateAsync({
        submissionId,
        associationId: association.id,
        currentStatus: status,
        message: actionText.trim(),
      });
    } else if (actionDialog.targetStatus === "activated") {
      await activateMember.mutateAsync({
        submissionId,
        associationId: association.id,
        currentStatus: status,
        answers: detail.answers.map((a) => ({ field_id: a.field_id, value: a.value })),
      });
    } else {
      await updateStatus.mutateAsync({
        submissionId,
        associationId: association.id,
        currentStatus: status,
        newStatus: actionDialog.targetStatus,
        reason: actionText.trim() || undefined,
      });
    }

    setActionDialog(null);
    setActionText("");
  };

  const isPending = updateStatus.isPending || requestInfo.isPending || activateMember.isPending;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ═══ Governance banner ═══ */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            gov.isBlocked
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <ShieldAlert
            className={`w-5 h-5 shrink-0 ${
              gov.isBlocked ? "text-red-400" : "text-amber-400"
            }`}
          />
          <p
            className={`text-sm ${
              gov.isBlocked ? "text-red-200/80" : "text-amber-200/80"
            }`}
          >
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Back + Header */}
      <div>
        <Link
          to={`${resolvedBasePath}/adhesions`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour a la liste
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display text-foreground">
              {detail.applicant_name || "Dossier d'adhesion"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${SUBMISSION_STATUS_COLORS[status]}`}>
                {SUBMISSION_STATUS_LABELS[status]}
              </Badge>
              {detail.public_slug && (
                <span className="text-xs font-mono text-muted-foreground">
                  {detail.public_slug}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {detail.pathway === "minor" ? "Mineur" : "Majeur"}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.targetStatus}
                variant={action.variant as any}
                size="sm"
                className="gap-1.5"
                disabled={!gov.canReviewSubmissions}
                onClick={() => {
                  if (!gov.canReviewSubmissions) return;
                  setActionDialog({
                    targetStatus: action.targetStatus,
                    label: action.label,
                    requiresReason: action.requiresReason,
                    requiresMessage: action.requiresMessage,
                  });
                  setActionText("");
                }}
              >
                {ICON_MAP[action.icon]}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paiement</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {PAYMENT_STATUS_LABELS[detail.payment_status]}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Soumis le</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {detail.submitted_at
                ? new Date(detail.submitted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saison</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {detail.season || "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Answers by step */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <FileText className="w-4 h-4 text-sakura" />
            Reponses du formulaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(stepGroups).map(([stepId, fields]) => (
            <div key={stepId}>
              <h3 className="text-sm font-display text-muted-foreground mb-3 capitalize">
                {stepId.replace(/-/g, " ")}
              </h3>
              <div className="space-y-2">
                {fields.map((f) => (
                  <div
                    key={f.field_id}
                    className="flex items-start gap-3 py-1.5"
                  >
                    <span className="text-xs text-muted-foreground min-w-[140px] shrink-0">
                      {formatFieldLabel(f.field_id)}
                    </span>
                    <span className="text-sm text-foreground break-words">
                      {formatFieldValue(f.value, f.field_type)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Consents */}
      {detail.consents.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Consentements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.consents.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-1">
                {c.accepted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm text-foreground">{c.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      {detail.signatures.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <PenLine className="w-4 h-4 text-turquoise" />
              Signatures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.signatures.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-1">
                <PenLine className="w-4 h-4 text-turquoise flex-shrink-0" />
                <span className="text-sm text-foreground italic">
                  {s.signed_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  le {new Date(s.signed_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detail.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun historique</p>
          ) : (
            <div className="space-y-3">
              {detail.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sakura mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">
                      {h.from_status ? (
                        <>
                          {SUBMISSION_STATUS_LABELS[h.from_status as MembershipSubmissionStatus] || h.from_status}
                          {" → "}
                          {SUBMISSION_STATUS_LABELS[h.to_status as MembershipSubmissionStatus] || h.to_status}
                        </>
                      ) : (
                        SUBMISSION_STATUS_LABELS[h.to_status as MembershipSubmissionStatus] || h.to_status
                      )}
                    </p>
                    {h.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(h.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests */}
      {detail.requests.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-orange-400" />
              Demandes de complement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.requests.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant="outline"
                    className={
                      r.status === "open"
                        ? "text-orange-400 border-orange-400/30"
                        : "text-muted-foreground"
                    }
                  >
                    {r.status === "open" ? "Ouvert" : r.status === "resolved" ? "Resolu" : "Annule"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.requested_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{r.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog
        open={!!actionDialog}
        onOpenChange={() => {
          setActionDialog(null);
          setActionText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.label}</DialogTitle>
            <DialogDescription>
              {actionDialog?.requiresMessage
                ? "Ecris un message pour le candidat."
                : actionDialog?.requiresReason
                ? "Une raison est obligatoire."
                : "Confirmer cette action ?"}
            </DialogDescription>
          </DialogHeader>

          {(actionDialog?.requiresMessage || actionDialog?.requiresReason) && (
            <Textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder={
                actionDialog?.requiresMessage
                  ? "Decris les informations manquantes..."
                  : "Raison du refus..."
              }
              rows={3}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Helpers ──

function formatFieldLabel(fieldId: string): string {
  return fieldId
    .replace(/^_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatFieldValue(value: string, fieldType: string): string {
  if (!value || value === "undefined" || value === "null") return "-";

  if (fieldType === "checkbox-group" || fieldType === "checkbox") {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) return arr.join(", ");
    } catch {}
  }

  if (value === "true") return "Oui";
  if (value === "false") return "Non";

  return value;
}

export default SubmissionDetail;
