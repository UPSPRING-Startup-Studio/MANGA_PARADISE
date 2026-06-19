import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useAllEventProposals,
  useUpdateProposalStatus,
  type EventProposalStatus,
  type EventProposal,
} from "@/hooks/useEventProposals";
import { ProposalStatusBadge } from "@/components/agenda/EventProposalModal";
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  X,
  Check,
  Eye,
  AlertCircle,
  Clipboard,
  ChevronDown,
  UserRound,
  Mail,
  Phone,
  Briefcase,
  ArrowUpRight,
  Lock,
} from "lucide-react";

// ── Status tabs ────────────────────────────────────────────────

const STATUS_TABS: { key: EventProposalStatus | "all"; label: string }[] = [
  { key: "all",           label: "Toutes" },
  { key: "submitted",     label: "Soumises" },
  { key: "under_review",  label: "En révision" },
  { key: "needs_changes", label: "Corrections" },
  { key: "approved",      label: "Approuvées" },
  { key: "rejected",      label: "Refusées" },
  { key: "published",     label: "Publiées" },
];

// ── Quick action buttons per status ───────────────────────────

function ProposalActions({
  proposal,
  onAction,
}: {
  proposal: EventProposal;
  onAction: (status: EventProposalStatus) => void;
}) {
  const btn = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border";

  if (proposal.status === "submitted") return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={e => { e.stopPropagation(); onAction("under_review"); }}
        className={`${btn} bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200`}>
        <Eye size={12} /> Examiner
      </button>
      <button onClick={e => { e.stopPropagation(); onAction("rejected"); }}
        className={`${btn} bg-red-50 text-red-700 hover:bg-red-100 border-red-200`}>
        <X size={12} /> Rejeter
      </button>
    </div>
  );

  if (proposal.status === "under_review") return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={e => { e.stopPropagation(); onAction("approved"); }}
        className={`${btn} bg-green-50 text-green-700 hover:bg-green-100 border-green-200`}>
        <Check size={12} /> Approuver
      </button>
      <button onClick={e => { e.stopPropagation(); onAction("needs_changes"); }}
        className={`${btn} bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200`}>
        <AlertCircle size={12} /> Corrections
      </button>
      <button onClick={e => { e.stopPropagation(); onAction("rejected"); }}
        className={`${btn} bg-red-50 text-red-700 hover:bg-red-100 border-red-200`}>
        <X size={12} /> Rejeter
      </button>
    </div>
  );

  if (proposal.status === "approved") return (
    <button onClick={e => { e.stopPropagation(); onAction("published"); }}
      className={`${btn} text-white border-transparent`}
      style={{ background: "#C70039" }}>
      <Clipboard size={12} /> Publier
    </button>
  );

  if (proposal.status === "needs_changes") return (
    <button onClick={e => { e.stopPropagation(); onAction("under_review"); }}
      className={`${btn} bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200`}>
      <Eye size={12} /> Remettre en révision
    </button>
  );

  return null;
}

// ── Submitter profile block ───────────────────────────────────

function SubmitterBlock({ proposal }: { proposal: EventProposal }) {
  const memberSince = proposal.submitter_created_at
    ? new Date(proposal.submitter_created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return (
    <div
      className="rounded-[14px] p-4 space-y-3"
      style={{ background: "rgba(74,74,106,0.04)", border: "1px solid rgba(74,74,106,0.12)" }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Auteur de la proposition
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "rgba(199,0,57,0.08)" }}
        >
          {proposal.submitter_avatar_url ? (
            <img
              src={proposal.submitter_avatar_url}
              alt={proposal.submitter_username || ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserRound size={18} color="#C70039" />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {proposal.submitter_username || proposal.submitted_by}
            </span>
            {/* Link to admin user page */}
            <Link
              to={`/admin/users`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium hover:underline"
              style={{ color: "#C70039" }}
              title="Voir dans l'annuaire admin"
            >
              Voir le profil <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className="font-mono opacity-60 text-[10px]">{proposal.submitted_by}</span>
            {memberSince && <span>Membre depuis {memberSince}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Organizer contact block ───────────────────────────────────

function OrganizerContactBlock({ proposal }: { proposal: EventProposal }) {
  const hasContact =
    proposal.organizer_contact_first_name ||
    proposal.organizer_contact_last_name ||
    proposal.organizer_contact_email ||
    proposal.organizer_contact_phone ||
    proposal.organizer_contact_role;

  if (!proposal.is_organizer) {
    return (
      <div className="rounded-[14px] p-4" style={{ background: "rgba(74,74,106,0.03)", border: "1px solid rgba(74,74,106,0.1)" }}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Contact organisateur
        </div>
        <p className="text-sm text-muted-foreground italic">
          Proposition faite en tant que membre, pas comme organisateur.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[14px] p-4 space-y-3"
      style={{ background: "rgba(52,152,219,0.04)", border: "1.5px solid rgba(52,152,219,0.18)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#2980B9" }}>
          Coordonnées organisateur
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock size={10} /> Confidentiel
        </div>
      </div>

      {!hasContact ? (
        <p className="text-sm text-muted-foreground italic">
          L'organisateur a coché la case mais n'a pas renseigné ses coordonnées.
        </p>
      ) : (
        <dl className="space-y-2">
          {(proposal.organizer_contact_first_name || proposal.organizer_contact_last_name) && (
            <div className="flex items-center gap-2">
              <UserRound size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm">
                {[proposal.organizer_contact_first_name, proposal.organizer_contact_last_name].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          {proposal.organizer_contact_role && (
            <div className="flex items-center gap-2">
              <Briefcase size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm">{proposal.organizer_contact_role}</span>
            </div>
          )}
          {proposal.organizer_contact_email && (
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-muted-foreground shrink-0" />
              <a
                href={`mailto:${proposal.organizer_contact_email}`}
                className="text-sm hover:underline"
                style={{ color: "#C70039" }}
                onClick={e => e.stopPropagation()}
              >
                {proposal.organizer_contact_email}
              </a>
            </div>
          )}
          {proposal.organizer_contact_phone && (
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-muted-foreground shrink-0" />
              <a
                href={`tel:${proposal.organizer_contact_phone}`}
                className="text-sm hover:underline"
                style={{ color: "#C70039" }}
                onClick={e => e.stopPropagation()}
              >
                {proposal.organizer_contact_phone}
              </a>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

/** Total proposals count (exposed for parent header) */
export function useProposalCount() {
  const { data: allProposals = [] } = useAllEventProposals();
  return allProposals.length;
}

export default function AdminEventProposals() {
  const [activeTab, setActiveTab] = useState<EventProposalStatus | "all">("submitted");
  const [selectedProposal, setSelectedProposal] = useState<EventProposal | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: proposals = [], isLoading } = useAllEventProposals(
    activeTab === "all" ? undefined : activeTab
  );
  const { data: allProposals = [] } = useAllEventProposals();
  const updateStatus = useUpdateProposalStatus();

  const countByStatus = allProposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const handleStatusChange = async (proposal: EventProposal, status: EventProposalStatus) => {
    await updateStatus.mutateAsync({
      proposalId: proposal.id,
      status,
      adminNotes: adminNotes || undefined,
      rejectionReason: status === "rejected" ? rejectionReason || undefined : undefined,
    });
    setSelectedProposal(null);
    setAdminNotes("");
    setRejectionReason("");
  };

  const openDetail = (proposal: EventProposal) => {
    setSelectedProposal(proposal);
    setAdminNotes(proposal.admin_notes || "");
    setRejectionReason(proposal.rejection_reason || "");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          File de validation — {allProposals.length} proposition{allProposals.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map(tab => {
          const count = tab.key === "all" ? allProposals.length : countByStatus[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                background: activeTab === tab.key ? "#C70039" : "transparent",
                color: activeTab === tab.key ? "white" : undefined,
                border: "1px solid",
                borderColor: activeTab === tab.key ? "#C70039" : "var(--border)",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
                  style={{
                    background: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "rgba(199,0,57,0.1)",
                    color: activeTab === tab.key ? "white" : "#C70039",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📭</div>
          <p className="text-muted-foreground text-sm">Aucune proposition dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(proposal => (
            <div
              key={proposal.id}
              className="rounded-xl border p-4 hover:border-[#C70039]/30 transition-colors cursor-pointer"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
              onClick={() => openDetail(proposal)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm">{proposal.title}</h3>
                    <ProposalStatusBadge status={proposal.status} />
                    {proposal.is_organizer && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">
                        Organisateur
                      </span>
                    )}
                  </div>
                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {proposal.date_debut}{proposal.date_fin ? ` → ${proposal.date_fin}` : ""}
                    </span>
                    {proposal.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {proposal.city}
                      </span>
                    )}
                    {proposal.type_evenement && <span className="capitalize">{proposal.type_evenement}</span>}
                    {/* Submitter inline with avatar */}
                    <span className="flex items-center gap-1">
                      {proposal.submitter_avatar_url ? (
                        <img src={proposal.submitter_avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <UserRound size={11} />
                      )}
                      <strong>{proposal.submitter_username || proposal.submitted_by}</strong>
                    </span>
                    <span>{new Date(proposal.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div onClick={e => e.stopPropagation()}>
                  <ProposalActions
                    proposal={proposal}
                    onAction={status => handleStatusChange(proposal, status)}
                  />
                </div>
              </div>

              {proposal.rejection_reason && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                  Motif de rejet : {proposal.rejection_reason}
                </div>
              )}

              {/* Published event link */}
              {proposal.published_event_id && (
                <div className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700">
                  Événement publié — ID : {proposal.published_event_id}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Detail panel ── */}
      {selectedProposal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div
              className="flex items-start justify-between p-5 sticky top-0 z-10"
              style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="font-display text-lg leading-tight">{selectedProposal.title}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <ProposalStatusBadge status={selectedProposal.status} />
                  {selectedProposal.is_organizer && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">
                      Organisateur
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    · {new Date(selectedProposal.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Submitter profile block ── */}
              <SubmitterBlock proposal={selectedProposal} />

              {/* ── Event data grid ── */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {selectedProposal.type_evenement && (
                  <><dt className="text-muted-foreground">Type</dt><dd className="capitalize">{selectedProposal.type_evenement}</dd></>
                )}
                {selectedProposal.organisateur && (
                  <><dt className="text-muted-foreground">Organisateur (nom)</dt><dd>{selectedProposal.organisateur}</dd></>
                )}
                {selectedProposal.city && (
                  <><dt className="text-muted-foreground">Ville</dt><dd>{selectedProposal.city}</dd></>
                )}
                {selectedProposal.venue_name && (
                  <><dt className="text-muted-foreground">Lieu</dt><dd>{selectedProposal.venue_name}</dd></>
                )}
                <><dt className="text-muted-foreground">Date début</dt><dd>{selectedProposal.date_debut}</dd></>
                {selectedProposal.date_fin && (
                  <><dt className="text-muted-foreground">Date fin</dt><dd>{selectedProposal.date_fin}</dd></>
                )}
                <><dt className="text-muted-foreground">Gratuit</dt><dd>{selectedProposal.is_free ? "Oui" : "Non"}</dd></>
              </dl>

              {selectedProposal.description && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</div>
                  <p className="text-sm leading-relaxed">{selectedProposal.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                {selectedProposal.external_link && (
                  <a href={selectedProposal.external_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "#C70039" }}>
                    <ExternalLink size={14} /> Lien officiel
                  </a>
                )}
                {selectedProposal.verification_source && (
                  <span className="text-sm text-muted-foreground">
                    Source : {selectedProposal.verification_source}
                  </span>
                )}
              </div>

              {/* ── Organizer contact block ── */}
              <OrganizerContactBlock proposal={selectedProposal} />

              {/* Published event link */}
              {selectedProposal.published_event_id && (
                <div className="rounded-[14px] p-4" style={{ background: "rgba(39,174,96,0.06)", border: "1px solid rgba(39,174,96,0.2)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-green-700 mb-1">
                    Événement publié
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID : <span className="font-mono">{selectedProposal.published_event_id}</span>
                  </p>
                  <Link
                    to={`/admin/events`}
                    className="inline-flex items-center gap-1 text-xs font-medium mt-1.5 hover:underline"
                    style={{ color: "#27AE60" }}
                    onClick={e => e.stopPropagation()}
                  >
                    Voir dans la gestion des événements <ArrowUpRight size={11} />
                  </Link>
                </div>
              )}

              {/* ── Admin notes ── */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Notes internes (non visibles du membre)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Notes de modération…"
                  rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none border focus:outline-none focus:ring-1 focus:ring-[#C70039]"
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                />
              </div>

              {(selectedProposal.status === "submitted" || selectedProposal.status === "under_review") && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Motif de rejet (visible du membre)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Ex : Doublon existant, informations insuffisantes…"
                    rows={2}
                    className="w-full rounded-xl px-3 py-2.5 text-sm resize-none border focus:outline-none focus:ring-1 focus:ring-[#C70039]"
                    style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  />
                </div>
              )}

              {/* ── Actions ── */}
              <div className="pt-2 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                {selectedProposal.status === "submitted" && (
                  <>
                    <button onClick={() => handleStatusChange(selectedProposal, "under_review")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                      <Eye size={14} /> Mettre en révision
                    </button>
                    <button onClick={() => handleStatusChange(selectedProposal, "rejected")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                      <X size={14} /> Rejeter
                    </button>
                  </>
                )}
                {selectedProposal.status === "under_review" && (
                  <>
                    <button onClick={() => handleStatusChange(selectedProposal, "approved")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                      <Check size={14} /> Approuver
                    </button>
                    <button onClick={() => handleStatusChange(selectedProposal, "needs_changes")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors">
                      <AlertCircle size={14} /> Demander corrections
                    </button>
                    <button onClick={() => handleStatusChange(selectedProposal, "rejected")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                      <X size={14} /> Rejeter
                    </button>
                  </>
                )}
                {selectedProposal.status === "approved" && (
                  <button
                    onClick={() => handleStatusChange(selectedProposal, "published")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: "#C70039" }}
                  >
                    <Clipboard size={14} /> Marquer comme publié
                  </button>
                )}
                {selectedProposal.status === "needs_changes" && (
                  <button onClick={() => handleStatusChange(selectedProposal, "under_review")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                    <Eye size={14} /> Remettre en révision
                  </button>
                )}
                {/* Save notes without status change */}
                <button
                  onClick={() => handleStatusChange(selectedProposal, selectedProposal.status)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  <ChevronDown size={14} /> Sauvegarder les notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
