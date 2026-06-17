import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ──────────────────────────────────────────────────────

export type EventProposalStatus =
  | "submitted"
  | "under_review"
  | "needs_changes"
  | "approved"
  | "rejected"
  | "published";

export interface EventProposal {
  id: string;
  submitted_by: string;
  title: string;
  type_evenement: string | null;
  organisateur: string | null;
  city: string | null;
  venue_name: string | null;
  date_debut: string;
  date_fin: string | null;
  description: string | null;
  external_link: string | null;
  image_url: string | null;
  verification_source: string | null;
  is_free: boolean;
  is_organizer: boolean;
  // ── Coordonnées organisateur (uniquement si is_organizer = true) ──
  organizer_contact_first_name: string | null;
  organizer_contact_last_name: string | null;
  organizer_contact_email: string | null;
  organizer_contact_phone: string | null;
  organizer_contact_role: string | null;
  // ── Modération ──
  status: EventProposalStatus;
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  published_event_id: string | null;
  created_at: string;
  updated_at: string;
  // ── Enrichissements runtime (admin) ──
  submitter_username?: string;
  submitter_email?: string;
  submitter_avatar_url?: string;
  submitter_created_at?: string;
}

export interface OrganizerContactInput {
  organizer_contact_first_name: string;
  organizer_contact_last_name: string;
  organizer_contact_email: string;
  organizer_contact_phone?: string;
  organizer_contact_role?: string;
}

export interface SubmitProposalInput {
  title: string;
  type_evenement?: string;
  organisateur?: string;
  city?: string;
  venue_name?: string;
  date_debut: string;
  date_fin?: string;
  description?: string;
  external_link?: string;
  image_url?: string;
  verification_source?: string;
  is_free: boolean;
  is_organizer: boolean;
  // Contact organisateur — requis si is_organizer = true
  organizer_contact?: OrganizerContactInput;
}

// Cast needed because generated Supabase types don't include event_proposals yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Hook : mes propositions (membre connecté) ─────────────────
/**
 * Retourne les propositions soumises par l'utilisateur courant,
 * triées par date de création décroissante.
 */
export function useMyProposals() {
  const { user } = useAuth();

  return useQuery<EventProposal[]>({
    queryKey: ["my-event-proposals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await db
        .from("event_proposals")
        .select("*")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventProposal[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });
}

// ── Hook : toutes les propositions (admin) ────────────────────
/**
 * Retourne toutes les propositions pour l'interface d'administration.
 * Filtre optionnel par statut.
 * Enrichi avec les infos du profil du soumetteur.
 *
 * NOTE SÉCURITÉ : Le SELECT enrichi inclut les colonnes organizer_contact_*
 * qui sont sensibles. Cette requête n'est exécutée que depuis les écrans admin,
 * et les RLS Supabase garantissent qu'elle échoue pour les non-admins.
 */
export function useAllEventProposals(status?: EventProposalStatus) {
  return useQuery<EventProposal[]>({
    queryKey: ["all-event-proposals", status ?? "all"],
    queryFn: async () => {
      let query = db
        .from("event_proposals")
        .select(
          `*,
           submitter:profiles!submitted_by(
             username,
             display_name,
             avatar_url,
             created_at
           )`
        )
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: EventProposal & {
        submitter?: {
          username?: string;
          display_name?: string;
          avatar_url?: string;
          created_at?: string;
        };
      }) => ({
        ...p,
        submitter_username:
          p.submitter?.display_name || p.submitter?.username || p.submitted_by,
        submitter_avatar_url: p.submitter?.avatar_url ?? null,
        submitter_created_at: p.submitter?.created_at ?? null,
      }));
    },
    staleTime: 1000 * 30,
  });
}

// ── Mutation : soumettre une proposition ──────────────────────
/**
 * Soumet une proposition d'événement en file d'attente de modération.
 * Statut initial : 'submitted'. Jamais publié automatiquement.
 *
 * Inclut les coordonnées organisateur si is_organizer = true.
 */
export function useSubmitProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SubmitProposalInput) => {
      if (!user?.id) throw new Error("Connexion requise pour soumettre une proposition.");

      // Nettoyer les champs vides
      const payload: Record<string, unknown> = {
        submitted_by: user.id,
        title: input.title,
        is_free: input.is_free,
        is_organizer: input.is_organizer,
        date_debut: input.date_debut,
      };

      if (input.type_evenement) payload.type_evenement = input.type_evenement;
      if (input.organisateur) payload.organisateur = input.organisateur;
      if (input.city) payload.city = input.city;
      if (input.venue_name) payload.venue_name = input.venue_name;
      if (input.date_fin) payload.date_fin = input.date_fin;
      if (input.description) payload.description = input.description;
      if (input.external_link) payload.external_link = input.external_link;
      if (input.image_url) payload.image_url = input.image_url;
      if (input.verification_source) payload.verification_source = input.verification_source;

      // Coordonnées organisateur — incluses seulement si is_organizer = true
      if (input.is_organizer && input.organizer_contact) {
        const c = input.organizer_contact;
        payload.organizer_contact_first_name = c.organizer_contact_first_name;
        payload.organizer_contact_last_name  = c.organizer_contact_last_name;
        payload.organizer_contact_email      = c.organizer_contact_email;
        if (c.organizer_contact_phone) payload.organizer_contact_phone = c.organizer_contact_phone;
        if (c.organizer_contact_role)  payload.organizer_contact_role  = c.organizer_contact_role;
      } else {
        // S'assurer que les champs sont nulls quand non-organisateur
        payload.organizer_contact_first_name = null;
        payload.organizer_contact_last_name  = null;
        payload.organizer_contact_email      = null;
        payload.organizer_contact_phone      = null;
        payload.organizer_contact_role       = null;
      }

      const { data, error } = await db
        .from("event_proposals")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as EventProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-event-proposals", user?.id] });
    },
    onError: (err: Error) => {
      console.error("[useSubmitProposal] Erreur:", err);
      toast.error("Erreur lors de la soumission. Réessaie.");
    },
  });
}

// ── Mutation : mise à jour du statut (admin) ──────────────────
/**
 * Permet à un admin de changer le statut d'une proposition,
 * d'ajouter des notes et un motif de rejet.
 */
export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      proposalId,
      status,
      adminNotes,
      rejectionReason,
    }: {
      proposalId: string;
      status: EventProposalStatus;
      adminNotes?: string;
      rejectionReason?: string;
    }) => {
      const update: Record<string, unknown> = {
        status,
        reviewed_by: user?.id,
      };
      if (adminNotes !== undefined) update.admin_notes = adminNotes;
      if (rejectionReason !== undefined) update.rejection_reason = rejectionReason;

      const { data, error } = await db
        .from("event_proposals")
        .update(update)
        .eq("id", proposalId)
        .select()
        .single();

      if (error) throw error;
      return data as EventProposal;
    },
    onSuccess: (data: EventProposal) => {
      queryClient.invalidateQueries({ queryKey: ["all-event-proposals"] });
      const labels: Record<EventProposalStatus, string> = {
        submitted:     "Soumis",
        under_review:  "En cours de révision",
        needs_changes: "Corrections demandées",
        approved:      "Approuvé",
        rejected:      "Rejeté",
        published:     "Publié",
      };
      toast.success(`Statut mis à jour : ${labels[data.status]}`);
    },
    onError: (err: Error) => {
      console.error("[useUpdateProposalStatus] Erreur:", err);
      toast.error("Erreur lors de la mise à jour.");
    },
  });
}
