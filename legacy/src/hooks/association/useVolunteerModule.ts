import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ApplicationStatus =
  | "invited" | "started" | "incomplete" | "pending_review"
  | "approved" | "rejected" | "archived";

export type ApplicationSource = "self" | "invitation" | "external" | "promotion";

export type InvolvementStatus =
  | "occasional" | "active" | "staff_event" | "zone_leader"
  | "coordinator" | "alumni";

export type AvailabilityStatus = "available" | "conditional" | "unavailable" | "to_confirm";

export type MissionStatus = "draft" | "open" | "in_progress" | "complete" | "cancelled";
export type MissionPriority = "low" | "medium" | "high" | "critical";
export type ShiftStatus = "open" | "full" | "in_progress" | "completed" | "cancelled";
export type AssignmentStatus =
  | "proposed" | "confirmed" | "checked_in" | "absent"
  | "completed" | "cancelled";

export interface VolunteerApplication {
  id: string;
  association_id: string;
  event_id: string | null;
  user_id: string | null;
  source: ApplicationSource;
  status: ApplicationStatus;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  interests: string[];
  skills: string[];
  participation_preferences: string[];
  availability: Record<string, boolean>;
  experience_level: string;
  languages: string[];
  consent_photo: boolean;
  motivation: string | null;
  onboarding_step: number;
  onboarding_data: Record<string, unknown>;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  invited_by: string | null;
  invitation_message: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    city: string | null;
  };
  reviewer?: {
    id: string;
    display_name: string | null;
  };
}

export interface VolunteerMission {
  id: string;
  association_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  zone: string | null;
  pole: string | null;
  required_skills: string[];
  required_experience: string;
  required_interests: string[];
  slots_needed: number;
  slots_filled: number;
  start_at: string | null;
  end_at: string | null;
  priority: MissionPriority;
  status: MissionStatus;
  responsible_id: string | null;
  notes: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  event?: {
    id: string;
    title: string;
    date: string | null;
    city: string | null;
  };
  responsible?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface VolunteerShift {
  id: string;
  mission_id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  slots_needed: number;
  slots_filled: number;
  location: string | null;
  notes: string | null;
  status: ShiftStatus;
  created_at: string;
}

export interface VolunteerAssignment {
  id: string;
  association_id: string;
  user_id: string;
  mission_id: string;
  shift_id: string | null;
  status: AssignmentStatus;
  proposed_by: string | null;
  proposed_at: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  mission?: {
    id: string;
    title: string;
    zone: string | null;
    start_at: string | null;
    end_at: string | null;
    status: MissionStatus;
  };
  shift?: {
    id: string;
    title: string | null;
    start_at: string;
    end_at: string;
  };
}

export interface VolunteerDashboardData {
  pendingApplications: number;
  activeVolunteers: number;
  onboardingIncomplete: number;
  openMissions: number;
  unfilledSlots: number;
  toConfirmShifts: number;
  upcomingMissions: VolunteerMission[];
  recentApplications: VolunteerApplication[];
  totalHours: number;
  totalMissionsCompleted: number;
  avgReliability: number;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  invited: "Invité·e",
  started: "Commencée",
  incomplete: "Incomplète",
  pending_review: "À valider",
  approved: "Approuvée",
  rejected: "Refusée",
  archived: "Archivée",
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  invited: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  started: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  incomplete: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  pending_review: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Brouillon",
  open: "Ouverte",
  in_progress: "En cours",
  complete: "Terminée",
  cancelled: "Annulée",
};

export const MISSION_STATUS_COLORS: Record<MissionStatus, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  open: "bg-green-500/20 text-green-300 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  complete: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const PRIORITY_LABELS: Record<MissionPriority, string> = {
  low: "Basse",
  medium: "Normale",
  high: "Haute",
  critical: "Critique",
};

export const PRIORITY_COLORS: Record<MissionPriority, string> = {
  low: "bg-slate-500/20 text-slate-300",
  medium: "bg-blue-500/20 text-blue-300",
  high: "bg-orange-500/20 text-orange-300",
  critical: "bg-red-500/20 text-red-300",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  proposed: "Proposé",
  confirmed: "Confirmé",
  checked_in: "Check-in",
  absent: "Absent",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  proposed: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  checked_in: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  absent: "bg-red-500/20 text-red-300 border-red-500/30",
  completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const INVOLVEMENT_LABELS: Record<InvolvementStatus, string> = {
  occasional: "Occasionnel",
  active: "Actif",
  staff_event: "Staff événementiel",
  zone_leader: "Responsable de zone",
  coordinator: "Coordinateur",
  alumni: "Ancien bénévole",
};

export const INVOLVEMENT_COLORS: Record<InvolvementStatus, string> = {
  occasional: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  staff_event: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  zone_leader: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  coordinator: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  alumni: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ──────────────────────────────────────────────
// APPLICATIONS — Queries & Mutations
// ──────────────────────────────────────────────

const APP_SELECT = `*, profile:profiles!volunteer_applications_user_id_fkey(id, username, display_name, avatar_url, city)`;

export function useVolunteerApplications(
  associationId: string | undefined,
  options?: { status?: ApplicationStatus; search?: string }
) {
  return useQuery({
    queryKey: ["volunteer-applications", associationId, options],
    queryFn: async () => {
      if (!associationId) return [];
      let query = supabase
        .from("volunteer_applications")
        .select(APP_SELECT)
        .eq("association_id", associationId)
        .order("created_at", { ascending: false });

      if (options?.status) query = query.eq("status", options.status);
      if (options?.search) {
        const q = `%${options.search}%`;
        query = query.or(
          `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VolunteerApplication[];
    },
    enabled: !!associationId,
  });
}

export function useVolunteerApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["volunteer-application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data, error } = await supabase
        .from("volunteer_applications")
        .select(APP_SELECT)
        .eq("id", applicationId)
        .single();
      if (error) throw error;
      return data as VolunteerApplication;
    },
    enabled: !!applicationId,
  });
}

export function useCreateVolunteerApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<VolunteerApplication> & { association_id: string }) => {
      const { data: result, error } = await supabase
        .from("volunteer_applications")
        .insert({ ...data, user_id: data.user_id || user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-applications"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      toast.success("Candidature créée !");
    },
    onError: () => toast.error("Erreur lors de la création de la candidature"),
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      applicationId,
      status,
      reviewNotes,
      rejectionReason,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      reviewNotes?: string;
      rejectionReason?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };
      if (reviewNotes) updates.review_notes = reviewNotes;
      if (rejectionReason) updates.rejection_reason = rejectionReason;
      if (status === "approved") updates.approved_at = new Date().toISOString();

      const { error } = await supabase
        .from("volunteer_applications")
        .update(updates)
        .eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-applications"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-application"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      const msg = status === "approved" ? "Candidature approuvée !" :
        status === "rejected" ? "Candidature refusée" : "Statut mis à jour";
      toast.success(msg);
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ──────────────────────────────────────────────
// MISSIONS — Queries & Mutations
// ──────────────────────────────────────────────

const MISSION_SELECT = `*, event:events(id, title, date, city), responsible:profiles!volunteer_missions_responsible_id_fkey(id, display_name, avatar_url)`;

export function useVolunteerMissions(
  associationId: string | undefined,
  options?: { status?: MissionStatus; eventId?: string }
) {
  return useQuery({
    queryKey: ["volunteer-missions", associationId, options],
    queryFn: async () => {
      if (!associationId) return [];
      let query = supabase
        .from("volunteer_missions")
        .select(MISSION_SELECT)
        .eq("association_id", associationId)
        .order("start_at", { ascending: true });

      if (options?.status) query = query.eq("status", options.status);
      if (options?.eventId) query = query.eq("event_id", options.eventId);

      const { data, error } = await query;
      if (error) throw error;
      return data as VolunteerMission[];
    },
    enabled: !!associationId,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      data: Omit<VolunteerMission, "id" | "slots_filled" | "created_at" | "updated_at" | "event" | "responsible" | "created_by">
    ) => {
      const { data: result, error } = await supabase
        .from("volunteer_missions")
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-missions"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      toast.success("Mission créée !");
    },
    onError: () => toast.error("Erreur lors de la création de la mission"),
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      missionId,
      updates,
    }: {
      missionId: string;
      updates: Partial<VolunteerMission>;
    }) => {
      const { error } = await supabase
        .from("volunteer_missions")
        .update(updates)
        .eq("id", missionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-missions"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      toast.success("Mission mise à jour !");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ──────────────────────────────────────────────
// SHIFTS — Queries & Mutations
// ──────────────────────────────────────────────

export function useMissionShifts(missionId: string | undefined) {
  return useQuery({
    queryKey: ["volunteer-shifts", missionId],
    queryFn: async () => {
      if (!missionId) return [];
      const { data, error } = await supabase
        .from("volunteer_shifts")
        .select("*")
        .eq("mission_id", missionId)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data as VolunteerShift[];
    },
    enabled: !!missionId,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<VolunteerShift, "id" | "slots_filled" | "created_at" | "status">) => {
      const { data: result, error } = await supabase
        .from("volunteer_shifts")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-shifts"] });
      toast.success("Créneau créé !");
    },
    onError: () => toast.error("Erreur lors de la création du créneau"),
  });
}

// ──────────────────────────────────────────────
// ASSIGNMENTS — Queries & Mutations
// ──────────────────────────────────────────────

const ASSIGN_SELECT = `*, profile:profiles!volunteer_assignments_user_id_fkey(id, username, display_name, avatar_url), mission:volunteer_missions(id, title, zone, start_at, end_at, status), shift:volunteer_shifts(id, title, start_at, end_at)`;

export function useVolunteerAssignments(
  associationId: string | undefined,
  options?: { status?: AssignmentStatus; missionId?: string; userId?: string }
) {
  return useQuery({
    queryKey: ["volunteer-assignments", associationId, options],
    queryFn: async () => {
      if (!associationId) return [];
      let query = supabase
        .from("volunteer_assignments")
        .select(ASSIGN_SELECT)
        .eq("association_id", associationId)
        .order("created_at", { ascending: false });

      if (options?.status) query = query.eq("status", options.status);
      if (options?.missionId) query = query.eq("mission_id", options.missionId);
      if (options?.userId) query = query.eq("user_id", options.userId);

      const { data, error } = await query;
      if (error) throw error;
      return data as VolunteerAssignment[];
    },
    enabled: !!associationId,
  });
}

export function useMyAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-volunteer-assignments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("volunteer_assignments")
        .select(ASSIGN_SELECT)
        .eq("user_id", user.id)
        .in("status", ["proposed", "confirmed", "checked_in"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VolunteerAssignment[];
    },
    enabled: !!user,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      association_id: string;
      user_id: string;
      mission_id: string;
      shift_id?: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("volunteer_assignments")
        .insert({
          ...data,
          proposed_by: user?.id,
          proposed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-missions"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      toast.success("Affectation créée !");
    },
    onError: () => toast.error("Erreur lors de l'affectation"),
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      status,
      notes,
    }: {
      assignmentId: string;
      status: AssignmentStatus;
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (notes) updates.notes = notes;
      if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
      if (status === "checked_in") updates.checked_in_at = new Date().toISOString();
      if (status === "completed") updates.completed_at = new Date().toISOString();
      if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from("volunteer_assignments")
        .update(updates)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-missions"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      const msgs: Record<string, string> = {
        confirmed: "Affectation confirmée !",
        checked_in: "Check-in effectué !",
        completed: "Mission terminée !",
        cancelled: "Affectation annulée",
        absent: "Absence enregistrée",
      };
      toast.success(msgs[status] || "Statut mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ──────────────────────────────────────────────
// DASHBOARD — Aggregated stats
// ──────────────────────────────────────────────

export function useVolunteerDashboard(associationId: string | undefined) {
  return useQuery({
    queryKey: ["volunteer-dashboard", associationId],
    queryFn: async (): Promise<VolunteerDashboardData> => {
      if (!associationId)
        return {
          pendingApplications: 0, activeVolunteers: 0, onboardingIncomplete: 0,
          openMissions: 0, unfilledSlots: 0, toConfirmShifts: 0,
          upcomingMissions: [], recentApplications: [],
          totalHours: 0, totalMissionsCompleted: 0, avgReliability: 100,
        };

      // Parallel queries
      const [
        appsRes, volunteersRes, missionsRes, assignmentsRes, recentAppsRes, upcomingRes,
      ] = await Promise.all([
        // Pending applications count
        supabase
          .from("volunteer_applications")
          .select("id", { count: "exact", head: true })
          .eq("association_id", associationId)
          .eq("status", "pending_review"),
        // Active volunteers count
        supabase
          .from("association_memberships")
          .select("id, total_hours_volunteered, total_missions_completed, reliability_score", { count: "exact" })
          .eq("association_id", associationId)
          .eq("is_active", true)
          .in("engagement_level", ["benevole_occasionnel", "benevole_actif", "staff"]),
        // Open missions
        supabase
          .from("volunteer_missions")
          .select("id, slots_needed, slots_filled", { count: "exact" })
          .eq("association_id", associationId)
          .in("status", ["open", "in_progress"]),
        // Proposed assignments (to confirm)
        supabase
          .from("volunteer_assignments")
          .select("id", { count: "exact", head: true })
          .eq("association_id", associationId)
          .eq("status", "proposed"),
        // Recent applications
        supabase
          .from("volunteer_applications")
          .select(APP_SELECT)
          .eq("association_id", associationId)
          .in("status", ["started", "incomplete", "pending_review"])
          .order("created_at", { ascending: false })
          .limit(5),
        // Upcoming missions
        supabase
          .from("volunteer_missions")
          .select(MISSION_SELECT)
          .eq("association_id", associationId)
          .in("status", ["open", "in_progress"])
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(5),
      ]);

      // Incomplete onboarding
      const { count: incompleteOnboarding } = await supabase
        .from("volunteer_applications")
        .select("id", { count: "exact", head: true })
        .eq("association_id", associationId)
        .in("status", ["started", "incomplete"]);

      // Compute unfilled slots
      const missions = missionsRes.data || [];
      const unfilledSlots = missions.reduce(
        (sum, m) => sum + Math.max((m as any).slots_needed - (m as any).slots_filled, 0), 0
      );

      // Compute aggregated stats from volunteers
      const volunteers = volunteersRes.data || [];
      const totalHours = volunteers.reduce(
        (sum, v) => sum + (Number((v as any).total_hours_volunteered) || 0), 0
      );
      const totalMissions = volunteers.reduce(
        (sum, v) => sum + (Number((v as any).total_missions_completed) || 0), 0
      );
      const avgReliability = volunteers.length > 0
        ? volunteers.reduce(
            (sum, v) => sum + (Number((v as any).reliability_score) || 100), 0
          ) / volunteers.length
        : 100;

      return {
        pendingApplications: appsRes.count || 0,
        activeVolunteers: volunteersRes.count || 0,
        onboardingIncomplete: incompleteOnboarding || 0,
        openMissions: missionsRes.count || 0,
        unfilledSlots,
        toConfirmShifts: assignmentsRes.count || 0,
        upcomingMissions: (upcomingRes.data || []) as VolunteerMission[],
        recentApplications: (recentAppsRes.data || []) as VolunteerApplication[],
        totalHours: Math.round(totalHours),
        totalMissionsCompleted: totalMissions,
        avgReliability: Math.round(avgReliability),
      };
    },
    enabled: !!associationId,
    staleTime: 2 * 60 * 1000,
  });
}
