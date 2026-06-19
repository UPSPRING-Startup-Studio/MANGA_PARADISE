import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AssociationStats {
  activeMembersCount: number;
  validatedMembershipsCount: number;
  pendingMembershipsCount: number;
  incompleteMembershipsCount: number;
  upcomingEventsCount: number;
  upcomingRegistrationsCount: number;
  volunteerRegistrationsCount: number;
  pendingDocumentsCount: number;
}

export interface AdhesionFunnelStep {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface MembersHistoryPoint {
  month: string;
  label: string;
  count: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  date_debut: string | null;
  city: string | null;
  location: string | null;
  status: string;
  image_url: string | null;
  max_attendees: number | null;
  participantCount: number;
  volunteerCount: number;
}

export interface PendingMember {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  membership_status: string | null;
  created_at: string | null;
  birth_date: string | null;
}

// ──────────────────────────────────────────────
// Hook : KPI stats de l'association
// ──────────────────────────────────────────────

export function useAssociationStats(associationId: string | null) {
  return useQuery({
    queryKey: ["association-dashboard-stats", associationId],
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AssociationStats> => {
      if (!associationId) throw new Error("No association ID");

      const now = new Date().toISOString();

      // 1) Membres actifs de l'association
      const { count: activeMembersCount } = await supabase
        .from("association_memberships")
        .select("*", { count: "exact", head: true })
        .eq("association_id", associationId)
        .eq("is_active", true);

      // 2) Adhesions validees (profiles avec membership_status = 'active' liés a l'asso)
      // Fallback: count global de profiles actifs si pas de filtre asso possible
      const { count: validatedMembershipsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("membership_status", "active");

      // 3) Adhesions en attente
      const { count: pendingMembershipsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("membership_status", ["pending_payment", "en_attente"]);

      // 4) Dossiers incomplets (profils sans onboarding complet)
      const { count: incompleteMembershipsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("onboarding_completed", false)
        .not("membership_status", "is", null);

      // 5) Evenements a venir lies a l'association
      const { count: upcomingEventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("association_id", associationId)
        .gte("date", now)
        .neq("status", "brouillon");

      // 6) Inscriptions sur evenements a venir
      const { data: upcomingEventIds } = await supabase
        .from("events")
        .select("id")
        .eq("association_id", associationId)
        .gte("date", now);

      let upcomingRegistrationsCount = 0;
      let volunteerRegistrationsCount = 0;

      if (upcomingEventIds && upcomingEventIds.length > 0) {
        const ids = upcomingEventIds.map((e) => e.id);

        const { count: regCount } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .in("event_id", ids);
        upcomingRegistrationsCount = regCount || 0;

        const { count: volCount } = await supabase
          .from("event_participants")
          .select("*", { count: "exact", head: true })
          .in("event_id", ids)
          .eq("role", "benevole");
        volunteerRegistrationsCount = volCount || 0;
      }

      // 7) Documents en attente
      const { count: pendingDocumentsCount } = await supabase
        .from("association_documents")
        .select("*", { count: "exact", head: true })
        .eq("association_id", associationId)
        .eq("status", "pending_review" as any);

      return {
        activeMembersCount: activeMembersCount || 0,
        validatedMembershipsCount: validatedMembershipsCount || 0,
        pendingMembershipsCount: pendingMembershipsCount || 0,
        incompleteMembershipsCount: incompleteMembershipsCount || 0,
        upcomingEventsCount: upcomingEventsCount || 0,
        upcomingRegistrationsCount,
        volunteerRegistrationsCount,
        pendingDocumentsCount: pendingDocumentsCount || 0,
      };
    },
  });
}

// ──────────────────────────────────────────────
// Hook : Historique des membres (6 mois glissants)
// ──────────────────────────────────────────────

export function useAssociationMembersHistory(associationId: string | null) {
  return useQuery({
    queryKey: ["association-members-history", associationId],
    enabled: !!associationId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MembersHistoryPoint[]> => {
      if (!associationId) return [];

      // Recuperer tous les memberships de l'asso avec joined_at
      const { data: memberships } = await supabase
        .from("association_memberships")
        .select("joined_at, left_at, is_active")
        .eq("association_id", associationId);

      if (!memberships || memberships.length === 0) return [];

      // Generer 6 mois glissants
      const months: MembersHistoryPoint[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const endIso = endOfMonth.toISOString();

        // Compter les membres actifs a la fin de ce mois
        const count = memberships.filter((m) => {
          const joinedAt = m.joined_at ? new Date(m.joined_at) : null;
          const leftAt = m.left_at ? new Date(m.left_at) : null;

          if (!joinedAt || joinedAt > endOfMonth) return false;
          if (leftAt && leftAt <= endOfMonth) return false;
          return true;
        }).length;

        const label = d.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        });

        months.push({
          month: d.toISOString().slice(0, 7),
          label,
          count,
        });
      }

      return months;
    },
  });
}

// ──────────────────────────────────────────────
// Hook : Funnel des adhesions
// ──────────────────────────────────────────────

export function useAssociationAdhesionFunnel(associationId: string | null) {
  return useQuery({
    queryKey: ["association-adhesion-funnel", associationId],
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AdhesionFunnelStep[]> => {
      if (!associationId) return [];

      // Count total profiles (demandes recues = tous les profils existants)
      const { count: totalProfiles } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("membership_status", "is", null);

      // Dossiers en cours (en_attente ou pending_payment)
      const { count: enCours } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("membership_status", ["pending_payment", "en_attente"]);

      // Paiement recu (onboarding complet + pas encore active)
      const { count: paiementRecu } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("onboarding_completed", true)
        .eq("membership_status", "pending_payment");

      // Adhesion validee
      const { count: valide } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("membership_status", "active");

      return [
        {
          key: "demandes",
          label: "Demandes recues",
          count: totalProfiles || 0,
          color: "#94a3b8",
        },
        {
          key: "en_cours",
          label: "Dossiers en cours",
          count: enCours || 0,
          color: "#F5A623",
        },
        {
          key: "paiement",
          label: "Paiement recu",
          count: paiementRecu || 0,
          color: "#F26B2E",
        },
        {
          key: "valide",
          label: "Adhesion validee",
          count: valide || 0,
          color: "#22c55e",
        },
      ];
    },
  });
}

// ──────────────────────────────────────────────
// Hook : Prochains evenements de l'association
// ──────────────────────────────────────────────

export function useAssociationUpcomingEvents(associationId: string | null) {
  return useQuery({
    queryKey: ["association-upcoming-events", associationId],
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<UpcomingEvent[]> => {
      if (!associationId) return [];

      const now = new Date().toISOString();

      const { data: events, error } = await supabase
        .from("events")
        .select("id, title, date, date_debut, city, location, status, image_url, max_attendees")
        .eq("association_id", associationId)
        .gte("date", now)
        .order("date", { ascending: true })
        .limit(5);

      if (error || !events) return [];

      // Pour chaque event, compter les participants
      const enriched: UpcomingEvent[] = await Promise.all(
        events.map(async (evt) => {
          const { count: participantCount } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", evt.id);

          const { count: volunteerCount } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", evt.id)
            .eq("role", "benevole");

          return {
            ...evt,
            participantCount: participantCount || 0,
            volunteerCount: volunteerCount || 0,
          };
        })
      );

      return enriched;
    },
  });
}

// ──────────────────────────────────────────────
// Hook : Profils en attente de validation
// ──────────────────────────────────────────────

export function useAssociationPendingMembers() {
  return useQuery({
    queryKey: ["association-pending-members"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PendingMember[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, membership_status, created_at, birth_date")
        .in("membership_status", ["pending_payment", "en_attente"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data) return [];
      return data as PendingMember[];
    },
  });
}
