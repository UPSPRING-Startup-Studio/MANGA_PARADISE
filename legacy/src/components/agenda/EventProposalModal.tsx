import { useState } from "react";
import { X, PenLine, Send, Info, UserRound, Lock } from "lucide-react";
import {
  useSubmitProposal,
  useMyProposals,
  type SubmitProposalInput,
  type OrganizerContactInput,
  type EventProposalStatus,
} from "@/hooks/useEventProposals";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EVENT_TYPE_OPTIONS } from "./constants";

// ── Props ──────────────────────────────────────────────────────

interface EventProposalModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Status badge (exporté pour réutilisation dans l'admin) ────

export function ProposalStatusBadge({ status }: { status: EventProposalStatus }) {
  const config: Record<EventProposalStatus, { label: string; bg: string; color: string }> = {
    submitted:     { label: "Soumis",          bg: "rgba(74,74,106,0.08)",  color: "#4A4A6A" },
    under_review:  { label: "En révision",     bg: "rgba(52,152,219,0.1)",  color: "#2980B9" },
    needs_changes: { label: "Corrections",     bg: "rgba(243,156,18,0.12)", color: "#E67E22" },
    approved:      { label: "Approuvé",        bg: "rgba(39,174,96,0.1)",   color: "#27AE60" },
    rejected:      { label: "Refusé",          bg: "rgba(199,0,57,0.08)",   color: "#C70039" },
    published:     { label: "Publié",          bg: "rgba(39,174,96,0.15)",  color: "#1E8449" },
  };
  const c = config[status] ?? { label: status, bg: "#F0F0F5", color: "#4A4A6A" };
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, color: c.color, fontFamily: "'DM Sans', sans-serif" }}
    >
      {c.label}
    </span>
  );
}

// ── Types locaux ───────────────────────────────────────────────

interface FormState extends SubmitProposalInput {
  // Champs contact organisateur inline (plat, pour le formulaire)
  _oc_first_name: string;
  _oc_last_name: string;
  _oc_email: string;
  _oc_phone: string;
  _oc_role: string;
}

interface FormErrors {
  _oc_first_name?: string;
  _oc_last_name?: string;
  _oc_email?: string;
}

// ── Form initial state ─────────────────────────────────────────

const INITIAL_FORM: FormState = {
  title: "",
  type_evenement: "",
  organisateur: "",
  city: "",
  venue_name: "",
  date_debut: "",
  date_fin: "",
  description: "",
  external_link: "",
  verification_source: "",
  is_free: true,
  is_organizer: false,
  _oc_first_name: "",
  _oc_last_name: "",
  _oc_email: "",
  _oc_phone: "",
  _oc_role: "",
};

// ── Shared input style helpers ─────────────────────────────────

const inputBase: React.CSSProperties = {
  border: "1.5px solid #E8E8F0",
  fontFamily: "'DM Sans', sans-serif",
  color: "#1A1A2E",
  background: "#FAFAFA",
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1.5px solid #C70039",
  background: "#FFF8FA",
};

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ── Modal ──────────────────────────────────────────────────────

export default function EventProposalModal({ open, onClose }: EventProposalModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const submit = useSubmitProposal();
  const { data: myProposals = [] } = useMyProposals();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<"form" | "success">("form");

  if (!open) return null;

  // ── Field handlers ──────────────────────────────────────────
  const set = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (field in errors) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!e.target.style.borderColor.includes("C70039")) {
      e.target.style.borderColor = "#C70039";
    }
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Only reset if not in error state (error class handles red border)
    if (!e.target.dataset.hasError) e.target.style.borderColor = "#E8E8F0";
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (form.is_organizer) {
      if (!form._oc_first_name.trim()) newErrors._oc_first_name = "Prénom requis";
      if (!form._oc_last_name.trim())  newErrors._oc_last_name  = "Nom requis";
      if (!form._oc_email.trim()) {
        newErrors._oc_email = "Email requis";
      } else if (!isValidEmail(form._oc_email)) {
        newErrors._oc_email = "Email invalide";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    if (!validate()) return;

    // Build organizer contact object if is_organizer
    const organizerContact: OrganizerContactInput | undefined = form.is_organizer
      ? {
          organizer_contact_first_name: form._oc_first_name.trim(),
          organizer_contact_last_name:  form._oc_last_name.trim(),
          organizer_contact_email:      form._oc_email.trim(),
          organizer_contact_phone:      form._oc_phone.trim() || undefined,
          organizer_contact_role:       form._oc_role.trim()  || undefined,
        }
      : undefined;

    const payload: SubmitProposalInput = {
      title:               form.title,
      type_evenement:      form.type_evenement,
      organisateur:        form.organisateur,
      city:                form.city,
      venue_name:          form.venue_name,
      date_debut:          form.date_debut,
      date_fin:            form.date_fin,
      description:         form.description,
      external_link:       form.external_link,
      verification_source: form.verification_source,
      is_free:             form.is_free,
      is_organizer:        form.is_organizer,
      organizer_contact:   organizerContact,
    };

    try {
      await submit.mutateAsync(payload);
      setStep("success");
      setForm(INITIAL_FORM);
      setErrors({});
    } catch {
      // error already handled by hook
    }
  };

  const handleClose = () => {
    setStep("form");
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,46,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid #E8E8F0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{ background: "rgba(199,0,57,0.06)" }}
            >
              <PenLine size={20} color="#C70039" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: "#1A1A2E" }}>
                Proposer un événement
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 13, color: "#8E8EA0" }}>
                Soumission → validation par l'équipe MP avant publication
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F0F0F5] transition-colors"
            style={{ color: "#8E8EA0" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Success screen ── */}
        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, color: "#1A1A2E" }}>
              Proposition envoyée !
            </h3>
            <p
              className="mt-2 mb-6 max-w-sm mx-auto"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#4A4A6A", lineHeight: 1.6 }}
            >
              L'équipe Manga Paradise va examiner ta proposition. Tu seras notifié(e) de l'avancement.
            </p>

            {myProposals.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl text-left" style={{ background: "#F8F9FC", border: "1px solid #E8E8F0" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Mes propositions
                </div>
                {myProposals.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 gap-3">
                    <span className="text-[13px] text-[#1A1A2E] font-medium line-clamp-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {p.title}
                    </span>
                    <ProposalStatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-full text-white transition-all duration-200 hover:scale-[1.02]"
              style={{ padding: "12px 28px", background: "linear-gradient(135deg, #C70039, #E46155)", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14 }}
            >
              Fermer
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Warning notice */}
            <div className="flex items-start gap-3 p-4 rounded-[14px]" style={{ background: "rgba(199,0,57,0.03)", border: "1px solid rgba(199,0,57,0.12)" }}>
              <Info size={18} color="#C70039" className="shrink-0 mt-0.5" />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#4A4A6A", lineHeight: 1.6 }}>
                <strong style={{ color: "#C70039" }}>Important</strong> — Ta proposition ne sera jamais publiée automatiquement. Elle sera examinée par l'équipe Manga Paradise avant toute mise en ligne.
              </p>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Titre de l'événement *
              </label>
              <input
                required
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Ex : Japan Expo 2026, Sakura Con…"
                className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Type + Organisateur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Type
                </label>
                <select
                  value={form.type_evenement || ""}
                  onChange={e => set("type_evenement", e.target.value)}
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="">— Choisir —</option>
                  {EVENT_TYPE_OPTIONS.filter(t => t.key !== "all").map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Organisateur
                </label>
                <input
                  value={form.organisateur || ""}
                  onChange={e => set("organisateur", e.target.value)}
                  placeholder="Nom de l'organisateur"
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Ville + Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Ville *
                </label>
                <input
                  required
                  value={form.city || ""}
                  onChange={e => set("city", e.target.value)}
                  placeholder="Ex : Paris, Lyon…"
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Lieu / Salle
                </label>
                <input
                  value={form.venue_name || ""}
                  onChange={e => set("venue_name", e.target.value)}
                  placeholder="Ex : Parc des Expositions…"
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Date de début *
                </label>
                <input
                  required
                  type="date"
                  value={form.date_debut}
                  onChange={e => set("date_debut", e.target.value)}
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Date de fin
                </label>
                <input
                  type="date"
                  value={form.date_fin || ""}
                  onChange={e => set("date_fin", e.target.value)}
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Description
              </label>
              <textarea
                value={form.description || ""}
                onChange={e => set("description", e.target.value)}
                placeholder="Décris l'événement en quelques lignes…"
                rows={3}
                className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none resize-none"
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Lien officiel + Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Lien officiel
                </label>
                <input
                  type="url"
                  value={form.external_link || ""}
                  onChange={e => set("external_link", e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Source de vérification
                </label>
                <input
                  value={form.verification_source || ""}
                  onChange={e => set("verification_source", e.target.value)}
                  placeholder="Site officiel, Facebook…"
                  className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={e => set("is_free", e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#C70039" }}
                />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4A4A6A", fontWeight: 500 }}>
                  Entrée gratuite
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_organizer}
                  onChange={e => set("is_organizer", e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#C70039" }}
                />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4A4A6A", fontWeight: 500 }}>
                  Je suis organisateur de cet événement
                </span>
              </label>
            </div>

            {/* ── Bloc conditionnel : Coordonnées organisateur ── */}
            {form.is_organizer && (
              <div
                className="rounded-[16px] p-5 space-y-4"
                style={{ background: "rgba(52,152,219,0.04)", border: "1.5px solid rgba(52,152,219,0.2)" }}
              >
                {/* Header bloc */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(52,152,219,0.1)" }}
                  >
                    <UserRound size={17} color="#2980B9" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>
                      Coordonnées organisateur
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Lock size={11} color="#8E8EA0" />
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8E8EA0", lineHeight: 1.5 }}>
                        Ces informations ne seront jamais affichées publiquement. Elles nous servent uniquement à te recontacter en tant qu'organisateur.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prénom + Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Prénom *
                    </label>
                    <input
                      value={form._oc_first_name}
                      onChange={e => set("_oc_first_name", e.target.value)}
                      placeholder="Ton prénom"
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                      style={errors._oc_first_name ? inputError : inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    {errors._oc_first_name && (
                      <p className="mt-1 text-[11px] font-medium" style={{ color: "#C70039" }}>{errors._oc_first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Nom *
                    </label>
                    <input
                      value={form._oc_last_name}
                      onChange={e => set("_oc_last_name", e.target.value)}
                      placeholder="Ton nom"
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                      style={errors._oc_last_name ? inputError : inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    {errors._oc_last_name && (
                      <p className="mt-1 text-[11px] font-medium" style={{ color: "#C70039" }}>{errors._oc_last_name}</p>
                    )}
                  </div>
                </div>

                {/* Email * */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Email de contact *
                  </label>
                  <input
                    type="email"
                    value={form._oc_email}
                    onChange={e => set("_oc_email", e.target.value)}
                    placeholder="email@exemple.fr"
                    className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                    style={errors._oc_email ? inputError : inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  {errors._oc_email && (
                    <p className="mt-1 text-[11px] font-medium" style={{ color: "#C70039" }}>{errors._oc_email}</p>
                  )}
                </div>

                {/* Téléphone (optionnel) + Rôle (optionnel) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Téléphone <span className="font-normal normal-case tracking-normal text-[#8E8EA0]">(optionnel)</span>
                    </label>
                    <input
                      type="tel"
                      value={form._oc_phone}
                      onChange={e => set("_oc_phone", e.target.value)}
                      placeholder="06 00 00 00 00"
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A4A6A] mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Rôle <span className="font-normal normal-case tracking-normal text-[#8E8EA0]">(optionnel)</span>
                    </label>
                    <input
                      value={form._oc_role}
                      onChange={e => set("_oc_role", e.target.value)}
                      placeholder="Ex : Président asso, Chargé de com…"
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] focus:outline-none"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3" style={{ borderTop: "1px solid #F0F0F5" }}>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full px-5 py-3 text-[14px] font-medium hover:bg-[#F0F0F5] transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#4A4A6A" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="inline-flex items-center gap-2 rounded-full text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ padding: "12px 28px", background: "linear-gradient(135deg, #C70039, #E46155)", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14 }}
              >
                {submit.isPending
                  ? "Envoi en cours…"
                  : <><Send size={16} /> Soumettre ma proposition</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
